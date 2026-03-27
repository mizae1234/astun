"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { approvePurchaseOrder } from "@/actions/purchasing";
import { useRouter } from "next/navigation";

export default function POApproveButton({ poId }: { poId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm("คุณต้องการอนุมัติใบสั่งซื้อนี้ใช่หรือไม่?")) return;
    
    setLoading(true);
    try {
      await approvePurchaseOrder(poId);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <button onClick={handleApprove} disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors text-sm font-medium shadow-sm">
      <CheckCircle className="w-4 h-4" />
      {loading ? "กำลังดำเนินการ..." : "อนุมัติใบสั่งซื้อ"}
    </button>
  );
}
