import { Users as UsersIcon, Plus, Search, Mail, Phone, MapPin } from "lucide-react";
import { getSuppliers } from "@/actions/supplier";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  
  const suppliersData = await getSuppliers(page, 20, search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ผู้จำหน่าย (Suppliers)</h2>
          <p className="text-sm text-gray-500">จัดการข้อมูลผู้จำหน่ายและคู่ค้า</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          เพิ่มผู้จำหน่าย
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          defaultValue={search}
          placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..." 
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliersData.data.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{supplier.name}</h3>
                  <p className="text-xs text-gray-500">รหัส: {supplier.code}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${supplier.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {supplier.isActive ? "ใช้งาน" : "ปิด"}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{supplier.address}</span>
                </div>
              )}
              {supplier.taxId && (
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-50">
                  Tax ID: {supplier.taxId}
                </div>
              )}
            </div>
          </div>
        ))}
        {suppliersData.data.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            ไม่พบข้อมูลผู้จำหน่าย
          </div>
        )}
      </div>
    </div>
  );
}
