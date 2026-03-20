"use client";

import { useState, useEffect, use } from "react";
import {
  Truck, MapPin, User, Clock, GitBranch, ArrowLeft, Phone,
  CheckCircle, Package, Play, CircleCheck, XCircle, Calendar
} from "lucide-react";
import { getDeliveryTripById, startTrip, completeTrip, updateStopStatus } from "@/actions/delivery-trip";
import { formatDateShort, formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED: { label: "วางแผน", color: "text-blue-700", bg: "bg-blue-100" },
  IN_PROGRESS: { label: "กำลังจัดส่ง", color: "text-orange-700", bg: "bg-orange-100" },
  COMPLETED: { label: "เสร็จสิ้น", color: "text-green-700", bg: "bg-green-100" },
};

const stopStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: "รอจัดส่ง", color: "text-gray-600", bg: "bg-gray-100", icon: Clock },
  ARRIVED: { label: "ถึงแล้ว", color: "text-blue-700", bg: "bg-blue-100", icon: MapPin },
  DELIVERED: { label: "ส่งสำเร็จ", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  FAILED: { label: "ส่งไม่สำเร็จ", color: "text-red-700", bg: "bg-red-100", icon: XCircle },
};

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getDeliveryTripById(id).then((t) => {
      setTrip(t);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const handleStartTrip = async () => {
    await startTrip(id);
    load();
  };

  const handleCompleteTrip = async () => {
    await completeTrip(id);
    load();
  };

  const handleStopStatus = async (stopId: string, status: "ARRIVED" | "DELIVERED" | "FAILED") => {
    await updateStopStatus(stopId, status);
    load();
  };

  if (loading) return <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>;
  if (!trip) return <div className="p-12 text-center text-gray-400">ไม่พบรอบจัดส่ง</div>;

  const sc = statusConfig[trip.status] || statusConfig.PLANNED;
  const completedStops = trip.stops.filter((s: any) => s.status === "DELIVERED").length;
  const totalStops = trip.stops.length;
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/routes")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{trip.tripNumber}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
              {sc.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{trip.company.name}</p>
        </div>
        <div className="flex gap-2">
          {trip.status === "PLANNED" && (
            <button onClick={handleStartTrip}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
              <Play className="w-4 h-4" /> เริ่มจัดส่ง
            </button>
          )}
          {trip.status === "IN_PROGRESS" && (
            <button onClick={handleCompleteTrip}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
              <CircleCheck className="w-4 h-4" /> จัดส่งเสร็จสิ้น
            </button>
          )}
        </div>
      </div>

      {/* Trip Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <Calendar className="w-4 h-4" /> วันที่
          </div>
          <p className="font-bold text-gray-900">{formatDateShort(trip.date)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <GitBranch className="w-4 h-4" /> สาขา
          </div>
          <p className="font-bold text-gray-900">{trip.branch.name}</p>
          {trip.branch.address && <p className="text-xs text-gray-400 mt-1">{trip.branch.address}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <Truck className="w-4 h-4" /> รถ
          </div>
          <p className="font-bold text-gray-900">{trip.vehicle?.licensePlate || "ยังไม่ระบุ"}</p>
          {trip.vehicle?.name && <p className="text-xs text-gray-400 mt-1">{trip.vehicle.name}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <User className="w-4 h-4" /> คนขับ
          </div>
          <p className="font-bold text-gray-900">{trip.driver?.name || "ยังไม่ระบุ"}</p>
          {trip.driver?.phone && <p className="text-xs text-gray-400 mt-1">{trip.driver.phone}</p>}
        </div>
      </div>

      {/* Progress */}
      {totalStops > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">ความคืบหน้า</p>
            <p className="text-sm font-bold text-gray-900">{completedStops}/{totalStops} จุด ({Math.round(progress)}%)</p>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${trip.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Stops List */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-400" />
          จุดจัดส่ง ({totalStops} จุด)
        </h3>

        {totalStops === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
            ยังไม่มีจุดจัดส่ง — <a href="/delivery/queue" className="underline text-blue-600">ไปเพิ่มจากคิว</a>
          </div>
        ) : (
          <div className="space-y-3">
            {trip.stops.map((stop: any, idx: number) => {
              const ssc = stopStatusConfig[stop.status] || stopStatusConfig.PENDING;
              const IconComp = ssc.icon;
              const order = stop.order;
              return (
                <div key={stop.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    {/* Sequence Number */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        stop.status === "DELIVERED" ? "bg-green-500 text-white" :
                        stop.status === "ARRIVED" ? "bg-blue-500 text-white" :
                        stop.status === "FAILED" ? "bg-red-500 text-white" :
                        "bg-gray-200 text-gray-600"
                      }`}>
                        {idx + 1}
                      </div>
                      {idx < trip.stops.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900">{order.customerName}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ssc.bg} ${ssc.color}`}>
                              <IconComp className="w-3 h-3 inline mr-0.5" /> {ssc.label}
                            </span>
                          </div>
                          <p className="text-sm text-blue-600 font-medium">{order.orderNumber}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      </div>

                      {order.customerAddress && (
                        <p className="text-xs text-gray-500 flex items-start gap-1 mb-2">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-red-400" />
                          {order.customerAddress}
                        </p>
                      )}
                      {order.customerPhone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {order.customerPhone}
                        </p>
                      )}

                      {/* Order Items */}
                      {order.items?.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-2 mb-2">
                          {order.items.map((item: any, j: number) => (
                            <div key={j} className="flex items-center justify-between text-xs text-gray-600 py-0.5">
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3 text-gray-400" />
                                {item.productVariant?.name || "สินค้า"}
                              </span>
                              <span>x{item.quantity} • {formatCurrency(item.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {order.note && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mb-2">📝 {order.note}</p>
                      )}

                      {/* Stop Timestamps */}
                      <div className="flex gap-4 text-[10px] text-gray-400">
                        {stop.arrivedAt && <span>ถึง: {new Date(stop.arrivedAt).toLocaleTimeString("th-TH")}</span>}
                        {stop.deliveredAt && <span>ส่งเสร็จ: {new Date(stop.deliveredAt).toLocaleTimeString("th-TH")}</span>}
                      </div>

                      {/* Action Buttons */}
                      {trip.status === "IN_PROGRESS" && stop.status !== "DELIVERED" && stop.status !== "FAILED" && (
                        <div className="flex gap-2 mt-3">
                          {stop.status === "PENDING" && (
                            <button onClick={() => handleStopStatus(stop.id, "ARRIVED")}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                              📍 ถึงจุดแล้ว
                            </button>
                          )}
                          <button onClick={() => handleStopStatus(stop.id, "DELIVERED")}
                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                            ✅ ส่งสำเร็จ
                          </button>
                          <button onClick={() => handleStopStatus(stop.id, "FAILED")}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                            ❌ ส่งไม่สำเร็จ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
