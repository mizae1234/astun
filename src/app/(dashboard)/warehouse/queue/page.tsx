import { Package, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { getWarehouseQueue } from "@/actions/goods-receiving";
import { updateOrderStatus } from "@/actions/mutations";
import { revalidatePath } from "next/cache";
import { getCategories } from "@/actions/data";
import WarehouseQueueClient from "./WarehouseQueueClient";

export default async function WarehouseQueuePage({ searchParams }: { searchParams: { categoryId?: string } }) {
  const { received, preparing, ready } = await getWarehouseQueue(searchParams.categoryId);
  const categories = await getCategories();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">คิวจัดเตรียมสินค้า</h2>
          <p className="text-sm text-gray-500">Warehouse Queue — จัดเตรียม + แพคสินค้าตามคำสั่งซื้อ</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select
            name="categoryId"
            defaultValue={searchParams.categoryId || ""}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-700"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            กรอง
          </button>
        </form>
      </div>

      <WarehouseQueueClient 
        received={received as any[]} 
        preparing={preparing as any[]} 
        ready={ready as any[]} 
        onStartPreparing={handleStartPreparing} 
        onMarkReady={handleMarkReady} 
      />
    </div>
  );
}
