"use client";

import { useState } from "react";
import { Package, ArrowRight, Clock, CheckCircle, Printer } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";

export default function WarehouseQueueClient({
  received,
  preparing,
  ready,
  onStartPreparing,
  onMarkReady
}: {
  received: any[];
  preparing: any[];
  ready: any[];
  onStartPreparing: (formData: FormData) => Promise<void>;
  onMarkReady: (formData: FormData) => Promise<void>;
}) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const Column = ({
    title,
    icon,
    color,
    orders,
    actionLabel,
    actionFn,
    showCheckbox = false,
  }: {
    title: string;
    icon: React.ReactNode;
    color: string;
    orders: any[];
    actionLabel?: string;
    actionFn?: (formData: FormData) => Promise<void>;
    showCheckbox?: boolean;
  }) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`flex items-center gap-2 mb-4 px-1`}>
        {icon}
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
          {orders.length}
        </span>
      </div>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-300 text-sm border-2 border-dashed border-gray-200">
            ไม่มีรายการ
          </div>
        ) : (
          orders.map((order: any) => {
            const isSelected = selectedOrders.includes(order.id);
            return (
              <div
                key={order.id}
                onClick={showCheckbox ? () => toggleOrder(order.id) : undefined}
                className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative cursor-pointer ${
                  isSelected ? "border-blue-400 ring-1 ring-blue-100" : "border-gray-100"
                }`}
              >
                {showCheckbox && (
                  <div className="absolute top-4 right-4 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer pointer-events-none"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between mb-2 pr-6">
                  <span className="font-bold text-blue-600 text-sm">{order.orderNumber}</span>
                  <span className="text-xs text-gray-400">{formatDateShort(order.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                <p className="text-xs text-gray-400 mb-2">
                  {order.warehouse?.name || "ไม่ระบุคลัง"} · {order.branch?.name || "-"}
                </p>
                <div className="space-y-1 mb-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate flex-1">
                        {item.productVariant?.name || "สินค้าไม่มีชื่อ"}
                      </span>
                      <span className="text-gray-900 font-medium ml-2">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  {actionLabel && actionFn && (
                    <form 
                      action={actionFn} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input type="hidden" name="id" value={order.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors pointer-events-auto"
                      >
                        <ArrowRight className="w-3 h-3" /> {actionLabel}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-end mb-4 h-10">
        {selectedOrders.length > 0 && (
          <a
            href={`/warehouse/print?ids=${selectedOrders.join(",")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ใบจัดของ ({selectedOrders.length} รายการ)
          </a>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        <Column
          title="📥 รอจัดเตรียม"
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          color="bg-yellow-100 text-yellow-700"
          orders={received}
          actionLabel="เริ่มจัดเตรียม"
          actionFn={onStartPreparing}
          showCheckbox={true}
        />
        <Column
          title="🔧 กำลังจัดเตรียม"
          icon={<Package className="w-5 h-5 text-blue-500" />}
          color="bg-blue-100 text-blue-700"
          orders={preparing}
          actionLabel="แพคเสร็จ"
          actionFn={onMarkReady}
          showCheckbox={true}
        />
        <Column
          title="✅ พร้อมจัดส่ง"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          color="bg-green-100 text-green-700"
          orders={ready}
          showCheckbox={true}
        />
      </div>
    </>
  );
}
