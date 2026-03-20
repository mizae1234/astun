"use client";

import { useState, useEffect } from "react";
import {
  Truck, Plus, Search, MapPin, User, Clock, GitBranch, X,
  Play, CheckCircle, MoreVertical, Calendar
} from "lucide-react";
import { getDeliveryTrips, createDeliveryTrip, startTrip, completeTrip } from "@/actions/delivery-trip";
import { getVehicles } from "@/actions/vehicle";
import { getBranches } from "@/actions/data";
import { formatDateShort } from "@/lib/utils";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED: { label: "วางแผน", color: "text-blue-700", bg: "bg-blue-100" },
  IN_PROGRESS: { label: "กำลังจัดส่ง", color: "text-orange-700", bg: "bg-orange-100" },
  COMPLETED: { label: "เสร็จสิ้น", color: "text-green-700", bg: "bg-green-100" },
};

export default function DeliveryTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    vehicleId: "", branchId: "", note: "",
  });

  const load = () => {
    getDeliveryTrips().then((t: any) => setTrips(t));
  };

  useEffect(() => {
    load();
    getVehicles().then((v: any) => setVehicles(v));
    getBranches().then((b: any) => setBranches(b));
  }, []);

  // Get driver from vehicle's branch users (optional)
  const selectedBranch = branches.find((b: any) => b.id === form.branchId);

  const handleCreate = async () => {
    if (!form.branchId || !form.date) return;
    setLoading(true);
    try {
      const branch = branches.find((b: any) => b.id === form.branchId);
      await createDeliveryTrip({
        date: form.date,
        vehicleId: form.vehicleId || undefined,
        branchId: form.branchId,
        companyId: branch?.companyId || branch?.company?.id || "",
      });
      setForm({ date: new Date().toISOString().slice(0, 10), vehicleId: "", branchId: "", note: "" });
      setShowForm(false);
      load();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleStart = async (id: string) => {
    await startTrip(id);
    setMenuOpen(null);
    load();
  };

  const handleComplete = async (id: string) => {
    await completeTrip(id);
    setMenuOpen(null);
    load();
  };

  const filtered = trips.filter((t: any) =>
    t.tripNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.vehicle?.licensePlate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">รอบจัดส่ง</h2>
          <p className="text-sm text-gray-500">จัดการรอบจัดส่งและติดตามสถานะ</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> สร้างรอบจัดส่ง
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="ค้นหารอบจัดส่ง..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
      </div>

      {/* Create Trip Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> สร้างรอบจัดส่งใหม่
            </h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">วันที่จัดส่ง *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">สาขา *</label>
              <SearchableSelect
                value={form.branchId}
                onChange={(val) => setForm({ ...form, branchId: val })}
                placeholder="เลือกสาขา"
                options={branches.map((b: any) => ({ value: b.id, label: b.name, sub: b.company?.name || "" }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">รถ</label>
              <SearchableSelect
                value={form.vehicleId}
                onChange={(val) => setForm({ ...form, vehicleId: val })}
                placeholder="เลือกรถ (ไม่บังคับ)"
                options={vehicles.map((v: any) => ({ value: v.id, label: v.licensePlate, sub: v.name || v.type || "" }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={loading || !form.branchId}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm">
              {loading ? "กำลังสร้าง..." : "สร้างรอบ"}
            </button>
          </div>
        </div>
      )}

      {/* Trip Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((trip: any) => {
            const completedStops = trip.stops.filter((s: any) => s.status === "DELIVERED").length;
            const totalStops = trip.stops.length;
            const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;
            const sc = statusConfig[trip.status] || statusConfig.PLANNED;

            return (
              <div key={trip.id} onClick={() => router.push(`/routes/${trip.id}`)} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trip.status === "IN_PROGRESS" ? "bg-orange-50" : trip.status === "COMPLETED" ? "bg-green-50" : "bg-blue-50"}`}>
                      <Truck className={`w-5 h-5 ${trip.status === "IN_PROGRESS" ? "text-orange-600" : trip.status === "COMPLETED" ? "text-green-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{trip.tripNumber}</h3>
                      <p className="text-xs text-gray-400">{trip.company.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                    {trip.status !== "COMPLETED" && (
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === trip.id ? null : trip.id)} className="p-1 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {menuOpen === trip.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 w-44">
                            {trip.status === "PLANNED" && (
                              <button onClick={() => handleStart(trip.id)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Play className="w-3.5 h-3.5 text-orange-500" /> เริ่มจัดส่ง
                              </button>
                            )}
                            {trip.status === "IN_PROGRESS" && (
                              <button onClick={() => handleComplete(trip.id)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> จัดส่งเสร็จสิ้น
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDateShort(trip.date)}
                  </div>
                  {trip.vehicle && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{trip.vehicle.licensePlate}</span>
                      {trip.vehicle.name && <span className="text-gray-400">· {trip.vehicle.name}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    {trip.driver?.name || "ยังไม่กำหนดคนขับ"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    {trip.branch.name}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {completedStops}/{totalStops} จุด
                  </div>
                </div>
                {totalStops > 0 && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${trip.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{Math.round(progress)}% สำเร็จ</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">ยังไม่มีรอบจัดส่ง</div>
      )}
    </div>
  );
}
