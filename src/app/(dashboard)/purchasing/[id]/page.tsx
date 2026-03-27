import { getPurchaseOrderById } from "@/actions/purchasing";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Calendar, Building2, UserCircle, FileText } from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import POApproveButton from "./POApproveButton";

export default async function PurchaseOrderDetailPage({
  params
}: {
  params: { id: string }
}) {
  const po = await getPurchaseOrderById(params.id);
  
  if (!po) return notFound();

  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "ร่าง", color: "bg-gray-100 text-gray-700" },
    PENDING: { label: "รออนุมัติ", color: "bg-amber-100 text-amber-700" },
    APPROVED: { label: "อนุมัติแล้ว", color: "bg-emerald-100 text-emerald-700" },
    PARTIAL_RECEIVED: { label: "รับบางส่วน", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "รับครบแล้ว", color: "bg-purple-100 text-purple-700" },
    CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
  };

  const badge = statusConfig[po.status] || { label: po.status, color: "bg-gray-100 text-gray-700" };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchasing" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              ใบสั่งซื้อ {po.poNumber}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.color}`}>{badge.label}</span>
            </h2>
            <p className="text-sm text-gray-500">วันที่สร้าง: {formatDate(po.createdAt)} · โดย {po.createdBy.name}</p>
          </div>
        </div>
        
        {po.status === "DRAFT" && (
          <POApproveButton poId={po.id} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><UserCircle className="w-5 h-5 text-indigo-500" /> ข้อมูลผู้จำหน่าย</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">ชื่อ:</span> <span className="font-medium text-gray-900">{po.supplier.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">เบอร์โทร:</span> <span className="font-medium text-gray-900">{po.supplier.phone || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ที่อยู่:</span> <span className="font-medium text-gray-700 truncate max-w-[200px]">{po.supplier.address || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> รายละเอียดเพิ่มเติม</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">กำหนดส่ง:</span> <span className="font-medium text-gray-900">{po.expectedDate ? formatDate(po.expectedDate) : "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">วันรับสินค้าครบ:</span> <span className="font-medium text-gray-900">{po.receivedDate ? formatDate(po.receivedDate) : "-"}</span></div>
            {po.approvedBy && <div className="flex justify-between"><span className="text-gray-500">ผู้อนุมัติ:</span> <span className="font-medium text-gray-900 text-emerald-600">{po.approvedBy.name}</span></div>}
          </div>
        </div>
      </div>

      {po.note && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
          <span className="font-semibold text-gray-700 block mb-1">หมายเหตุ:</span>
          {po.note}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">รายการสินค้า ({po.items.length})</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-semibold">สินค้า</th>
              <th className="px-6 py-3 font-semibold text-center w-24">สั่งซื้อ</th>
              <th className="px-6 py-3 font-semibold text-center w-24">รับแล้ว</th>
              <th className="px-6 py-3 font-semibold text-right w-32">ราคา/หน่วย</th>
              <th className="px-6 py-3 font-semibold text-right w-32">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.productVariant.product.name}</div>
                  <div className="text-xs text-gray-500">{item.productVariant.name} · {item.productVariant.sku}</div>
                </td>
                <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                <td className={`px-6 py-4 text-center font-bold ${item.receivedQty >= item.quantity ? "text-emerald-600" : item.receivedQty > 0 ? "text-amber-500" : "text-gray-400"}`}>
                  {item.receivedQty}
                </td>
                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50">
            <tr>
              <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-900">ยอดรวมทั้งสิ้น</td>
              <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">{formatCurrency(po.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {po.goodsReceivings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 px-1">ประวัติการรับสินค้า</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {po.goodsReceivings.map((gr: any) => (
              <Link key={gr.id} href={`/goods-receiving/${gr.id}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-600">{gr.grNumber}</div>
                  <div className="text-xs text-gray-500">{formatDate(gr.createdAt)}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${gr.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {gr.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
