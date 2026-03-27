"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, CheckCircle, Package } from "lucide-react";
import { getGoodsReceivingById, completeGoodsReceiving } from "@/actions/goods-receiving";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: "ร่าง", color: "bg-gray-100 text-gray-700", icon: "📝" },
  PENDING: { label: "รอตรวจรับ", color: "bg-yellow-100 text-yellow-700", icon: "⏳" },
  INSPECTING: { label: "กำลังตรวจ", color: "bg-blue-100 text-blue-700", icon: "🔍" },
  COMPLETED: { label: "ตรวจรับครบ", color: "bg-green-100 text-green-700", icon: "✅" },
  PARTIAL: { label: "รับบางส่วน", color: "bg-orange-100 text-orange-700", icon: "⚠️" },
  REJECTED: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700", icon: "❌" },
};

export default function GoodsReceivingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const grId = params.id as string;

  const [gr, setGr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getGoodsReceivingById(grId).then((data) => {
      setGr(data);
      setLoading(false);
      if (data?.items) {
        const qtys: Record<string, number> = {};
        data.items.forEach((item: any) => {
          qtys[item.id] = item.receivedQty > 0 ? item.receivedQty : item.expectedQty;
        });
        setReceivedQtys(qtys);
      }
    });
  }, [grId]);

  const handleSubmit = async () => {
    if (!gr) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const receivedItems = gr.items.map((item: any) => ({
        itemId: item.id,
        receivedQty: receivedQtys[item.id] ?? item.expectedQty,
        note: notes[item.id] || undefined,
      }));

      const result = await completeGoodsReceiving(grId, receivedItems);
      if (result.success) {
        setSuccess(
          result.status === "COMPLETED"
            ? "✅ ตรวจรับครบทุกรายการ — เพิ่มสต็อกเรียบร้อย"
            : "⚠️ รับบางส่วน — เพิ่มสต็อกตามจำนวนที่รับจริง"
        );
        // Reload data
        const updated = await getGoodsReceivingById(grId);
        setGr(updated);
      }
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        กำลังโหลด...
      </div>
    );
  }

  if (!gr) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-400">ไม่พบใบรับสินค้า</p>
        <Link href="/goods-receiving" className="text-blue-600 hover:underline text-sm">
          ← กลับหน้ารายการ
        </Link>
      </div>
    );
  }

  const config = statusConfig[gr.status] || statusConfig.DRAFT;
  const canInspect = gr.status === "PENDING" || gr.status === "INSPECTING";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/goods-receiving"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              {gr.grNumber}
            </h2>
            <p className="text-sm text-gray-400">
              {formatDateShort(gr.createdAt)} · ผู้รับ: {gr.receivedBy.name}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.icon} {config.label}
        </span>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Supplier</p>
            <p className="text-sm font-medium text-gray-900">{gr.supplierName}</p>
            {gr.supplierContact && (
              <p className="text-xs text-gray-400">{gr.supplierContact}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400">เลข Invoice</p>
            <p className="text-sm font-medium text-gray-900">{gr.invoiceNumber || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">คลังรับเข้า</p>
            <p className="text-sm font-medium text-gray-900">{gr.warehouse.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">มูลค่ารวม</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(gr.totalAmount)}</p>
          </div>
        </div>
        {gr.note && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">หมายเหตุ</p>
            <p className="text-sm text-gray-600">{gr.note}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            รายการสินค้า ({gr.items.length} รายการ)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">#</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">สินค้า</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">SKU</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">ราคา/หน่วย</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">สั่งซื้อ</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">
                  {canInspect ? "รับจริง" : "รับแล้ว"}
                </th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">รวม</th>
                {canInspect && (
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">หมายเหตุ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gr.items.map((item: any, idx: number) => {
                const qty = receivedQtys[item.id] ?? item.expectedQty;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">
                        {item.productVariant.product?.name || item.productVariant.name}
                      </p>
                      <p className="text-xs text-gray-400">{item.productVariant.name}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {item.productVariant.sku}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      {item.expectedQty}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canInspect ? (
                        <input
                          type="number"
                          min="0"
                          max={item.expectedQty * 2}
                          value={qty}
                          onChange={(e) =>
                            setReceivedQtys((prev) => ({
                              ...prev,
                              [item.id]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className="w-20 text-right px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                        />
                      ) : (
                        <span
                          className={
                            item.receivedQty >= item.expectedQty
                              ? "text-green-600 font-medium"
                              : item.receivedQty > 0
                              ? "text-orange-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {item.receivedQty}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.unitCost * (canInspect ? qty : item.receivedQty))}
                    </td>
                    {canInspect && (
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          placeholder="—"
                          value={notes[item.id] || ""}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>
      )}

      {/* Action Buttons */}
      {canInspect && !success && (
        <div className="flex justify-end gap-3">
          <Link
            href="/goods-receiving"
            className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "ยืนยันตรวจรับ"}
          </button>
        </div>
      )}

      {success && (
        <div className="flex justify-end">
          <Link
            href="/goods-receiving"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้ารายการ
          </Link>
        </div>
      )}
    </div>
  );
}
