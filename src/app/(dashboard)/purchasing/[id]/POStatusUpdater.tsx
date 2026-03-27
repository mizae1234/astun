"use client";

import { useState } from "react";
import { updatePurchaseOrderStatus } from "@/actions/purchasing";
import { useRouter } from "next/navigation";
import { ChevronDown, RefreshCw } from "lucide-react";

export default function POStatusUpdater({ poId, currentStatus }: { poId: string, currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // You can only change intermediate statuses
  const allowedStatuses = ["APPROVED", "IN_PRODUCTION", "SHIPPED", "ARRIVED_AT_PORT", "PARTIAL_RECEIVED"];
  
  if (!allowedStatuses.includes(currentStatus)) return null;

  const handleUpdate = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`)) {
      e.target.value = currentStatus; // reset
      return;
    }

    setLoading(true);
    try {
      await updatePurchaseOrderStatus(poId, newStatus);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
      e.target.value = currentStatus;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {loading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
      <div className="relative">
        <select 
          value={currentStatus}
          onChange={handleUpdate}
          disabled={loading}
          className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
        >
          <option value="APPROVED">อนุมัติแล้ว</option>
          <option value="IN_PRODUCTION">อยู่ระหว่างการผลิต</option>
          <option value="SHIPPED">ขึ้นตู้ (Shipped)</option>
          <option value="ARRIVED_AT_PORT">ถึงท่าเรือไทย</option>
          <option value="PARTIAL_RECEIVED">รับสินค้าบางส่วน</option>
        </select>
        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
