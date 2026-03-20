import { Warehouse as WarehouseIcon, Plus, Search, Package } from "lucide-react";
import { getWarehouses } from "@/actions/data";

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">คลังสินค้า</h2>
          <p className="text-sm text-gray-500">จัดการคลังสินค้าทั้งหมด</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          เพิ่มคลังสินค้า
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="ค้นหาคลังสินค้า..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{wh.name}</h3>
                  <p className="text-xs text-gray-400">{wh.code}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wh.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {wh.isActive ? "ใช้งาน" : "ปิด"}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-3 space-y-0.5">
              <p>🏢 {wh.branch.company.name}</p>
              <p>🏪 {wh.branch.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{wh._count.stocks}</p>
              <p className="text-xs text-gray-500">รายการสต็อก</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
