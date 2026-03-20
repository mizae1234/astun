"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

export async function getDashboardStats() {
  const user = await getSession();
  if (!user) return null;

  // Build company filter based on role
  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    totalProducts,
    lowStockCount,
    pendingTransfers,
    recentOrders,
    lowStockItems,
  ] = await Promise.all([
    prisma.order.count({ where: companyFilter }),
    prisma.order.count({ where: { ...companyFilter, status: "RECEIVED" } }),
    prisma.order.count({
      where: {
        ...companyFilter,
        status: { in: ["PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
      },
    }),
    prisma.product.count({ where: companyFilter }),
    // Count low stock manually (can't reference column in where easily)
    prisma.stock.findMany({ where: companyFilter, select: { quantity: true, minQuantity: true } })
      .then(stocks => stocks.filter(s => s.quantity <= s.minQuantity).length)
      .catch(() => 0),
    prisma.stockTransfer.count({
      where: { status: "PENDING" },
    }),
    prisma.order.findMany({
      where: { ...companyFilter, status: { in: ["RECEIVED", "PREPARING"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        company: { select: { name: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.stock.findMany({
      where: companyFilter,
      orderBy: { quantity: "asc" },
      take: 5,
      include: {
        productVariant: {
          include: { product: { select: { name: true } } },
        },
        warehouse: { select: { name: true } },
      },
    }),
  ]);

  // Calculate total revenue from completed orders
  const revenueResult = await prisma.order.aggregate({
    where: {
      ...companyFilter,
      status: { in: ["DELIVERED"] },
    },
    _sum: { totalAmount: true },
  });

  const totalRevenue = revenueResult._sum.totalAmount || 0;

  return {
    stats: {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalProducts,
      lowStockCount,
      pendingTransfers,
      totalRevenue,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      status: o.status,
      companyName: o.company.name,
      branchName: o.branch.name,
      createdAt: o.createdAt.toISOString(),
    })),
    lowStockItems: lowStockItems.map((s) => ({
      id: s.id,
      productName: s.productVariant.product.name,
      variantName: s.productVariant.name,
      warehouseName: s.warehouse.name,
      quantity: s.quantity,
      minQuantity: s.minQuantity,
    })),
  };
}

export async function getProducts() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.product.findMany({
    where: { ...companyFilter, isActive: true },
    include: {
      category: { select: { name: true } },
      company: { select: { name: true } },
      variants: {
        where: { isActive: true },
        select: { id: true, sku: true, name: true, price: true, cost: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInventory(page = 1, pageSize = 20, search = "") {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const where: any = { ...companyFilter };
  if (search) {
    where.productVariant = { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
    ]};
  }

  const [data, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      include: {
        productVariant: {
          include: { product: { select: { name: true } } },
        },
        warehouse: {
          include: { branch: { include: { company: { select: { name: true } } } } },
        },
      },
      orderBy: { quantity: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stock.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getStockTransfers(page = 1, pageSize = 20) {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const [data, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where: companyFilter,
      include: {
        company: { select: { name: true } },
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
        requestedBy: { select: { name: true } },
        items: { include: { productVariant: { select: { name: true, sku: true } } } },
        logs: {
          include: { performedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockTransfer.count({ where: companyFilter }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getIntercompanyTransactions() {
  const user = await getSession();
  if (!user) return [];

  return prisma.intercompanyTransaction.findMany({
    include: {
      fromCompany: { select: { name: true } },
      toCompany: { select: { name: true } },
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: { include: { productVariant: { select: { name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrders(page = 1, pageSize = 20, search = "") {
  const user = await getSession();
  if (!user) return { data: [], total: 0, totalPages: 0, page: 1 };

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  const where: any = { ...companyFilter };
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        company: { select: { name: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: {
          include: { productVariant: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getCompanies() {
  return prisma.company.findMany({
    include: {
      _count: { select: { branches: true, users: true, products: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBranches() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.branch.findMany({
    where: companyFilter,
    include: {
      company: { select: { name: true } },
      _count: { select: { warehouses: true, users: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getWarehouses() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { company: { id: user.companyId! } };

  return prisma.warehouse.findMany({
    where: { branch: companyFilter },
    include: {
      branch: {
        select: { name: true, company: { select: { name: true } } },
      },
      _count: { select: { stocks: true } },
    },
    orderBy: { name: "asc" },
  });
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

export async function getVehiclesList() {
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

export async function getUsers() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.user.findMany({
    where: companyFilter,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      company: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}
