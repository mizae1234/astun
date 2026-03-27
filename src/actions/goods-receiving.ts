"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

// ============================================================
// GOODS RECEIVING — CRUD + Stock Addition
// ============================================================

export async function createGoodsReceiving(data: {
  supplierName: string;
  supplierId?: string;
  purchaseOrderId?: string;
  supplierContact?: string;
  invoiceNumber?: string;
  warehouseId: string;
  companyId: string;
  items: { productVariantId: string; expectedQty: number; unitCost: number }[];
  note?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถสร้างข้อมูลได้");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) {
    throw new Error("ไม่สามารถสร้างใบรับสินค้าให้บริษัทอื่น");
  }

  const totalAmount = data.items.reduce((sum, i) => sum + i.unitCost * i.expectedQty, 0);
  const grNumber = `GR-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  const gr = await prisma.goodsReceiving.create({
    data: {
      grNumber,
      supplierName: data.supplierName,
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId,
      supplierContact: data.supplierContact,
      invoiceNumber: data.invoiceNumber,
      warehouseId: data.warehouseId,
      companyId: data.companyId,
      status: "PENDING",
      totalAmount,
      receivedById: user.id!,
      note: data.note,
      items: {
        create: data.items.map((i) => ({
          productVariantId: i.productVariantId,
          expectedQty: i.expectedQty,
          unitCost: i.unitCost,
          totalCost: i.unitCost * i.expectedQty,
        })),
      },
    },
  });

  return { success: true, grId: gr.id, grNumber: gr.grNumber };
}

export async function updateGoodsReceiving(grId: string, data: {
  supplierName: string;
  supplierId?: string;
  purchaseOrderId?: string;
  supplierContact?: string;
  invoiceNumber?: string;
  warehouseId: string;
  items: { productVariantId: string; expectedQty: number; unitCost: number }[];
  note?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถแก้ไขข้อมูลได้");

  const gr = await prisma.goodsReceiving.findUnique({ where: { id: grId } });
  if (!gr) throw new Error("ไม่พบรายการรับสินค้า");
  // Allow update only if PENDING or DRAFT. If INSPECTING, someone already started.
  if (gr.status !== "PENDING" && gr.status !== "DRAFT") {
    throw new Error("ไม่สามารถแก้ไขใบรับสินค้าที่ตรวจรับไปแล้วได้");
  }

  const totalAmount = data.items.reduce((sum, i) => sum + i.unitCost * i.expectedQty, 0);

  await prisma.$transaction([
    prisma.goodsReceivingItem.deleteMany({ where: { receivingId: grId } }),
    prisma.goodsReceiving.update({
      where: { id: grId },
      data: {
        supplierName: data.supplierName,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        supplierContact: data.supplierContact,
        invoiceNumber: data.invoiceNumber,
        warehouseId: data.warehouseId,
        totalAmount,
        note: data.note,
        items: {
          create: data.items.map((i) => ({
            productVariantId: i.productVariantId,
            expectedQty: i.expectedQty,
            unitCost: i.unitCost,
            totalCost: i.unitCost * i.expectedQty,
          })),
        },
      },
    })
  ]);

  return { success: true };
}

export async function deleteGoodsReceiving(grId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถลบข้อมูลได้");

  const gr = await prisma.goodsReceiving.findUnique({ where: { id: grId } });
  if (!gr) throw new Error("ไม่พบรายการรับสินค้า");
  if (gr.status !== "PENDING" && gr.status !== "DRAFT") {
    throw new Error("ลบได้เฉพาะใบรับสินค้าที่ยังไม่ผ่านการตรวจรับเท่านั้น");
  }

  await prisma.goodsReceivingItem.deleteMany({ where: { receivingId: grId } });
  await prisma.goodsReceiving.delete({ where: { id: grId } });
  return { success: true };
}

export async function completeGoodsReceiving(
  grId: string,
  receivedItems: { itemId: string; receivedQty: number; note?: string }[]
) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const gr = await prisma.goodsReceiving.findUnique({
    where: { id: grId },
    include: { items: true },
  });

  if (!gr) throw new Error("ไม่พบใบรับสินค้า");
  if (gr.status !== "PENDING" && gr.status !== "INSPECTING") {
    throw new Error("ใบรับสินค้าไม่ได้อยู่ในสถานะที่ตรวจรับได้");
  }

  // Company isolation
  if (user.role !== "SUPER_ADMIN" && user.companyId !== gr.companyId) {
    throw new Error("ไม่สามารถตรวจรับสินค้าของบริษัทอื่น");
  }

  // Execute atomic update
  const statusResult = await prisma.$transaction(async (tx) => {
    // Update each item's received qty
    let allComplete = true;
    for (const ri of receivedItems) {
      const item = gr.items.find((i) => i.id === ri.itemId);
      if (!item) continue;

      await tx.goodsReceivingItem.update({
        where: { id: ri.itemId },
        data: { receivedQty: ri.receivedQty, note: ri.note },
      });

      if (ri.receivedQty < item.expectedQty) allComplete = false;

      // Add stock to warehouse (only if receivedQty > 0)
      if (ri.receivedQty > 0) {
        await tx.stock.upsert({
          where: {
            productVariantId_warehouseId: {
              productVariantId: item.productVariantId,
              warehouseId: gr.warehouseId,
            },
          },
          update: { quantity: { increment: ri.receivedQty } },
          create: {
            productVariantId: item.productVariantId,
            warehouseId: gr.warehouseId,
            companyId: gr.companyId,
            quantity: ri.receivedQty,
            minQuantity: 0,
          },
        });
      }
    }

    // Update GR status
    await tx.goodsReceiving.update({
      where: { id: grId },
      data: {
        status: allComplete ? "COMPLETED" : "PARTIAL",
        completedAt: new Date(),
      },
    });

    // If this GR is linked to a PO, update the PO
    if (gr.purchaseOrderId) {
      const poItems = await tx.purchaseOrderItem.findMany({ where: { poId: gr.purchaseOrderId } });
      
      // Update PO item received quantities
      for (const ri of receivedItems) {
        if (ri.receivedQty > 0) {
          const item = gr.items.find(i => i.id === ri.itemId);
          if (item) {
            const poItem = poItems.find(pi => pi.productVariantId === item.productVariantId);
            if (poItem) {
              await tx.purchaseOrderItem.update({
                where: { id: poItem.id },
                data: { receivedQty: { increment: ri.receivedQty } }
              });
            }
          }
        }
      }

      // Check if PO is completely received
      const updatedPoItems = await tx.purchaseOrderItem.findMany({ where: { poId: gr.purchaseOrderId } });
      const isPoComplete = updatedPoItems.every(pi => pi.receivedQty >= pi.quantity);
      
      await tx.purchaseOrder.update({
        where: { id: gr.purchaseOrderId },
        data: {
          status: isPoComplete ? "COMPLETED" : "PARTIAL_RECEIVED",
          receivedDate: isPoComplete ? new Date() : null
        }
      });
    }

    return allComplete ? "COMPLETED" : "PARTIAL";
  });

  return { success: true, status: statusResult };
}

export async function getGoodsReceivingById(grId: string) {
  const user = await getSession();
  if (!user) return null;

  const gr = await prisma.goodsReceiving.findUnique({
    where: { id: grId },
    include: {
      warehouse: { select: { name: true } },
      company: { select: { name: true } },
      receivedBy: { select: { name: true } },
      purchaseOrder: { select: { poNumber: true } },
      supplier: { select: { name: true, code: true } },
      items: {
        include: {
          productVariant: {
            select: { name: true, sku: true, product: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!gr) return null;
  if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER" && user.companyId !== gr.companyId) {
    return null;
  }

  return gr;
}

export async function getGoodsReceivings(
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
  dateFrom = "",
  dateTo = ""
) {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const where: any = { ...companyFilter };

  if (search) {
    where.OR = [
      { grNumber: { contains: search, mode: "insensitive" } },
      { supplierName: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.goodsReceiving.findMany({
      where,
      include: {
        warehouse: { select: { name: true } },
        company: { select: { name: true } },
        receivedBy: { select: { name: true } },
        purchaseOrder: { select: { poNumber: true } },
        supplier: { select: { name: true } },
        items: {
          include: { productVariant: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.goodsReceiving.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

// ============================================================
// QUEUE QUERIES
// ============================================================

export async function getWarehouseQueue(categoryId?: string) {
  const user = await getSession();
  if (!user) return { received: [], preparing: [], ready: [] };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const baseWhere: any = { ...companyFilter };
  if (categoryId) {
    baseWhere.items = {
      some: {
        productVariant: {
          product: { categoryId }
        }
      }
    };
  }

  const [received, preparing, ready] = await Promise.all([
    prisma.order.findMany({
      where: { ...baseWhere, status: "RECEIVED" },
      include: {
        company: { select: { name: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: { include: { productVariant: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { ...baseWhere, status: "PREPARING" },
      include: {
        company: { select: { name: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: { include: { productVariant: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { ...baseWhere, status: "READY" },
      include: {
        company: { select: { name: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: { include: { productVariant: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { received, preparing, ready };
}

export async function getDeliveryQueue() {
  const user = await getSession();
  if (!user) return { ready: [], drivers: [] };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const [ready, drivers] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...companyFilter,
        status: "READY",
        // Exclude orders already assigned to a trip stop (unless that stop failed)
        NOT: {
          deliveryStops: {
            some: {
              status: { not: "FAILED" },
            },
          },
        },
      },
      include: {
        company: { select: { name: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { ...companyFilter, role: "STAFF", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return { ready, drivers };
}

// ============================================================
// POS — Get Products for catalog
// ============================================================

export async function getPOSProducts(companyId: string, warehouseId: string) {
  const user = await getSession();
  if (!user) return [];

  // Get regular products with stock in this warehouse
  const stocks = await prisma.stock.findMany({
    where: { companyId, warehouseId, quantity: { gt: 0 } },
    include: {
      productVariant: {
        include: {
          product: { select: { id: true, name: true, image: true, category: { select: { name: true } } } },
          unitConversions: { where: { isActive: true }, select: { id: true, unitName: true, qtyPerUnit: true, pricePerUnit: true } },
        },
      },
    },
  });

  const regularProducts = stocks.map((s: any) => ({
    stockId: s.id,
    variantId: s.productVariant.id,
    variantName: s.productVariant.name,
    sku: s.productVariant.sku,
    price: s.productVariant.price,
    productName: s.productVariant.product.name,
    productImage: s.productVariant.product.image,
    category: s.productVariant.product.category?.name || "",
    available: s.quantity,
    warehouseId,
    isSet: false,
    units: [
      { id: "piece", unitName: "ชิ้น", qtyPerUnit: 1, pricePerUnit: s.productVariant.price },
      ...s.productVariant.unitConversions,
    ],
  }));

  // Get product sets
  const sets = await prisma.productSet.findMany({
    where: { companyId, isActive: true },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              stocks: { where: { warehouseId }, select: { quantity: true } },
            },
          },
        },
      },
    },
  });

  const setProducts = sets.map((s: any) => {
    // Available = min stock across all items in the set
    const minAvailable = s.items.length > 0
      ? Math.min(...s.items.map((item: any) => {
          const stock = item.productVariant.stocks[0]?.quantity || 0;
          return Math.floor(stock / item.quantity);
        }))
      : 0;

    return {
      stockId: `set-${s.id}`,
      variantId: s.id,
      variantName: s.name,
      sku: s.sku,
      price: s.price,
      productName: s.name,
      productImage: s.image,
      category: "เซ็ตสินค้า",
      available: minAvailable,
      warehouseId,
      isSet: true,
      setItems: s.items.map((item: any) => ({
        variantId: item.productVariantId,
        variantName: item.productVariant.name,
        quantity: item.quantity,
      })),
      units: [
        { id: "piece", unitName: "เซ็ต", qtyPerUnit: 1, pricePerUnit: s.price },
      ],
    };
  }).filter((s: any) => s.available > 0);

  return [...regularProducts, ...setProducts];
}

export async function getCompanyWarehouses(companyId: string) {
  return prisma.warehouse.findMany({
    where: { branch: { companyId }, isActive: true },
    include: { branch: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}
