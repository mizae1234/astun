"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";
import { generateOrderNumber, generateTransferNumber } from "@/lib/utils";

// ============================================================
// ORDER CRUD + STOCK DEDUCTION
// ============================================================

export async function createOrder(data: {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  items: { productVariantId: string; quantity: number; unitPrice: number; warehouseId?: string }[];
  note?: string;
  discount?: number;
  discountType?: string; // "percent" | "fixed"
  addonAmount?: number;
  addonLabel?: string;
  paymentMethod?: string; // "CASH" | "TRANSFER" | "CREDIT"
  dueDate?: string;       // ISO date for credit
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถสร้างข้อมูลได้");

  // Enforce company isolation
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) {
    throw new Error("ไม่สามารถสร้างคำสั่งซื้อให้บริษัทอื่น");
  }

  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Calculate discount
  let discountValue = 0;
  if (data.discount && data.discount > 0) {
    discountValue = data.discountType === "percent"
      ? subtotal * (data.discount / 100)
      : data.discount;
  }

  const addonAmount = data.addonAmount || 0;
  const totalAmount = Math.max(0, subtotal - discountValue + addonAmount);

  // Check stock availability first
  for (const item of data.items) {
    const whId = item.warehouseId || data.warehouseId;
    const stock = await prisma.stock.findUnique({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: whId,
        },
      },
    });
    if (!stock || stock.quantity < item.quantity) {
      const variant = await prisma.productVariant.findUnique({ where: { id: item.productVariantId } });
      throw new Error(`สต็อกไม่เพียงพอ: ${variant?.name || item.productVariantId} (ต้องการ ${item.quantity}, มี ${stock?.quantity || 0})`);
    }
  }

  // Upsert customer if phone is provided
  let customerId: string | undefined;
  if (data.customerPhone) {
    const customer = await prisma.customer.upsert({
      where: { companyId_phone: { companyId: data.companyId, phone: data.customerPhone } },
      update: { name: data.customerName, address: data.customerAddress },
      create: { phone: data.customerPhone, name: data.customerName, address: data.customerAddress, companyId: data.companyId },
    });
    customerId = customer.id;
  }

  // Create order + deduct stock in sequence
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      status: "RECEIVED",
      subtotal,
      discount: discountValue,
      discountType: data.discountType,
      addonAmount,
      addonLabel: data.addonLabel,
      totalAmount,
      paymentMethod: data.paymentMethod || "CASH",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      companyId: data.companyId,
      branchId: data.branchId,
      warehouseId: data.warehouseId,
      note: data.note,
      items: {
        create: data.items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      },
    },
  });

  // Deduct stock
  for (const item of data.items) {
    const whId = item.warehouseId || data.warehouseId;
    await prisma.stock.update({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: whId,
        },
      },
      data: { quantity: { decrement: item.quantity } },
    });
  }

  return { success: true, orderId: order.id, orderNumber: order.orderNumber };
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถแก้ไขข้อมูลได้");

  const validFlow: Record<string, string[]> = {
    RECEIVED: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY: ["OUT_FOR_DELIVERY", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error("ไม่พบคำสั่งซื้อ");

  // Company isolation
  if (user.role !== "SUPER_ADMIN" && user.companyId !== order.companyId) {
    throw new Error("ไม่สามารถแก้ไขคำสั่งซื้อของบริษัทอื่น");
  }

  const allowed = validFlow[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น ${newStatus}`);
  }

  // If cancelling, restore stock
  if (newStatus === "CANCELLED") {
    for (const item of order.items) {
      await prisma.stock.update({
        where: {
          productVariantId_warehouseId: {
            productVariantId: item.productVariantId,
            warehouseId: order.warehouseId,
          },
        },
        data: { quantity: { increment: item.quantity } },
      });
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus as "RECEIVED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" },
  });

  return { success: true };
}

// ============================================================
// STOCK TRANSFER (SAME COMPANY ONLY)
// ============================================================

export async function createStockTransfer(data: {
  companyId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  items: { productVariantId: string; quantity: number }[];
  note?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถสร้างข้อมูลได้");

  // Company isolation
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) {
    throw new Error("ไม่สามารถสร้างใบโอนสต็อกให้บริษัทอื่น");
  }

  // Verify both warehouses belong to the same company
  const fromWh = await prisma.warehouse.findUnique({
    where: { id: data.fromWarehouseId },
    include: { branch: { select: { companyId: true } } },
  });
  const toWh = await prisma.warehouse.findUnique({
    where: { id: data.toWarehouseId },
    include: { branch: { select: { companyId: true } } },
  });

  if (!fromWh || !toWh) throw new Error("คลังสินค้าไม่ถูกต้อง");
  if (fromWh.branch.companyId !== data.companyId || toWh.branch.companyId !== data.companyId) {
    throw new Error("คลังสินค้าต้องอยู่ในบริษัทเดียวกัน — ใช้ Intercompany Transaction สำหรับข้ามบริษัท");
  }

  if (data.fromWarehouseId === data.toWarehouseId) {
    throw new Error("คลังต้นทางและปลายทางต้องไม่เหมือนกัน");
  }

  const transfer = await prisma.stockTransfer.create({
    data: {
      transferNumber: generateTransferNumber(),
      companyId: data.companyId,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      status: "PENDING",
      note: data.note,
      requestedById: user.id!,
      items: {
        create: data.items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        })),
      },
      logs: {
        create: [{ action: "CREATED", performedById: user.id!, note: "สร้างใบโอนสต็อก" }],
      },
    },
  });

  return { success: true, transferId: transfer.id, transferNumber: transfer.transferNumber };
}

export async function approveStockTransfer(transferId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER" || user.role === "STAFF") {
    throw new Error("ไม่มีสิทธิ์อนุมัติใบโอนสต็อก");
  }

  const transfer = await prisma.stockTransfer.findUnique({
    where: { id: transferId },
    include: { items: true },
  });

  if (!transfer) throw new Error("ไม่พบใบโอนสต็อก");
  if (transfer.status !== "PENDING") throw new Error("ใบโอนสต็อกไม่ได้อยู่ในสถานะรออนุมัติ");

  // Company isolation
  if (user.role !== "SUPER_ADMIN" && user.companyId !== transfer.companyId) {
    throw new Error("ไม่สามารถอนุมัติใบโอนของบริษัทอื่น");
  }

  // Check stock availability
  for (const item of transfer.items) {
    const stock = await prisma.stock.findUnique({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: transfer.fromWarehouseId,
        },
      },
    });
    if (!stock || stock.quantity < item.quantity) {
      throw new Error(`สต็อกต้นทางไม่เพียงพอสำหรับ variant ${item.productVariantId}`);
    }
  }

  // Deduct from source, add to destination
  for (const item of transfer.items) {
    // Deduct source
    await prisma.stock.update({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: transfer.fromWarehouseId,
        },
      },
      data: { quantity: { decrement: item.quantity } },
    });

    // Add to destination (upsert in case stock record doesn't exist)
    await prisma.stock.upsert({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: transfer.toWarehouseId,
        },
      },
      update: { quantity: { increment: item.quantity } },
      create: {
        productVariantId: item.productVariantId,
        warehouseId: transfer.toWarehouseId,
        companyId: transfer.companyId,
        quantity: item.quantity,
        minQuantity: 0,
      },
    });
  }

  // Update transfer status
  await prisma.stockTransfer.update({
    where: { id: transferId },
    data: {
      status: "COMPLETED",
      approvedById: user.id,
    },
  });

  // Log
  await prisma.stockTransferLog.create({
    data: {
      transferId,
      action: "APPROVED & COMPLETED",
      performedById: user.id!,
      note: "อนุมัติและโอนสต็อกเรียบร้อย",
    },
  });

  return { success: true };
}

export async function rejectStockTransfer(transferId: string, reason?: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const transfer = await prisma.stockTransfer.findUnique({ where: { id: transferId } });
  if (!transfer) throw new Error("ไม่พบใบโอนสต็อก");
  if (transfer.status !== "PENDING") throw new Error("ใบโอนไม่ได้อยู่ในสถานะรออนุมัติ");

  await prisma.stockTransfer.update({
    where: { id: transferId },
    data: { status: "REJECTED", approvedById: user.id },
  });

  await prisma.stockTransferLog.create({
    data: {
      transferId,
      action: "REJECTED",
      performedById: user.id!,
      note: reason || "ปฏิเสธใบโอนสต็อก",
    },
  });

  return { success: true };
}

// ============================================================
// INTERCOMPANY TRANSACTION (ข้ามบริษัท)
// ============================================================

export async function createIntercompanyTransaction(data: {
  fromCompanyId: string;
  toCompanyId: string;
  items: { productVariantId: string; quantity: number; unitPrice: number }[];
  note?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถสร้างข้อมูลได้");
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
    throw new Error("เฉพาะ Admin เท่านั้นที่สามารถสร้าง Intercompany Transaction");
  }

  if (data.fromCompanyId === data.toCompanyId) {
    throw new Error("ต้องเป็นคนละบริษัท — ใช้ Stock Transfer สำหรับภายในบริษัทเดียวกัน");
  }

  const totalAmount = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const txNumber = `IC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  const tx = await prisma.intercompanyTransaction.create({
    data: {
      transactionNumber: txNumber,
      fromCompanyId: data.fromCompanyId,
      toCompanyId: data.toCompanyId,
      status: "PENDING",
      totalAmount,
      createdById: user.id!,
      note: data.note,
      items: {
        create: data.items.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
        })),
      },
    },
  });

  return { success: true, transactionId: tx.id, transactionNumber: tx.transactionNumber };
}

export async function approveIntercompanyTransaction(transactionId: string, fromWarehouseId: string, toWarehouseId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("เฉพาะ SUPER_ADMIN เท่านั้นที่อนุมัติ Intercompany Transaction");
  }

  const tx = await prisma.intercompanyTransaction.findUnique({
    where: { id: transactionId },
    include: { items: true },
  });

  if (!tx) throw new Error("ไม่พบ Transaction");
  if (tx.status !== "PENDING") throw new Error("Transaction ไม่ได้อยู่ในสถานะรออนุมัติ");

  // Verify warehouses belong to correct companies
  const fromWh = await prisma.warehouse.findUnique({
    where: { id: fromWarehouseId },
    include: { branch: { select: { companyId: true } } },
  });
  const toWh = await prisma.warehouse.findUnique({
    where: { id: toWarehouseId },
    include: { branch: { select: { companyId: true } } },
  });

  if (!fromWh || fromWh.branch.companyId !== tx.fromCompanyId) {
    throw new Error("คลังต้นทางต้องอยู่ในบริษัทต้นทาง");
  }
  if (!toWh || toWh.branch.companyId !== tx.toCompanyId) {
    throw new Error("คลังปลายทางต้องอยู่ในบริษัทปลายทาง");
  }

  // Check stock availability in source company
  for (const item of tx.items) {
    const stock = await prisma.stock.findUnique({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: fromWarehouseId,
        },
      },
    });
    if (!stock || stock.quantity < item.quantity) {
      throw new Error(`สต็อกบริษัทต้นทางไม่เพียงพอ`);
    }
  }

  // Execute transfer: Deduct from Company A, Add to Company B
  for (const item of tx.items) {
    // Company A: Deduct stock
    await prisma.stock.update({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: fromWarehouseId,
        },
      },
      data: { quantity: { decrement: item.quantity } },
    });

    // Company B: Add stock (upsert)
    await prisma.stock.upsert({
      where: {
        productVariantId_warehouseId: {
          productVariantId: item.productVariantId,
          warehouseId: toWarehouseId,
        },
      },
      update: { quantity: { increment: item.quantity } },
      create: {
        productVariantId: item.productVariantId,
        warehouseId: toWarehouseId,
        companyId: tx.toCompanyId,
        quantity: item.quantity,
        minQuantity: 0,
      },
    });
  }

  // Update status
  await prisma.intercompanyTransaction.update({
    where: { id: transactionId },
    data: { status: "COMPLETED", approvedById: user.id },
  });

  return { success: true };
}

// ============================================================
// INVENTORY CRUD
// ============================================================

export async function adjustStock(data: {
  productVariantId: string;
  warehouseId: string;
  companyId: string;
  quantity: number; // positive = add, negative = deduct
  minQuantity?: number;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถแก้ไขข้อมูลได้");

  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) {
    throw new Error("ไม่สามารถแก้ไขสต็อกของบริษัทอื่น");
  }

  const stock = await prisma.stock.upsert({
    where: {
      productVariantId_warehouseId: {
        productVariantId: data.productVariantId,
        warehouseId: data.warehouseId,
      },
    },
    update: {
      quantity: { increment: data.quantity },
      ...(data.minQuantity !== undefined ? { minQuantity: data.minQuantity } : {}),
    },
    create: {
      productVariantId: data.productVariantId,
      warehouseId: data.warehouseId,
      companyId: data.companyId,
      quantity: Math.max(0, data.quantity),
      minQuantity: data.minQuantity || 0,
    },
  });

  return { success: true, newQuantity: stock.quantity };
}

// ============================================================
// BASIC ENTITY CRUD
// ============================================================

export async function createCompany(data: { name: string; code: string; address?: string; phone?: string; email?: string; taxId?: string }) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "SUPER_ADMIN") throw new Error("เฉพาะ SUPER_ADMIN เท่านั้น");

  return prisma.company.create({ data });
}

export async function createBranch(data: { name: string; code: string; companyId: string; address?: string; phone?: string }) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER" || user.role === "STAFF") throw new Error("ไม่มีสิทธิ์");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) throw new Error("ไม่สามารถสร้างสาขาให้บริษัทอื่น");

  return prisma.branch.create({ data });
}

export async function updateBranch(branchId: string, data: { name?: string; address?: string; phone?: string; isActive?: boolean }) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER" || user.role === "STAFF") throw new Error("ไม่มีสิทธิ์");

  const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { companyId: true } });
  if (!branch) throw new Error("ไม่พบสาขา");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== branch.companyId) throw new Error("ไม่สามารถแก้ไขสาขาของบริษัทอื่น");

  return prisma.branch.update({ where: { id: branchId }, data });
}

export async function createWarehouse(data: { name: string; code: string; branchId: string; address?: string }) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const branch = await prisma.branch.findUnique({ where: { id: data.branchId }, select: { companyId: true } });
  if (!branch) throw new Error("ไม่พบสาขา");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== branch.companyId) throw new Error("ไม่สามารถสร้างคลังสินค้าให้บริษัทอื่น");

  return prisma.warehouse.create({ data });
}

export async function createProduct(data: {
  name: string; slug: string; companyId: string; categoryId?: string; description?: string; image?: string;
  variants: { sku: string; name: string; price: number; cost: number; size?: string; color?: string; material?: string }[];
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) throw new Error("ไม่สามารถสร้างสินค้าให้บริษัทอื่น");

  return prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      companyId: data.companyId,
      categoryId: data.categoryId,
      description: data.description,
      image: data.image,
      variants: { create: data.variants },
    },
    include: { variants: true },
  });
}

export async function createRoute(data: {
  date: string; companyId: string; branchId: string; vehicleId?: string; driverId?: string; note?: string;
  orderIds: string[];
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) throw new Error("ไม่สามารถสร้างรอบจัดส่งให้บริษัทอื่น");

  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const tripNumber = `TRIP-${dateStr}-${rand}`;

  return prisma.deliveryTrip.create({
    data: {
      tripNumber,
      date: new Date(data.date),
      companyId: data.companyId,
      branchId: data.branchId,
      vehicleId: data.vehicleId || null,
      driverId: data.driverId || null,
      note: data.note,
      stops: {
        create: data.orderIds.map((orderId, i) => ({
          orderId,
          sequence: i + 1,
        })),
      },
    },
    include: { stops: true },
  });
}
