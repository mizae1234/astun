import { ArrowLeftRight, Plus, Search, ArrowRight } from "lucide-react";
import { getIntercompanyTransactions } from "@/actions/data";
import { formatCurrency, formatDateShort } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "ร่าง", color: "bg-gray-100 text-gray-700" },
  PENDING: { label: "รออนุมัติ", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "อนุมัติ", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700" },
};

export default async function IntercompanyPage() {
  const transactions = await getIntercompanyTransactions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Intercompany Transaction</h2>
          <p className="text-sm text-gray-500">ธุรกรรมข้ามบริษัท — Transfer Out / Receive In</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          สร้างธุรกรรมข้ามบริษัท
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="ค้นหาเลขที่ธุรกรรม..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
      </div>

      {(transactions as any[]).length > 0 ? (
        <div className="space-y-3">
          {(transactions as any[]).map((tx) => (
            <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{tx.transactionNumber}</p>
                    <p className="text-xs text-gray-400">{formatDateShort(tx.createdAt)} · สร้างโดย {tx.createdBy.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[tx.status]?.color || "bg-gray-100 text-gray-700"}`}>
                    {statusConfig[tx.status]?.label || tx.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">บริษัทต้นทาง (Transfer Out)</p>
                  <p className="text-sm font-medium text-gray-900">{tx.fromCompany.name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-300 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">บริษัทปลายทาง (Receive In)</p>
                  <p className="text-sm font-medium text-gray-900">{tx.toCompany.name}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {tx.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.productVariant.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">ยอดรวม</span>
                <span className="text-lg font-bold text-purple-600">{formatCurrency(tx.totalAmount)}</span>
              </div>

              {tx.note && (
                <p className="mt-2 text-xs text-gray-400">📝 {tx.note}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
          ยังไม่มีธุรกรรมข้ามบริษัท
        </div>
      )}
    </div>
  );
}
