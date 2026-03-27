import { Package } from "lucide-react";

export default function InventoryReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานสินค้าคงคลัง</h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบความเคลื่อนไหวและมูลค่าสต็อกสินค้า</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">กำลังพัฒนาระบบรายงาน</h2>
        <p className="text-gray-500">รายงานสินค้าคงคลังจะพร้อมใช้งานในเร็วๆ นี้</p>
      </div>
    </div>
  );
}
