"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

export async function getVehicles() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.vehicle.findMany({
    where: { branch: companyFilter, isActive: true },
    include: {
      branch: {
        select: { name: true, company: { select: { name: true } } },
      },
      _count: { select: { trips: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createVehicle(data: {
  licensePlate: string;
  name?: string;
  type?: string;
  branchId: string;
  note?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.vehicle.create({ data });
}

export async function updateVehicle(
  id: string,
  data: { licensePlate?: string; name?: string; type?: string; note?: string }
) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.vehicle.update({ where: { id }, data });
}

export async function updateVehicleStatus(
  id: string,
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE"
) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  return prisma.vehicle.update({ where: { id }, data: { status } });
}

export async function deleteVehicle(id: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  await prisma.vehicle.update({ where: { id }, data: { isActive: false } });
  return { success: true };
}
