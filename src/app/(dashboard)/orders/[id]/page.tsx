import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { ArrowLeft, Edit, FileText, Package, User } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  RECEIVED: { label: "รับแล้ว", color: "text-yellow-700", bg: "bg-yellow-100" },
  PREPARING: { label: "กำลังจัดเตรียม", color: "text-blue-700", bg: "bg-blue-100" },
  READY: { label: "พร้อมจัดส่ง", color: "text-indigo-700", bg: "bg-indigo-100" },
  OUT_FOR_DELIVERY: { label: "กำลังจัดส่ง", color: "text-purple-700", bg: "bg-purple-100" },
  DELIVERED: { label: "จัดส่งแล้ว", color: "text-green-700", bg: "bg-green-100" },
  CANCELLED: { label: "ยกเลิก", color: "text-red-700", bg: "bg-red-100" },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/auth/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { productVariant: true },
      },
      branch: true,
      company: true,
    },
  });

  if (!order) return notFound();

  // Enforce company isolation
  if (user.role !== "SUPER_ADMIN" && user.companyId !== order.companyId) {
    return notFound();
  }

  const sc = statusConfig[order.status] || statusConfig.RECEIVED;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              วันที่: {formatDateShort(order.createdAt)} • สาขา: {order.branch.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {order.status === "RECEIVED" && (
            <Link href={`/orders/${order.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
              <Edit className="w-4 h-4" /> แก้ไขคำสั่งซื้อ
            </Link>
          )}
          <a href={`/invoice/${order.id}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <FileText className="w-4 h-4" /> พิมพ์ใบแจ้งหนี้
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              รายการสินค้า ({order.items.length} รายการ)
            </h3>
            
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.productVariant.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>ยอดรวมสินค้า</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>ส่วนลด {order.discountType === "percent" ? `(${order.discount}%)` : ""}</span>
                  <span>-{formatCurrency(order.subtotal + (order.addonAmount || 0) - order.totalAmount)}</span>
                </div>
              )}
              {order.addonAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{order.addonLabel || "ค่าดำเนินการ"}</span>
                  <span>{formatCurrency(order.addonAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-50">
                <span>ยอดสุทธิ</span>
                <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              ข้อมูลลูกค้า
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">ชื่อลูกค้า</p>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">เบอร์โทรศัพท์</p>
                <p className="font-medium text-gray-900">{order.customerPhone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ที่อยู่จัดส่ง</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">{order.customerAddress || "-"}</p>
              </div>
              {order.note && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-600 font-bold mb-1">หมายเหตุ</p>
                  <p className="text-sm text-amber-800">{order.note}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">ข้อมูลการชำระเงิน</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">วิธีชำระเงิน</span>
                <span className="font-medium text-gray-900">
                  {order.paymentMethod === "CASH" ? "เงินสด" : order.paymentMethod === "TRANSFER" ? "โอนเงิน" : "เครดิต"}
                </span>
              </div>
              {order.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ครบกำหนด</span>
                  <span className="font-medium text-red-600">{formatDateShort(order.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
