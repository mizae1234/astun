"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    companyName?: string | null;
    branchName?: string | null;
  };
};

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "แดชบอร์ด", subtitle: "ภาพรวมระบบ" },
  "/companies": { title: "บริษัท", subtitle: "จัดการบริษัททั้งหมด" },
  "/branches": { title: "สาขา", subtitle: "จัดการสาขาของบริษัท" },
  "/warehouses": { title: "คลังสินค้า", subtitle: "จัดการคลังสินค้า" },
  "/products": { title: "สินค้า", subtitle: "รายการสินค้าทั้งหมด" },
  "/products/sets": { title: "เซ็ตสินค้า", subtitle: "Product Sets — ขายสินค้าเป็นชุดราคาพิเศษ" },
  "/inventory": { title: "สต็อกสินค้า", subtitle: "จัดการสต็อกตามคลังสินค้า" },
  "/goods-receiving": { title: "รับสินค้าเข้า", subtitle: "Goods Receiving — สร้างใบรับ → ตรวจรับ → เพิ่มสต็อก" },
  "/goods-receiving/create": { title: "สร้างใบรับสินค้า", subtitle: "Goods Receiving Note (GRN)" },
  "/stock-transfer": { title: "โอนสต็อก", subtitle: "โอนสินค้าระหว่างคลังภายในบริษัทเดียวกัน" },
  "/intercompany": { title: "ข้ามบริษัท", subtitle: "ธุรกรรมข้ามบริษัท (Intercompany Transaction)" },
  "/orders/create": { title: "สร้างคำสั่งซื้อ", subtitle: "POS — เลือกสินค้า สร้าง Order หักสต็อก" },
  "/orders": { title: "คำสั่งซื้อ", subtitle: "จัดการคำสั่งซื้อ" },
  "/warehouse/queue": { title: "คิวจัดเตรียม", subtitle: "Warehouse Queue — จัดเตรียม + แพคสินค้า" },
  "/delivery/queue": { title: "คิวจัดส่ง", subtitle: "Delivery Queue — สร้างเส้นทางจัดส่ง" },
  "/routes": { title: "เส้นทางจัดส่ง", subtitle: "วางแผนเส้นทางและติดตามการจัดส่ง" },
  "/users": { title: "ผู้ใช้งาน", subtitle: "จัดการผู้ใช้งานและสิทธิ์" },
  "/settings": { title: "ตั้งค่าบริษัท", subtitle: "ข้อมูลบริษัท, ภาษี, Invoice, ช่องทางรับเงิน" },
};

export default function DashboardShell({
  children,
  user,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const pageInfo = pageTitles[pathname] || {
    title: "ระบบจัดการ",
    subtitle: "",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-[68px]" : "ml-[260px]"
        )}
      >
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
