"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

export async function getSuppliers(page = 1, pageSize = 20, search = "") {
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
      { code: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getAllSuppliers(companyId: string) {
  const user = await getSession();
  if (!user) return [];

  return prisma.supplier.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createSupplier(data: {
  code: string;
  name: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  companyId: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  // Check unique code
  const existing = await prisma.supplier.findUnique({
    where: { companyId_code: { companyId: data.companyId, code: data.code } },
  });
  if (existing && existing.isActive) throw new Error("รหัสผู้จำหน่ายซ้ำ");

  return prisma.supplier.create({ data });
}

export async function updateSupplier(id: string, data: {
  name?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.supplier.update({ where: { id }, data });
}

export async function deleteSupplier(id: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.supplier.update({ where: { id }, data: { isActive: false } });
}
