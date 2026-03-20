import { Plus, Search, Shield } from "lucide-react";
import { getUsers } from "@/actions/data";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบ",
  OWNER: "เจ้าของ",
  COMPANY_ADMIN: "ผู้ดูแลบริษัท",
  BRANCH_ADMIN: "ผู้ดูแลสาขา",
  STAFF: "พนักงาน",
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  OWNER: "bg-purple-100 text-purple-700",
  COMPANY_ADMIN: "bg-blue-100 text-blue-700",
  BRANCH_ADMIN: "bg-indigo-100 text-indigo-700",
  STAFF: "bg-gray-100 text-gray-700",
};

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ผู้ใช้งาน</h2>
          <p className="text-sm text-gray-500">จัดการผู้ใช้งานและสิทธิ์การเข้าถึง</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          เพิ่มผู้ใช้
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="ค้นหาผู้ใช้..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">ผู้ใช้</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">Role</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">บริษัท</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">สาขา</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer">
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${roleColors[user.role] || "bg-gray-100 text-gray-700"}`}>
                    <Shield className="w-3 h-3" />
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-gray-600">{user.company?.name || "ทุกบริษัท"}</td>
                <td className="py-3.5 px-5 text-gray-600">{user.branch?.name || "-"}</td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {user.isActive ? "ใช้งาน" : "ปิด"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
