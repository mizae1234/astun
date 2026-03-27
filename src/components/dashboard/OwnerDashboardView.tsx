"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DollarSign, ShoppingCart, TrendingDown, ClipboardCheck, Building2, Receipt, MapPin } from "lucide-react";
import { formatCurrency, formatDateShort, formatDate } from "@/lib/utils";

export default function OwnerDashboardView({ data }: { data: any }) {
  const { stats, revenueByBranch, recentOrders, recentExpenses } = data;

  const kpiCards = [
    {
      label: "รายได้จากยอดจัดส่งแล้ว",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "ค่าใช้จ่ายบริษัท (รวม)",
      value: formatCurrency(stats.totalExpenseAmount),
      icon: TrendingDown,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
    {
      label: "กำไรเบื้องต้น",
      value: formatCurrency(stats.netProfit),
      icon: DollarSign,
      iconBg: stats.netProfit >= 0 ? "bg-blue-100" : "bg-orange-100",
      iconColor: stats.netProfit >= 0 ? "text-blue-600" : "text-orange-600",
    },
    {
      label: "คำสั่งซื้อทั้งหมด",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "ใบสั่งซื้อทั้งหมด (PO)",
      value: stats.totalPOs.toLocaleString(),
      icon: ClipboardCheck,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ภาพรวมผู้บริหาร (Executive Dashboard)</h2>
          <p className="text-sm text-gray-500 mt-1">สรุปข้อมูลทางธุรกิจอย่างรวดเร็ว (รายได้, ค่าใช้จ่าย, ธุรกรรมสาขา)</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Branch Revenue Breakdown (Full Width on md, 1/3 on lg) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> ยอดจัดส่งรายสาขา (ท็อป 10)
          </h2>
          {revenueByBranch.length > 0 ? (
            <div className="space-y-4 flex-1">
              {revenueByBranch.map((branch: any, idx: number) => {
                const percent = stats.totalRevenue > 0 ? (branch.revenue / stats.totalRevenue) * 100 : 0;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {branch.branchName}
                        </p>
                        <p className="text-[10px] text-gray-400 ml-4.5">{branch.companyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 text-sm">{formatCurrency(branch.revenue)}</p>
                        <p className="text-[10px] text-gray-400">{percent.toFixed(1)}% ของทั้งหมด</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full bg-blue-500 group-hover:bg-blue-400 transition-all" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">ไม่มีข้อมูลสาขา</p>
          )}
        </div>

        {/* Recent Activities (2/3 width) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-500" /> คำสั่งซื้อล่าสุด
            </h2>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 text-sm break-all">{order.customerName}</span>
                      <span className="font-bold text-indigo-600 text-sm">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{order.orderNumber} · {order.branchName}</span>
                      <span className="text-gray-400">{formatDateShort(new Date(order.createdAt))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">ไม่มีคำสั่งซื้อล่าสุด</p>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-500" /> ค่าใช้จ่ายล่าสุด
            </h2>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense: any) => (
                  <div key={expense.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-red-100 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 text-sm break-words">{expense.title}</span>
                      <span className="font-bold text-rose-600 text-sm">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{expense.categoryName} · {expense.branchName}</span>
                      <span className="text-gray-400">{formatDateShort(new Date(expense.date))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">ไม่มีค่าใช้จ่ายล่าสุด</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
