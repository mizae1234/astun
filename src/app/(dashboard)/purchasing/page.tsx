import { ClipboardCheck, Plus, Search, Calendar, ChevronRight } from "lucide-react";
import { getPurchaseOrders } from "@/actions/purchasing";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "ร่าง", color: "bg-gray-100 text-gray-700" },
  PENDING: { label: "รออนุมัติ", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "อนุมัติแล้ว", color: "bg-emerald-100 text-emerald-700" },
  IN_PRODUCTION: { label: "อยู่ระหว่างการผลิต", color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "ขึ้นตู้", color: "bg-indigo-100 text-indigo-700" },
  ARRIVED_AT_PORT: { label: "ถึงท่าเรือไทย", color: "bg-cyan-100 text-cyan-700" },
  PARTIAL_RECEIVED: { label: "รับบางส่วน", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "รับครบแล้ว", color: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
};

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const status = searchParams.status || "";

  const poData = await getPurchaseOrders(page, 20, search, status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ใบสั่งซื้อ (Purchase Orders)</h2>
          <p className="text-sm text-gray-500">จัดการรายการสั่งซื้อสินค้าจากผู้จำหน่าย</p>
        </div>
        <Link href="/purchasing/create" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          สร้างใบสั่งซื้อ
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              defaultValue={search}
              placeholder="ค้นหาเลขที่ PO, ชื่อผู้จำหน่าย..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" 
            />
          </div>
          <select className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">ทุกสถานะ</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold">เลขที่ใบสั่งซื้อ</th>
                <th className="px-6 py-4 font-semibold">ผู้จำหน่าย</th>
                <th className="px-6 py-4 font-semibold">กำหนดส่ง</th>
                <th className="px-6 py-4 font-semibold text-right">ยอดรวม</th>
                <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {poData.data.map((po) => {
                const badge = statusConfig[po.status] || { label: po.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {po.poNumber}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(po.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{po.supplier.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {po.expectedDate ? (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(po.expectedDate)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ฿{po.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/purchasing/${po.id}`} className="inline-flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700">
                        รายละเอียด <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {poData.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    ไม่พบข้อมูลใบสั่งซื้อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
