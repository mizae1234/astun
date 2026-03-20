import { Package, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { getWarehouseQueue } from "@/actions/goods-receiving";
import { updateOrderStatus } from "@/actions/mutations";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export default async function WarehouseQueuePage() {
  const { received, preparing, ready } = await getWarehouseQueue();

  async function handleStartPreparing(formData: FormData) {
    "use server";
    await updateOrderStatus(formData.get("id") as string, "PREPARING");
    revalidatePath("/warehouse/queue");
  }

  async function handleMarkReady(formData: FormData) {
    "use server";
    await updateOrderStatus(formData.get("id") as string, "READY");
    revalidatePath("/warehouse/queue");
  }

  const Column = ({ title, icon, color, orders, actionLabel, actionFn }: {
    title: string; icon: React.ReactNode; color: string; orders: any[];
    actionLabel?: string; actionFn?: (formData: FormData) => Promise<void>;
  }) => (
    <div className="flex-1 min-w-[280px]">
      <div className={`flex items-center gap-2 mb-4 px-1`}>
        {icon}
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{orders.length}</span>
      </div>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-300 text-sm border-2 border-dashed border-gray-200">
            ไม่มีรายการ
          </div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-600 text-sm">{order.orderNumber}</span>
                <span className="text-xs text-gray-400">{formatDateShort(order.createdAt)}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
              <p className="text-xs text-gray-400 mb-2">{order.warehouse.name} · {order.branch.name}</p>
              <div className="space-y-1 mb-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate flex-1">{item.productVariant.name}</span>
                    <span className="text-gray-900 font-medium ml-2">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                {actionLabel && actionFn && (
                  <form action={actionFn}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      <ArrowRight className="w-3 h-3" /> {actionLabel}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">คิวจัดเตรียมสินค้า</h2>
        <p className="text-sm text-gray-500">Warehouse Queue — จัดเตรียม + แพคสินค้าตามคำสั่งซื้อ</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        <Column
          title="📥 รอจัดเตรียม"
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          color="bg-yellow-100 text-yellow-700"
          orders={received as any[]}
          actionLabel="เริ่มจัดเตรียม"
          actionFn={handleStartPreparing}
        />
        <Column
          title="🔧 กำลังจัดเตรียม"
          icon={<Package className="w-5 h-5 text-blue-500" />}
          color="bg-blue-100 text-blue-700"
          orders={preparing as any[]}
          actionLabel="แพคเสร็จ"
          actionFn={handleMarkReady}
        />
        <Column
          title="✅ พร้อมจัดส่ง"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          color="bg-green-100 text-green-700"
          orders={ready as any[]}
        />
      </div>
    </div>
  );
}
