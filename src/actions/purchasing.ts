"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

export async function getPurchaseOrders(page = 1, pageSize = 20, search = "", status = "") {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const where: any = { ...companyFilter };
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getPurchaseOrderById(id: string) {
  const user = await getSession();
  if (!user) return null;

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true, category: { select: { name: true } } } } }
          }
        }
      },
      goodsReceivings: {
        select: { id: true, grNumber: true, createdAt: true, status: true }
      }
    }
  });
}

function generatePONumber() {
  const prefix = "PO-";
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // "YYMMDD"
  const rand = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${prefix}${dateStr}-${rand}`;
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  companyId: string;
  note?: string;
  expectedDate?: Date;
  items: {
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    expectedDate?: Date;
  }[]
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return prisma.purchaseOrder.create({
    data: {
      poNumber: generatePONumber(),
      supplierId: data.supplierId,
      companyId: data.companyId,
      status: "DRAFT",
      totalAmount,
      note: data.note,
      expectedDate: data.expectedDate,
      createdById: user.id,
      items: {
        create: data.items.map(i => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
          expectedDate: i.expectedDate
        }))
      }
    }
  });
}

export async function approvePurchaseOrder(id: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  // Optional: add stricter role checks if needed

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.status !== "DRAFT") throw new Error("Cannot approve this PO");

  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
    }
  });
}

export async function getApprovedPOsForReceiving(companyId: string) {
  return prisma.purchaseOrder.findMany({
    where: {
      companyId,
      status: { in: ["APPROVED", "PARTIAL_RECEIVED"] }
    },
    include: {
      supplier: { select: { id: true, name: true, phone: true } },
      items: {
         include: {
            productVariant: {
              include: { product: { select: { name: true } } }
            }
         }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}
