"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

function generateTripNumber() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRIP-${dateStr}-${rand}`;
}

export async function getDeliveryTrips() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.deliveryTrip.findMany({
    where: companyFilter,
    include: {
      vehicle: { select: { licensePlate: true, name: true, type: true } },
      driver: { select: { name: true } },
      branch: { select: { name: true } },
      company: { select: { name: true } },
      stops: {
        include: { order: { select: { orderNumber: true, customerName: true, customerAddress: true } } },
        orderBy: { sequence: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getDeliveryTripById(tripId: string) {
  const user = await getSession();
  if (!user) return null;

  return prisma.deliveryTrip.findUnique({
    where: { id: tripId },
    include: {
      vehicle: { select: { licensePlate: true, name: true, type: true } },
      driver: { select: { name: true, phone: true } },
      branch: { select: { name: true, address: true } },
      company: { select: { name: true } },
      stops: {
        include: {
          order: {
            select: {
              id: true, orderNumber: true, customerName: true, customerPhone: true,
              customerAddress: true, totalAmount: true, status: true, note: true,
              items: { include: { productVariant: { select: { name: true } } } },
            },
          },
        },
        orderBy: { sequence: "asc" },
      },
    },
  });
}

export async function getPlannedTrips() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.deliveryTrip.findMany({
    where: { ...companyFilter, status: "PLANNED" },
    include: {
      vehicle: { select: { licensePlate: true, name: true } },
      driver: { select: { name: true } },
      branch: { select: { name: true, address: true } },
      company: { select: { name: true } },
      stops: true,
    },
    orderBy: { date: "asc" },
  });
}

export async function createDeliveryTrip(data: {
  date: string;
  vehicleId?: string;
  driverId?: string;
  branchId: string;
  companyId: string;
  note?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const tripNumber = generateTripNumber();

  const trip = await prisma.deliveryTrip.create({
    data: {
      tripNumber,
      date: new Date(data.date),
      vehicleId: data.vehicleId || null,
      driverId: data.driverId || null,
      branchId: data.branchId,
      companyId: data.companyId,
      note: data.note,
    },
  });

  // Mark vehicle as IN_USE if assigned
  if (data.vehicleId) {
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: "IN_USE" },
    });
  }

  return trip;
}

export async function addStopToTrip(tripId: string, orderId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  // Get max sequence
  const maxStop = await prisma.deliveryStop.findFirst({
    where: { tripId },
    orderBy: { sequence: "desc" },
  });

  return prisma.deliveryStop.create({
    data: {
      tripId,
      orderId,
      sequence: (maxStop?.sequence || 0) + 1,
    },
  });
}

export async function removeStopFromTrip(stopId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  await prisma.deliveryStop.delete({ where: { id: stopId } });
  return { success: true };
}

export async function updateStopStatus(
  stopId: string,
  status: "PENDING" | "ARRIVED" | "DELIVERED" | "FAILED",
  note?: string
) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const data: any = { status, note };
  if (status === "ARRIVED") data.arrivedAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();

  const stop = await prisma.deliveryStop.update({
    where: { id: stopId },
    data,
    include: { order: true },
  });

  // Sync order status
  if (status === "DELIVERED" && stop.orderId) {
    await prisma.order.update({
      where: { id: stop.orderId },
      data: { status: "DELIVERED" },
    });
  }

  if (status === "FAILED" && stop.orderId) {
    // Set order back to READY so it re-enters the delivery queue
    await prisma.order.update({
      where: { id: stop.orderId },
      data: { status: "READY" },
    });
  }

  return stop;
}

export async function startTrip(tripId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const trip = await prisma.deliveryTrip.update({
    where: { id: tripId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  if (trip.vehicleId) {
    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "IN_USE" },
    });
  }

  return trip;
}

export async function completeTrip(tripId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const trip = await prisma.deliveryTrip.update({
    where: { id: tripId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  if (trip.vehicleId) {
    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE" },
    });
  }

  return trip;
}
