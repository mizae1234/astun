"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

export async function getSalesReportData(startDateIso: string, endDateIso: string, branchId?: string) {
  const user = await getSession();
  if (!user) return null;

  const startDate = new Date(startDateIso);
  const endDate = new Date(endDateIso);
  endDate.setHours(23, 59, 59, 999); // end of day

  const companyFilter: any =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  if (branchId) {
    companyFilter.branchId = branchId;
  }

  // Fetch all delivered orders in date range
  const orders = await prisma.order.findMany({
    where: {
      ...companyFilter,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "DELIVERED",
    },
    include: {
      branch: { select: { name: true } },
      items: {
        include: {
          productVariant: {
            include: { product: true }
          }
        }
      }
    }
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Group by Date for Chart
  const dailySalesMap = new Map<string, number>();
  // Group by Product for Top Products
  const productMap = new Map<string, { id: string, name: string, variant: string, qty: number, revenue: number }>();
  // Group by Branch
  const branchMap = new Map<string, { id: string, name: string, revenue: number, orders: number }>();

  for (const order of orders) {
    const dateStr = order.createdAt.toISOString().split("T")[0];
    dailySalesMap.set(dateStr, (dailySalesMap.get(dateStr) || 0) + order.totalAmount);

    // Branch grouping
    const bId = order.branchId;
    if (!branchMap.has(bId)) {
      branchMap.set(bId, { id: bId, name: order.branch?.name || "ไม่ระบุสาขา", revenue: 0, orders: 0 });
    }
    const b = branchMap.get(bId)!;
    b.revenue += order.totalAmount;
    b.orders += 1;

    for (const item of order.items) {
      const vid = item.productVariantId;
      if (!productMap.has(vid)) {
        productMap.set(vid, {
          id: vid,
          name: item.productVariant.product?.name || "Unknown",
          variant: item.productVariant.name,
          qty: 0,
          revenue: 0,
        });
      }
      const p = productMap.get(vid)!;
      p.qty += item.quantity;
      p.revenue += item.totalPrice; // This is before order-level discount, but good enough for product rank
    }
  }

  // Generate continuous date array for the chart
  const chartData = [];
  const curr = new Date(startDate);
  curr.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(0,0,0,0);
  
  let maxRevenue = 0;
  
  while (curr <= end) {
    const dateStr = curr.toISOString().split("T")[0];
    const revenue = dailySalesMap.get(dateStr) || 0;
    if (revenue > maxRevenue) maxRevenue = revenue;
    
    chartData.push({
      date: dateStr,
      revenue,
    });
    curr.setDate(curr.getDate() + 1);
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const revenueByBranch = Array.from(branchMap.values())
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    chartData,
    maxDailyRevenue: maxRevenue,
    topProducts,
    revenueByBranch,
  };
}
