"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

// --- Expense Categories ---

export async function getExpenseCategories() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.expenseCategory.findMany({
    where: { ...companyFilter, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createExpenseCategory(data: { name: string; description?: string }) {
  const user = await getSession();
  if (!user || (!user.companyId)) throw new Error("Unauthorized");

  // Check unique name per company
  const existing = await prisma.expenseCategory.findUnique({
    where: { companyId_name: { companyId: user.companyId, name: data.name } },
  });
  
  if (existing) throw new Error("หมวดหมู่นี้มีอยู่แล้ว");

  return prisma.expenseCategory.create({
    data: {
      name: data.name,
      description: data.description,
      companyId: user.companyId,
    },
  });
}

// --- Expenses ---

function generateExpenseNumber() {
  const prefix = "EXP-";
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // "YYMMDD"
  const rand = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${prefix}${dateStr}-${rand}`;
}

export async function getExpenses(page = 1, pageSize = 20, search = "", status = "") {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const where: any = { ...companyFilter, isActive: true };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { expenseNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } },
        bankAccount: { select: { bankName: true, accountNumber: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getExpenseById(id: string) {
  const user = await getSession();
  if (!user) return null;

  return prisma.expense.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      bankAccount: true,
    },
  });
}

export async function createExpense(data: {
  title: string;
  description?: string;
  amount: number;
  date: Date;
  paymentMethod?: string;
  bankAccountId?: string;
  categoryId: string;
}) {
  const user = await getSession();
  if (!user || !user.companyId || !user.branchId) throw new Error("Unauthorized");

  return prisma.expense.create({
    data: {
      ...data,
      expenseNumber: generateExpenseNumber(),
      companyId: user.companyId,
      branchId: user.branchId,
      createdById: user.id,
      status: "APPROVED", // Auto-approve for simplicity in this version
    },
  });
}

export async function updateExpense(id: string, data: {
  title: string;
  description?: string;
  amount: number;
  date: Date;
  paymentMethod?: string;
  bankAccountId?: string | null;
  categoryId: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");
  
  if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER" && existing.companyId !== user.companyId) {
    throw new Error("Unauthorized");
  }

  return prisma.expense.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount,
      date: data.date,
      paymentMethod: data.paymentMethod,
      categoryId: data.categoryId,
      bankAccountId: data.paymentMethod === "TRANSFER" ? data.bankAccountId : null,
    },
  });
}

export async function updateExpenseStatus(id: string, status: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.expense.update({
    where: { id },
    data: {
      status,
      approvedById: status === "APPROVED" ? user.id : undefined,
    },
  });
}

export async function deleteExpense(id: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  // Soft delete
  return prisma.expense.update({
    where: { id },
    data: { isActive: false },
  });
}
