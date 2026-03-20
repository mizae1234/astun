"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

// ============================================================
// PRODUCT DETAIL
// ============================================================

export async function getProductById(productId: string) {
  const user = await getSession();
  if (!user) return null;

  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      company: { select: { name: true } },
      category: { select: { name: true } },
      variants: {
        include: {
          stocks: { include: { warehouse: { select: { name: true, branch: { select: { name: true } } } } } },
          unitConversions: { orderBy: { unitName: "asc" } },
          orderItems: {
            include: { order: { select: { orderNumber: true, createdAt: true, status: true, customerName: true } } },
            orderBy: { order: { createdAt: "desc" } },
            take: 30,
          },
          goodsReceivingItems: {
            include: { receiving: { select: { grNumber: true, createdAt: true, supplierName: true } } },
            orderBy: { receiving: { createdAt: "desc" } },
            take: 30,
          },
        },
      },
    },
  });
}

export async function updateVariant(variantId: string, data: {
  name?: string; sku?: string; barcode?: string; price?: number; cost?: number;
  size?: string; color?: string; material?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return prisma.productVariant.update({ where: { id: variantId }, data });
}

// ============================================================
// PRODUCT SET CRUD
// ============================================================

export async function getProductSets() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.productSet.findMany({
    where: { ...companyFilter, isActive: true },
    include: {
      company: { select: { name: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProductSet(data: {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  image?: string;
  price: number;
  companyId: string;
  items: { productVariantId: string; quantity: number }[];
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถสร้างข้อมูลได้");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== data.companyId) {
    throw new Error("ไม่สามารถสร้าง Set ให้บริษัทอื่น");
  }

  return prisma.productSet.create({
    data: {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      description: data.description,
      image: data.image,
      price: data.price,
      companyId: data.companyId,
      items: {
        create: data.items.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
        })),
      },
    },
    include: { items: true },
  });
}

export async function deleteProductSet(setId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const set = await prisma.productSet.findUnique({ where: { id: setId } });
  if (!set) throw new Error("ไม่พบ Set");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== set.companyId) {
    throw new Error("ไม่มีสิทธิ์");
  }

  await prisma.productSet.update({ where: { id: setId }, data: { isActive: false } });
  return { success: true };
}

// ============================================================
// UNIT CONVERSION CRUD
// ============================================================

export async function getUnitConversions(productVariantId: string) {
  return prisma.unitConversion.findMany({
    where: { productVariantId, isActive: true },
    orderBy: { qtyPerUnit: "asc" },
  });
}

export async function createUnitConversion(data: {
  productVariantId: string;
  unitName: string;
  qtyPerUnit: number;
  pricePerUnit: number;
  barcode?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.unitConversion.create({ data });
}

export async function deleteUnitConversion(id: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  await prisma.unitConversion.delete({ where: { id } });
  return { success: true };
}

// ============================================================
// PRODUCTS WITH UNITS (for product page)
// ============================================================

export async function getProductsWithUnits(page = 1, pageSize = 20, search = "") {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const where: any = { ...companyFilter, isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
      { variants: { some: { barcode: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        company: { select: { name: true } },
        category: { select: { name: true } },
        variants: {
          where: { isActive: true },
          include: {
            stocks: { select: { quantity: true, warehouse: { select: { name: true } } } },
            unitConversions: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

