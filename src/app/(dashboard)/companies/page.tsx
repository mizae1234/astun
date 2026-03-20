import Link from "next/link";
import { Building2, Plus, Search, Settings } from "lucide-react";
import { getCompanies } from "@/actions/data";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">รายการบริษัท</h2>
          <p className="text-sm text-gray-500">จัดการบริษัทและ Legal Entity ทั้งหมด</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          เพิ่มบริษัท
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="ค้นหาบริษัท..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}/settings`}
            className="block bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500">รหัส: {company.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${company.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {company.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                </span>
                <Settings className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{company._count.branches}</p>
                <p className="text-gray-500">สาขา</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{company._count.products}</p>
                <p className="text-gray-500">สินค้า</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{company._count.users}</p>
                <p className="text-gray-500">ผู้ใช้</p>
              </div>
            </div>
            {company.email && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 space-y-1">
                <p>📧 {company.email}</p>
                {company.phone && <p>📞 {company.phone}</p>}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
