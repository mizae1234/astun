"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, CheckCircle, Plus, Navigation, ArrowUp, ArrowDown, Clock, Route, Sparkles, Building2 } from "lucide-react";
import { getDeliveryQueue } from "@/actions/goods-receiving";
import { getPlannedTrips, addStopToTrip } from "@/actions/delivery-trip";
import { optimizeDeliveryRoute, suggestDeliveryOrders, sortOrdersByDistance } from "@/actions/route-optimize";
import { getBranches } from "@/actions/data";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useRouter } from "next/navigation";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function DeliveryQueuePage() {
  const router = useRouter();
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [plannedTrips, setPlannedTrips] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [sortingLeft, setSortingLeft] = useState(false);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState<{ totalDistance: string; totalDuration: string; reasoning?: string; legs: any[] } | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");

  useEffect(() => {
    getDeliveryQueue().then((data) => setReadyOrders(data.ready));
    getPlannedTrips().then((t: any) => setPlannedTrips(t));
    getBranches().then((b: any) => setBranches(b));
  }, []);

  const originAddress = (() => {
    const branch = branches.find((b: any) => b.id === selectedBranch);
    return branch?.address || branch?.name || "";
  })();

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
    setRouteInfo(null);
  };

  const moveOrder = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= selectedOrders.length) return;
    setSelectedOrders((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  // Sort ALL ready orders by distance from origin
  const handleSortReadyOrders = async () => {
    if (!originAddress) {
      setError("กรุณาเลือกสาขาต้นทางเพื่อคำนวณระยะทางก่อน");
      return;
    }
    if (readyOrders.length < 2) return;

    setSortingLeft(true);
    setError("");

    const ordersData = readyOrders.map((o: any) => ({
      id: o.id,
      customerName: o.customerName,
      customerAddress: o.customerAddress || "",
    }));

    const result = await sortOrdersByDistance(originAddress, ordersData);

    if ("error" in result) {
      setError(result.error);
    } else {
      const sortedIds = result.sortedIds;
      const newOrders = [...readyOrders].sort((a, b) => {
        const ia = sortedIds.indexOf(a.id);
        const ib = sortedIds.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
      setReadyOrders(newOrders);
    }
    setSortingLeft(false);
  };

  // AI suggests which orders to select
  const handleAiSuggest = async () => {
    if (!originAddress) {
      setError("กรุณาเลือกสาขาต้นทางก่อน");
      return;
    }
    if (readyOrders.length < 2) {
      setError("ต้องมี orders อย่างน้อย 2 รายการ");
      return;
    }

    setSuggesting(true);
    setError("");
    setAiSuggestion("");
    setRouteInfo(null);

    const ordersData = readyOrders.map((o: any) => ({
      id: o.id,
      customerName: o.customerName,
      customerAddress: o.customerAddress || "",
      orderNumber: o.orderNumber,
    }));

    const result = await suggestDeliveryOrders(originAddress, ordersData);

    if ("error" in result) {
      setError(result.error);
    } else {
      // Auto-select the suggested orders
      const suggestedIds = result.selectedIndices
        .filter((i: number) => i < readyOrders.length)
        .map((i: number) => readyOrders[i].id);
      setSelectedOrders(suggestedIds);
      setAiSuggestion(result.reasoning);
    }
    setSuggesting(false);
  };

  // Optimize order of already-selected orders
  const handleOptimize = async () => {
    if (selectedOrders.length < 2) {
      setError("ต้องเลือกอย่างน้อย 2 orders เพื่อ optimize");
      return;
    }
    if (!originAddress) {
      setError("กรุณาเลือกสาขาต้นทางก่อน");
      return;
    }

    const orders = selectedOrders.map((id) => readyOrders.find((o: any) => o.id === id)).filter(Boolean);
    const addresses = orders.map((o: any) => o.customerAddress || o.customerName);

    const hasAddresses = addresses.filter((a) => a && a.trim().length > 5);
    if (hasAddresses.length < 2) {
      setError("orders ที่เลือกต้องมีที่อยู่จัดส่งอย่างน้อย 2 รายการ");
      return;
    }

    setOptimizing(true);
    setError("");
    setRouteInfo(null);

    const result = await optimizeDeliveryRoute(originAddress, addresses);

    if ("error" in result) {
      setError(result.error);
    } else {
      const reordered = result.optimizedOrder.map((i: number) => selectedOrders[i]);
      setSelectedOrders(reordered);
      setRouteInfo({
        totalDistance: result.totalDistance,
        totalDuration: result.totalDuration,
        reasoning: result.reasoning,
        legs: result.legs,
      });
    }
    setOptimizing(false);
  };

  const handleAssignToTrip = async () => {
    if (selectedOrders.length === 0 || !selectedTrip) {
      setError("เลือกรอบจัดส่งและคำสั่งซื้ออย่างน้อย 1 รายการ");
      return;
    }

    setLoading(true);
    setError("");
    try {
      for (const orderId of selectedOrders) {
        await addStopToTrip(selectedTrip, orderId);
      }
      router.push("/routes");
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const tripOptions = plannedTrips.map((t: any) => ({
    value: t.id,
    label: `${t.tripNumber} — ${formatDateShort(t.date)}`,
    sub: `${t.branch.name} · ${t.vehicle?.licensePlate || "ไม่ระบุรถ"} (${t.stops.length} จุด)`,
  }));

  const branchOptions = branches.map((b: any) => ({
    value: b.id,
    label: b.name,
    sub: b.address || "ยังไม่ระบุที่อยู่",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">คิวรอจัดส่ง</h2>
          <p className="text-sm text-gray-500">เลือกสาขาต้นทาง → AI แนะนำ orders → เพิ่มเข้ารอบจัดส่ง</p>
        </div>
      </div>

      {/* Origin Branch Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
            <label className="text-sm font-bold text-gray-900">สาขาต้นทาง</label>
          </div>
          <div className="w-72">
            <SearchableSelect
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val)}
              placeholder="เลือกสาขาที่จะออกรถ..."
              options={branchOptions}
            />
          </div>
          {originAddress && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-400" /> {originAddress}
            </p>
          )}
          <div className="ml-auto">
            <button
              onClick={handleAiSuggest}
              disabled={suggesting || !selectedBranch || readyOrders.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-bold hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {suggesting ? "AI กำลังวิเคราะห์..." : "🤖 AI แนะนำ Orders"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      {aiSuggestion && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 border border-purple-200">
          <p className="text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI แนะนำ
          </p>
          <p className="text-xs text-purple-600 leading-relaxed">{aiSuggestion}</p>
        </div>
      )}

      <div className="flex gap-6 h-[calc(100vh-320px)]">
        {/* LEFT — Ready Orders */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-gray-900">พร้อมจัดส่ง</h3>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              {readyOrders.length}
            </span>
            {selectedOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                เลือก {selectedOrders.length}
              </span>
            )}

            <div className="ml-auto">
              <button
                onClick={handleSortReadyOrders}
                disabled={sortingLeft || !selectedBranch || readyOrders.length < 2}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 flex-shrink-0 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                {sortingLeft ? "กำลังเรียง..." : "เรียงตามระยะทางจากคลัง"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {readyOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-300 text-sm border-2 border-dashed border-gray-200">
                ไม่มีคำสั่งซื้อที่พร้อมจัดส่ง
              </div>
            ) : (
              readyOrders.map((order: any) => {
                const isSelected = selectedOrders.includes(order.id);
                const seqIdx = selectedOrders.indexOf(order.id);
                return (
                  <button
                    key={order.id}
                    onClick={() => toggleOrder(order.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-100 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold ${
                          isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
                        }`}>
                          {isSelected ? seqIdx + 1 : ""}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-blue-600">{order.orderNumber}</p>
                          <p className="text-sm text-gray-900">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-400">{order.branch.name}</p>
                      </div>
                    </div>
                    {order.customerAddress && (
                      <p className="text-xs text-gray-500 mt-2 flex items-start gap-1 bg-gray-50 rounded-lg px-2 py-1.5">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-red-400" />
                        <span>{order.customerAddress}</span>
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — Trip Selector + Optimize */}
        <div className="w-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              เพิ่มเข้ารอบจัดส่ง
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">เลือกรอบจัดส่ง *</label>
              {plannedTrips.length > 0 ? (
                <SearchableSelect
                  value={selectedTrip}
                  onChange={(val) => setSelectedTrip(val)}
                  placeholder="เลือกรอบจัดส่ง..."
                  options={tripOptions}
                />
              ) : (
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 border border-amber-200">
                  ยังไม่มีรอบจัดส่ง — <a href="/routes" className="underline font-medium">สร้างรอบจัดส่งก่อน</a>
                </div>
              )}
            </div>

            {/* Selected trip info */}
            {selectedTrip && (() => {
              const trip = plannedTrips.find((t: any) => t.id === selectedTrip);
              if (!trip) return null;
              return (
                <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-bold text-blue-700">{trip.tripNumber}</p>
                  <p className="text-xs text-gray-600">📅 {formatDateShort(trip.date)}</p>
                  <p className="text-xs text-gray-600">🏢 {trip.branch.name}</p>
                  {trip.vehicle && <p className="text-xs text-gray-600">🚛 {trip.vehicle.licensePlate} {trip.vehicle.name || ""}</p>}
                  {trip.driver && <p className="text-xs text-gray-600">👤 {trip.driver.name}</p>}
                  <p className="text-xs text-gray-500">จุดจัดส่งปัจจุบัน: {trip.stops.length} จุด</p>
                </div>
              );
            })()}

            {/* Selected orders + Optimize */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">
                  จุดจัดส่ง ({selectedOrders.length})
                </label>
                {selectedOrders.length >= 2 && (
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <Navigation className="w-3 h-3" />
                    {optimizing ? "กำลังคำนวณ..." : "🗺️ เรียงลำดับ"}
                  </button>
                )}
              </div>

              {/* Route optimization result */}
              {routeInfo && (
                <div className="bg-emerald-50 rounded-xl p-3 mb-3 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-1">
                    <Route className="w-3.5 h-3.5" /> เส้นทางที่แนะนำ
                  </p>
                  <div className="flex gap-3 text-xs text-emerald-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {routeInfo.totalDistance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {routeInfo.totalDuration}
                    </span>
                  </div>
                  {routeInfo.reasoning && (
                    <p className="text-[11px] text-emerald-600 mt-2 leading-relaxed border-t border-emerald-200 pt-2">
                      💡 {routeInfo.reasoning}
                    </p>
                  )}
                </div>
              )}

              {selectedOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-300 text-xs border border-dashed border-gray-200">
                  เลือกคำสั่งซื้อจากฝั่งซ้าย หรือกด "AI แนะนำ"
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedOrders.map((id, i) => {
                    const order = readyOrders.find((o: any) => o.id === id);
                    if (!order) return null;
                    const legInfo = routeInfo?.legs?.[i];
                    return (
                      <div key={id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{order.customerName}</p>
                          <p className="text-xs text-gray-400 truncate">{order.customerAddress || order.orderNumber}</p>
                          {legInfo && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">{legInfo.distance} · {legInfo.duration}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); moveOrder(i, -1); }}
                            disabled={i === 0}
                            className="p-0.5 hover:bg-blue-100 rounded disabled:opacity-20">
                            <ArrowUp className="w-3 h-3 text-blue-600" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveOrder(i, 1); }}
                            disabled={i === selectedOrders.length - 1}
                            className="p-0.5 hover:bg-blue-100 rounded disabled:opacity-20">
                            <ArrowDown className="w-3 h-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 p-4">
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <button
              onClick={handleAssignToTrip}
              disabled={loading || selectedOrders.length === 0 || !selectedTrip}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? "กำลังเพิ่ม..." : (
                <>
                  <Plus className="w-4 h-4" />
                  เพิ่มเข้ารอบจัดส่ง ({selectedOrders.length} รายการ)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
