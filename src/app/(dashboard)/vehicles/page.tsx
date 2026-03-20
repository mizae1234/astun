"use client";

import { useState, useEffect } from "react";
import {
  Truck, Plus, Search, Wrench, CheckCircle, Clock,
  MoreVertical, X, GitBranch
} from "lucide-react";
import { getVehicles, createVehicle, updateVehicleStatus, deleteVehicle } from "@/actions/vehicle";
import { getBranches } from "@/actions/data";
import SearchableSelect from "@/components/ui/SearchableSelect";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  AVAILABLE: { label: "ว่าง", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  IN_USE: { label: "ใช้งาน", color: "text-blue-700", bg: "bg-blue-100", icon: Truck },
  MAINTENANCE: { label: "ซ่อมบำรุง", color: "text-orange-700", bg: "bg-orange-100", icon: Wrench },
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    licensePlate: "", name: "", type: "", branchId: "", note: "",
  });

  const load = () => {
    getVehicles().then((v: any) => setVehicles(v));
    getBranches().then((b: any) => setBranches(b));
  };

  useEffect(() => { load(); }, []);

  const filtered = vehicles.filter((v: any) =>
    v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
    (v.name && v.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!form.licensePlate || !form.branchId) return;
    await createVehicle({
      licensePlate: form.licensePlate,
      name: form.name || undefined,
      type: form.type || undefined,
      branchId: form.branchId,
      note: form.note || undefined,
    });
    setForm({ licensePlate: "", name: "", type: "", branchId: "", note: "" });
    setShowForm(false);
    load();
  };

  const handleStatus = async (id: string, status: "AVAILABLE" | "IN_USE" | "MAINTENANCE") => {
    await updateVehicleStatus(id, status);
    setMenuOpen(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบรถคันนี้?")) return;
    await deleteVehicle(id);
    setMenuOpen(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">รถจัดส่ง</h2>
          <p className="text-sm text-gray-500">จัดการรถและสถานะรถทั้งหมด</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรถ
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาทะเบียน / ชื่อรถ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
        />
      </div>

      {/* Add Vehicle Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> เพิ่มรถใหม่
            </h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ทะเบียนรถ *</label>
              <input type="text" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                placeholder="กก-1234" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อเรียก</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="รถ 6 ล้อ คัน 1" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ประเภท</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">เลือกประเภท</option>
                <option value="มอเตอร์ไซค์">มอเตอร์ไซค์</option>
                <option value="กระบะ">กระบะ</option>
                <option value="รถตู้">รถตู้</option>
                <option value="6 ล้อ">6 ล้อ</option>
                <option value="10 ล้อ">10 ล้อ</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">สาขา *</label>
              <SearchableSelect
                value={form.branchId}
                onChange={(val) => setForm({ ...form, branchId: val })}
                placeholder="เลือกสาขา"
                options={branches.map((b: any) => ({ value: b.id, label: b.name, sub: b.company.name }))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">หมายเหตุ</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="เช่น รถเช่า, สีขาว ฯลฯ" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleCreate}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v: any) => {
            const sc = statusConfig[v.status] || statusConfig.AVAILABLE;
            const StatusIcon = sc.icon;
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${v.status === "MAINTENANCE" ? "bg-orange-50" : v.status === "IN_USE" ? "bg-blue-50" : "bg-green-50"}`}>
                      <Truck className={`w-5 h-5 ${v.status === "MAINTENANCE" ? "text-orange-600" : v.status === "IN_USE" ? "text-blue-600" : "text-green-600"}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{v.licensePlate}</h3>
                      {v.name && <p className="text-xs text-gray-400">{v.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === v.id ? null : v.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {menuOpen === v.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 w-40">
                          {v.status !== "AVAILABLE" && (
                            <button onClick={() => handleStatus(v.id, "AVAILABLE")}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" /> ว่าง
                            </button>
                          )}
                          {v.status !== "MAINTENANCE" && (
                            <button onClick={() => handleStatus(v.id, "MAINTENANCE")}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Wrench className="w-3.5 h-3.5 text-orange-500" /> ซ่อมบำรุง
                            </button>
                          )}
                          <hr className="my-1 border-gray-100" />
                          <button onClick={() => handleDelete(v.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                            ลบรถ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  {v.type && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">{v.type}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs">{v.branch.name} · {v.branch.company.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs">{v._count.trips} รอบจัดส่ง</span>
                  </div>
                </div>
                {v.note && <p className="text-xs text-gray-400 mt-2 italic">{v.note}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">ยังไม่มีรถจัดส่ง</div>
      )}
    </div>
  );
}
