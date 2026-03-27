import prisma from "@/lib/prisma";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";

import PrintButton from "@/components/ui/PrintButton";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      company: true,
      items: {
        include: {
          productVariant: true,
        },
      },
    },
  });

  if (!order) return notFound();

  const company = order.company;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 print:py-0 print:bg-white text-gray-900">
      <div className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-md print:shadow-none print:p-0 mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4">
            {company.logo && (
              <div className="w-16 h-16 rounded overflow-hidden relative border border-gray-100">
                <Image src={company.logo} alt="Company Logo" fill className="object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              <p className="text-sm mt-1 whitespace-pre-line">{company.invoiceAddress || company.address || ""}</p>
              <div className="text-sm mt-1">
                {company.taxId && <span>เลขประจำตัวผู้เสียภาษี: {company.taxId} {company.taxBranchName ? `(${company.taxBranchName})` : ""}</span>}
              </div>
              <div className="text-sm">
                {company.phone && <span className="mr-3">โทร: {company.phone}</span>}
                {company.email && <span>Email: {company.email}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ใบแจ้งหนี้ / INVOICE</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-gray-500">เลขที่บิล:</span>
              <span className="font-bold">{order.orderNumber}</span>
              <span className="font-semibold text-gray-500">วันที่:</span>
              <span>{formatDateShort(order.createdAt)}</span>
              {order.dueDate && (
                <>
                  <span className="font-semibold text-gray-500">ครบกำหนด:</span>
                  <span>{formatDateShort(order.dueDate)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div className="mb-8 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-bold border-b border-gray-100 pb-2 mb-2">ลูกค้า (Customer To)</h3>
          <p className="font-bold">{order.customerName}</p>
          {order.customerAddress && <p className="text-sm whitespace-pre-line mt-1">{order.customerAddress}</p>}
          {order.customerPhone && <p className="text-sm mt-1">โทร: {order.customerPhone}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 px-3 text-left border border-gray-200 w-12 text-center">ลำดับ</th>
              <th className="py-2 px-3 text-left border border-gray-200">รายการสินค้า (Description)</th>
              <th className="py-2 px-3 text-right border border-gray-200 w-24">จำนวน</th>
              <th className="py-2 px-3 text-right border border-gray-200 w-32">ราคา/หน่วย</th>
              <th className="py-2 px-3 text-right border border-gray-200 w-32">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="py-2 px-3 border-x border-gray-200 text-center text-gray-500">{idx + 1}</td>
                <td className="py-2 px-3 border-x border-gray-200 font-medium">
                  {item.productName} - {item.productVariant.name}
                </td>
                <td className="py-2 px-3 border-x border-gray-200 text-right">{item.quantity}</td>
                <td className="py-2 px-3 border-x border-gray-200 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 px-3 border-x border-gray-200 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
            {/* Fill empty rows for better A4 layout if needed, omitted here */}
            {/* Addon / Shipping */}
            {order.addonAmount > 0 && (
              <tr>
                <td className="py-2 px-3 border-x border-gray-200 text-center"></td>
                <td className="py-2 px-3 border-x border-gray-200 text-gray-500">
                  {order.addonLabel || "ค่าดำเนินการคลังสินค้า/จัดส่ง"}
                </td>
                <td className="py-2 px-3 border-x border-gray-200 text-right">1</td>
                <td className="py-2 px-3 border-x border-gray-200 text-right">{formatCurrency(order.addonAmount)}</td>
                <td className="py-2 px-3 border-x border-gray-200 text-right font-medium">{formatCurrency(order.addonAmount)}</td>
              </tr>
            )}
            <tr className="border-t border-gray-200">
              <td colSpan={5} className="p-0"></td>
            </tr>
          </tbody>
        </table>

        {/* Summary Details */}
        <div className="flex justify-between items-start mb-8">
          <div className="w-1/2 pr-8">
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
              <p className="font-bold mb-1">หมายเหตุ:</p>
              <p className="whitespace-pre-line">{order.note || company.invoiceNote || "-"}</p>
            </div>
            
            <div className="mt-8">
              <PrintButton />
            </div>
          </div>
          
          <div className="w-1/2">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 px-3 text-right font-semibold text-gray-600">ยอดรวมสินค้า (Subtotal)</td>
                  <td className="py-1 px-3 text-right font-bold w-32">{formatCurrency(order.subtotal + (order.addonAmount || 0))}</td>
                </tr>
                {order.discount > 0 && (
                  <tr>
                    <td className="py-1 px-3 text-right font-semibold text-gray-600">
                      ส่วนลด {order.discountType === "percent" ? `(${order.discount}%)` : `(${formatCurrency(order.discount)})`}
                    </td>
                    <td className="py-1 px-3 text-right font-bold text-red-600">
                      -{formatCurrency(order.subtotal + (order.addonAmount || 0) - order.totalAmount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="py-3 px-3 text-right font-bold text-base">ยอดเงินสุทธิ (Total)</td>
                  <td className="py-3 px-3 text-right font-extrabold text-blue-700 text-base">{formatCurrency(order.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-16 pt-8">
          <div className="text-center">
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p className="text-sm font-semibold">ผู้รับสินค้า / ผู้ชำระเงิน</p>
            <p className="text-xs text-gray-500 mt-1">วันที่ _______ / _______ / _______</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p className="text-sm font-semibold">ผู้ออกใบแจ้งหนี้</p>
            <p className="text-xs text-gray-500 mt-1">วันที่ _______ / _______ / _______</p>
          </div>
        </div>

      </div>
    </div>
  );
}
