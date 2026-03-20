"use client";

import { useState, useEffect } from "react";
import { GitBranch, Plus, Search, MapPin, Pencil, X, Save } from "lucide-react";
import { getBranches } from "@/actions/data";
import { createBranch, updateBranch } from "@/actions/mutations";
import { useRouter } from "next/navigation";

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = () => getBranches().then((b: any) => setBranches(b));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editBranch) return;
    setLoading(true);
    try {
      await updateBranch(editBranch.id, {
        name: editBranch.name,
        address: editBranch.address || "",
        phone: editBranch.phone || "",
      });
      setEditBranch(null);
      load();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">รายการสาขา</h2>
          <p className="text-sm text-gray-500">จัดการสาขาทั้งหมดของบริษัท</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">สาขา</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">บริษัท</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">ที่อยู่</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">โทร</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">คลัง</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">สถานะ</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch: any) => (
              <tr key={branch.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{branch.name}</p>
                      <p className="text-xs text-gray-400">{branch.code}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-gray-600">{branch.company.name}</td>
                <td className="py-3.5 px-5">
                  <span className="flex items-center gap-1 text-gray-600 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {branch.address || <span className="text-gray-300">ยังไม่ระบุ</span>}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-gray-600 text-xs">{branch.phone || "-"}</td>
                <td className="py-3.5 px-5 text-center font-medium text-gray-900">{branch._count.warehouses}</td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${branch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {branch.isActive ? "ใช้งาน" : "ปิด"}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-center">
                  <button onClick={() => setEditBranch({ ...branch })}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editBranch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditBranch(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">✏️ แก้ไขสาขา</h3>
              <button onClick={() => setEditBranch(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อสาขา</label>
                <input value={editBranch.name} onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ที่อยู่ (สำคัญ — ใช้เป็นจุดเริ่มต้นเส้นทางจัดส่ง)</label>
                <textarea value={editBranch.address || ""} onChange={(e) => setEditBranch({ ...editBranch, address: e.target.value })}
                  rows={3} placeholder="เช่น 123/45 ถ.พระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">โทรศัพท์</label>
                <input value={editBranch.phone || ""} onChange={(e) => setEditBranch({ ...editBranch, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditBranch(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={loading}
                className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
