"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
} from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";

export default function StandardDashboardView({ data }: { data: any }) {
  const { stats, recentOrders, lowStockItems } = data;

  const kpiCards = [
    {
      label: "คำสั่งซื้อทั้งหมด",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "รอดำเนินการ",
      value: stats.pendingOrders.toLocaleString(),
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "ดำเนินการแล้ว",
      value: stats.confirmedOrders.toLocaleString(),
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "รายได้รวม",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">คำสั่งซื้อล่าสุด</h2>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{order.orderNumber}</span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        {order.status === "RECEIVED" ? "รับแล้ว" : order.status === "PREPARING" ? "จัดเตรียม" : order.status}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{order.customerName} · {order.branchName}</span>
                    <span className="text-xs text-gray-400">{formatDateShort(new Date(order.createdAt))}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">ยังไม่มีคำสั่งซื้อ</p>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">สต็อกต่ำสุด</h2>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">สินค้า</th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">คลัง</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium">คงเหลือ</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium">ขั้นต่ำ</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-gray-900 text-xs">{item.productName}</p>
                        <p className="text-[11px] text-gray-400">{item.variantName}</p>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 text-xs">{item.warehouseName}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${item.quantity <= item.minQuantity ? "text-red-600" : "text-gray-900"}`}>
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{item.minQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">ไม่มีสินค้าสต็อกต่ำ</p>
          )}
        </div>
      </div>
    </div>
  );
}
