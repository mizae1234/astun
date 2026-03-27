"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, ClipboardCheck, CheckCircle, Filter, X, Calendar, Edit2, Trash2 } from "lucide-react";
import { getGoodsReceivings, deleteGoodsReceiving } from "@/actions/goods-receiving";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: "ร่าง", color: "bg-gray-100 text-gray-700", icon: "📝" },
  PENDING: { label: "รอตรวจรับ", color: "bg-yellow-100 text-yellow-700", icon: "⏳" },
  INSPECTING: { label: "กำลังตรวจ", color: "bg-blue-100 text-blue-700", icon: "🔍" },
  COMPLETED: { label: "ตรวจรับครบ", color: "bg-green-100 text-green-700", icon: "✅" },
  PARTIAL: { label: "รับบางส่วน", color: "bg-orange-100 text-orange-700", icon: "⚠️" },
  REJECTED: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700", icon: "❌" },
};

const statusOptions = [
  { value: "", label: "ทุกสถานะ" },
  { value: "PENDING", label: "⏳ รอตรวจรับ" },
  { value: "INSPECTING", label: "🔍 กำลังตรวจ" },
  { value: "COMPLETED", label: "✅ ตรวจรับครบ" },
  { value: "PARTIAL", label: "⚠️ รับบางส่วน" },
  { value: "REJECTED", label: "❌ ปฏิเสธ" },
];

export default function GoodsReceivingPage() {
  const [receivings, setReceivings] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(
    (p: number) => {
      getGoodsReceivings(p, 20, search, status, dateFrom, dateTo).then((res: any) => {
        setReceivings(res.data || []);
        setTotalPages(res.totalPages || 0);
        setTotal(res.total || 0);
      });
    },
    [search, status, dateFrom, dateTo]
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  const handleDelete = async (id: string, grNumber: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบใบรับสินค้า ${grNumber} ?`)) return;
    setIsDeleting(id);
    try {
      await deleteGoodsReceiving(id);
      load(page);
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบใบรับสินค้าได้");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = search || status || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">รับสินค้าเข้าคลัง</h2>
          <p className="text-sm text-gray-500">Goods Receiving — สร้างใบรับ → ตรวจรับ → เพิ่มสต็อก</p>
        </div>
        <Link href="/goods-receiving/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> สร้างใบรับสินค้า
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหา GR, Supplier, Invoice..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            ค้นหา
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            />
            <span className="text-gray-400 text-sm">ถึง</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-red-500 text-sm transition-colors"
            >
              <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
            </button>
          )}

          {/* Result count */}
          <span className="text-xs text-gray-400 ml-auto">
            พบ {total} รายการ
          </span>
        </div>
      </div>

      {receivings.length > 0 ? (
        <div className="space-y-3">
          {receivings.map((gr: any) => {
            const config = statusConfig[gr.status] || statusConfig.DRAFT;
            const totalItems = gr.items.reduce((sum: number, i: any) => sum + i.expectedQty, 0);
            const totalReceived = gr.items.reduce((sum: number, i: any) => sum + i.receivedQty, 0);

            return (
              <div key={gr.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{gr.grNumber}</p>
                      <p className="text-xs text-gray-400">{formatDateShort(gr.createdAt)} · {gr.company.name}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    {config.icon} {config.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3 mb-3">
                  <div><p className="text-xs text-gray-400">Supplier</p><p className="text-sm font-medium text-gray-900">{gr.supplierName}</p></div>
                  <div><p className="text-xs text-gray-400">คลังรับเข้า</p><p className="text-sm font-medium text-gray-900">{gr.warehouse.name}</p></div>
                  <div><p className="text-xs text-gray-400">มูลค่า</p><p className="text-sm font-bold text-emerald-600">{formatCurrency(gr.totalAmount)}</p></div>
                </div>
                <div className="space-y-1 mb-3">
                  {gr.items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate flex-1">{item.productVariant.name}</span>
                      <span className="text-gray-500 ml-2">
                        สั่ง {item.expectedQty} | รับ <span className={item.receivedQty >= item.expectedQty ? "text-green-600 font-medium" : item.receivedQty > 0 ? "text-orange-600 font-medium" : "text-gray-400"}>{item.receivedQty}</span>
                      </span>
                    </div>
                  ))}
                  {gr.items.length > 3 && <p className="text-xs text-gray-400">...อีก {gr.items.length - 3} รายการ</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${totalReceived >= totalItems ? "bg-green-500" : totalReceived > 0 ? "bg-orange-400" : "bg-gray-200"}`}
                      style={{ width: `${totalItems > 0 ? Math.min(100, (totalReceived / totalItems) * 100) : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{totalReceived}/{totalItems}</span>
                </div>
                {(gr.status === "PENDING" || gr.status === "INSPECTING" || gr.status === "DRAFT") && (
                  <div className="mt-3 flex justify-end gap-2">
                    {gr.status === "PENDING" || gr.status === "DRAFT" ? (
                      <>
                        <Link href={`/goods-receiving/${gr.id}/edit`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-100">
                          <Edit2 className="w-3 h-3" /> แก้ไข
                        </Link>
                        <button onClick={() => handleDelete(gr.id, gr.grNumber)} disabled={isDeleting === gr.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50">
                          <Trash2 className="w-3 h-3" /> ลบ
                        </button>
                      </>
                    ) : null}
                    <Link href={`/goods-receiving/${gr.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-100">
                      <CheckCircle className="w-3 h-3" /> {gr.status === "PENDING" || gr.status === "DRAFT" ? "เริ่มตรวจรับ" : "ตรวจรับต่อ"}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
          {hasFilters ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ยังไม่มีใบรับสินค้า"}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}
