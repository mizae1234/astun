"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Printer, Edit } from "lucide-react";
import { getOrders } from "@/actions/data";
import { updateOrderStatus } from "@/actions/mutations";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  RECEIVED: { label: "รับแล้ว", color: "bg-yellow-100 text-yellow-700", next: "PREPARING", nextLabel: "เริ่มจัดเตรียม" },
  PREPARING: { label: "กำลังจัดเตรียม", color: "bg-blue-100 text-blue-700", next: "READY", nextLabel: "พร้อมส่ง" },
  READY: { label: "พร้อมจัดส่ง", color: "bg-indigo-100 text-indigo-700", next: "OUT_FOR_DELIVERY", nextLabel: "ออกจัดส่ง" },
  OUT_FOR_DELIVERY: { label: "กำลังจัดส่ง", color: "bg-purple-100 text-purple-700", next: "DELIVERED", nextLabel: "จัดส่งแล้ว" },
  DELIVERED: { label: "จัดส่งแล้ว", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

  const load = useCallback((p: number, s: string) => {
    getOrders(p, 20, s).then((res: any) => {
      setOrders(res.data || []);
      setTotalPages(res.totalPages || 0);
    });
  }, []);

  useEffect(() => { load(1, ""); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => { setPage(1); load(1, val); }, 400));
  };

  const handleStatus = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    load(page, search);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">คำสั่งซื้อ</h2>
          <p className="text-sm text-gray-500">RECEIVED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED</p>
        </div>
        <Link href="/orders/create" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> สร้างคำสั่งซื้อ
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="ค้นหาเลขบิล / ชื่อลูกค้า / เบอร์โทร..." value={search} onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">เลขที่</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">ลูกค้า</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">สาขา</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">รายการ</th>
              <th className="text-right py-3.5 px-5 text-gray-500 font-medium">ยอดรวม</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">สถานะ</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">วันที่</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => {
              const config = statusConfig[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700" };
              return (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-blue-600">
                    <Link href={`/orders/${order.id}`} className="hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone || "-"}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="text-gray-600">{order.branch.name}</p>
                    <p className="text-xs text-gray-400">{order.company.name}</p>
                  </td>
                  <td className="py-3.5 px-5 text-center text-gray-900">{order.items.length}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-xs">{formatDateShort(order.createdAt)}</td>
                  <td className="py-3.5 px-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {config.next && (
                        <button onClick={() => handleStatus(order.id, config.next!)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                          {config.nextLabel}
                        </button>
                      )}
                      {order.status === "RECEIVED" && (
                        <Link href={`/orders/${order.id}/edit`}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors group"
                          title="แก้ไขคำสั่งซื้อ"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button onClick={() => handleStatus(order.id, "CANCELLED")}
                          className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                          ยกเลิก
                        </button>
                      )}
                      <button onClick={() => window.open(`/invoice/${order.id}`, '_blank')}
                        className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors group"
                        title="พิมพ์ใบแจ้งหนี้"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">ยังไม่มีคำสั่งซื้อ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); load(p, search); }} />
    </div>
  );
}
