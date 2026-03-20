"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

/**
 * Search customer by phone number within a company
 * Returns the customer if found, null otherwise
 */
export async function searchCustomerByPhone(phone: string, companyId: string) {
  const user = await getSession();
  if (!user) return null;

  if (!phone || phone.length < 3) return null;

  const customer = await prisma.customer.findFirst({
    where: {
      phone: { contains: phone },
      companyId,
      isActive: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return customer;
}

/**
 * Upsert customer — create or update by phone + companyId
 * Called automatically when creating an order
 */
export async function upsertCustomer(data: {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  companyId: string;
}) {
  if (!data.phone) return null;

  const customer = await prisma.customer.upsert({
    where: {
      companyId_phone: {
        companyId: data.companyId,
        phone: data.phone,
      },
    },
    update: {
      name: data.name,
      email: data.email,
      address: data.address,
    },
    create: {
      phone: data.phone,
      name: data.name,
      email: data.email,
      address: data.address,
      companyId: data.companyId,
    },
  });

  return customer;
}
