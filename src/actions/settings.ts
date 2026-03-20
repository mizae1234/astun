"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

// ============================================================
// COMPANY SETTINGS
// ============================================================

export async function getCompanySettings(companyId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN" && user.companyId !== companyId) {
    throw new Error("ไม่มีสิทธิ์ดูข้อมูลบริษัทนี้");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { bankAccounts: { orderBy: { isDefault: "desc" } } },
  });

  return company;
}

export async function updateCompanySettings(companyId: string, data: {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logo?: string;
  invoicePrefix?: string;
  taxBranchCode?: string;
  taxBranchName?: string;
  invoiceAddress?: string;
  invoiceNote?: string;
  website?: string;
  fax?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถแก้ไขข้อมูลได้");
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
    throw new Error("ไม่มีสิทธิ์แก้ไขข้อมูลบริษัท");
  }
  if (user.role === "COMPANY_ADMIN" && user.companyId !== companyId) {
    throw new Error("ไม่สามารถแก้ไขข้อมูลบริษัทอื่น");
  }

  await prisma.company.update({ where: { id: companyId }, data });
  return { success: true };
}

// ============================================================
// BANK ACCOUNTS
// ============================================================

export async function addBankAccount(companyId: string, data: {
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  branchName?: string;
  accountType?: string;
  isDefault?: boolean;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "OWNER") throw new Error("OWNER ไม่สามารถสร้างข้อมูลได้");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== companyId) {
    throw new Error("ไม่สามารถเพิ่มบัญชีให้บริษัทอื่น");
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.bankAccount.create({
    data: { companyId, ...data },
  });

  return { success: true };
}

export async function updateBankAccount(accountId: string, data: {
  bankName?: string;
  bankCode?: string;
  accountName?: string;
  accountNumber?: string;
  branchName?: string;
  accountType?: string;
  isDefault?: boolean;
  isActive?: boolean;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("ไม่พบบัญชี");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== account.companyId) {
    throw new Error("ไม่มีสิทธิ์");
  }

  // If setting as default, unset others
  if (data.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { companyId: account.companyId, isDefault: true, id: { not: accountId } },
      data: { isDefault: false },
    });
  }

  await prisma.bankAccount.update({ where: { id: accountId }, data });
  return { success: true };
}

export async function deleteBankAccount(accountId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("ไม่พบบัญชี");
  if (user.role !== "SUPER_ADMIN" && user.companyId !== account.companyId) {
    throw new Error("ไม่มีสิทธิ์");
  }

  await prisma.bankAccount.delete({ where: { id: accountId } });
  return { success: true };
}
