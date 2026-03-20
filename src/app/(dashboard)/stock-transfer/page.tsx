"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRightLeft, Plus, Search, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { getStockTransfers } from "@/actions/data";
import { approveStockTransfer, rejectStockTransfer } from "@/actions/mutations";
import { formatDateShort } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รออนุมัติ", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "อนุมัติแล้ว", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700" },
};

export default function StockTransferPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback((p: number) => {
    getStockTransfers(p, 20).then((res: any) => {
      setTransfers(res.data || []);
      setTotalPages(res.totalPages || 0);
    });
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleApprove = async (id: string) => {
    await approveStockTransfer(id);
    load(page);
  };

  const handleReject = async (id: string) => {
    await rejectStockTransfer(id, "ปฏิเสธโดยผู้ดูแลระบบ");
    load(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">โอนสต็อก (ภายในบริษัท)</h2>
          <p className="text-sm text-gray-500">โอนสินค้าระหว่างคลังภายในบริษัทเดียวกัน</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> สร้างใบโอน
        </button>
      </div>

      {transfers.length > 0 ? (
        <div className="space-y-3">
          {transfers.map((transfer: any) => (
            <div key={transfer.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{transfer.transferNumber}</p>
                    <p className="text-xs text-gray-400">{formatDateShort(transfer.createdAt)} · {transfer.company.name} · โดย {transfer.requestedBy.name}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[transfer.status]?.color || "bg-gray-100 text-gray-700"}`}>
                  {statusConfig[transfer.status]?.label || transfer.status}
                </span>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">จากคลัง</p>
                  <p className="text-sm font-medium text-gray-900">{transfer.fromWarehouse.name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">ไปยังคลัง</p>
                  <p className="text-sm font-medium text-gray-900">{transfer.toWarehouse.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900">{transfer.items.length}</p>
                  <p className="text-xs text-gray-400">รายการ</p>
                </div>
              </div>

              {transfer.status === "PENDING" && (
                <div className="mt-3 flex items-center gap-2 justify-end">
                  <button onClick={() => handleReject(transfer.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                    <XCircle className="w-4 h-4" /> ปฏิเสธ
                  </button>
                  <button onClick={() => handleApprove(transfer.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                    <CheckCircle className="w-4 h-4" /> อนุมัติ & โอน
                  </button>
                </div>
              )}

              {transfer.logs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">ประวัติ:</p>
                  <div className="space-y-1">
                    {transfer.logs.slice(0, 3).map((log: any) => (
                      <p key={log.id} className="text-xs text-gray-400">
                        {log.action} · {log.performedBy.name} · {formatDateShort(log.createdAt)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
          ยังไม่มีใบโอนสต็อก
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}
