import prisma from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";
import PrintButton from "@/components/ui/PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintWarehouseQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = params.ids?.split(",").filter(Boolean) || [];
  
  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <p className="text-lg text-gray-600 mb-4">ไม่ได้เลือกรายการคำสั่งซื้อใดๆ</p>
          <a href="/warehouse/queue" className="text-blue-600 hover:underline">กลับไปหน้าคิว</a>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    include: {
      items: {
        include: {
          productVariant: true,
        },
      },
      warehouse: true,
      company: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 print:py-0 print:bg-white text-black font-sans">
      <div className="mb-6 print:hidden">
        <PrintButton />
      </div>

      <div className="flex flex-col gap-8 print:gap-0">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className="w-[80mm] bg-white p-4 shadow-sm relative print:shadow-none print:border-b-2 print:border-dashed print:border-black break-inside-avoid print:mb-0 mb-4"
          >
            {/* Header */}
            <div className="text-center mb-4 border-b border-black pb-2">
              <h1 className="font-bold text-xl mb-1">ใบจัดของ</h1>
              <p className="text-sm font-bold bg-black text-white py-1 mb-1 rounded-sm tracking-wider">
                {order.orderNumber}
              </p>
              <p className="text-xs">วันที่: {formatDateShort(order.createdAt)}</p>
              <p className="text-xs">พนักงานขาย: {order.company.name}</p>
            </div>

            {/* Customer Info (TO) */}
            <div className="mb-4">
              <h2 className="font-bold border-b-2 border-dashed border-gray-400 pb-1 mb-2 text-sm uppercase">ผู้รับ (TO)</h2>
              <p className="font-bold text-lg leading-tight mb-2">{order.customerName}</p>
              <p className="text-sm leading-snug whitespace-pre-line mb-2">
                {order.customerAddress || "ไม่ระบุที่อยู่ / มารับเอง"}
              </p>
              <p className="font-bold text-base">โทร: {order.customerPhone || "-"}</p>
            </div>

            {/* Print Note if exists */}
            {order.note && (
              <div className="mb-4 px-2 py-2 border-2 border-black border-dashed rounded-lg text-xs bg-gray-50 print:bg-transparent">
                <span className="font-bold text-sm block mb-1">📌 หมายเหตุ:</span>
                <span className="text-sm">{order.note}</span>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-4">
              <h2 className="font-bold border-b border-black pb-1 mb-2 text-sm text-center">
                รายการแพคสินค้า
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-1 text-left font-semibold">สินค้า</th>
                    <th className="py-1 text-right font-semibold whitespace-nowrap w-12">จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, i: number) => (
                    <tr key={item.id} className="border-b border-dashed border-gray-300">
                      <td className="py-2 pr-2 leading-tight">
                        <span className="font-medium mr-1">{i + 1}.</span> 
                        {item.productVariant.name}
                      </td>
                      <td className="py-2 text-right font-bold text-base whitespace-nowrap">
                        x {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-center text-sm font-bold mt-2 pb-2">
                รวมทั้งหมด: {order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} ชิ้น
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs border-t-2 border-black pt-3 mt-4">
              <div className="flex justify-between px-2 mb-6">
                <span>ผู้จัดของ: _____________</span>
                <span>ผู้แพค: _____________</span>
              </div>
              <p className="text-gray-500 font-mono tracking-widest">- END -</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
