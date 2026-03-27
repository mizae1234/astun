"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Warehouse,
  Package,
  BarChart3,
  ArrowRightLeft,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Car,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  ClipboardCheck,
  PackageSearch,
  LayoutList,
  PlusCircle,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: {
    name: string;
    email: string;
    role: string;
    companyName?: string | null;
  };
  collapsed: boolean;
  onToggle: () => void;
};

const menuGroups = [
  {
    label: "ภาพรวม",
    items: [
      { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
      { href: "/orders/create", label: "สร้างคำสั่งซื้อ", icon: PlusCircle },
      { href: "/orders", label: "คำสั่งซื้อทั้งหมด", icon: ShoppingCart },
    ],
  },
  {
    label: "จัดส่ง",
    items: [
      { href: "/warehouse/queue", label: "คิวจัดเตรียม", icon: PackageSearch },
      { href: "/delivery/queue", label: "คิวจัดส่ง", icon: LayoutList },
      { href: "/routes", label: "รอบจัดส่ง", icon: Truck },
    ],
  },
  {
    label: "ตรวจสอบและสั่งซื้อ",
    items: [
      { href: "/purchasing", label: "ใบสั่งซื้อ (PO)", icon: ClipboardCheck },
    ],
  },
  {
    label: "สินค้า & สต็อก",
    items: [
      { href: "/products", label: "สินค้า", icon: Package },
      { href: "/products/sets", label: "เซ็ตสินค้า", icon: Package },
      { href: "/inventory", label: "สต็อกสินค้า", icon: BarChart3 },
      { href: "/goods-receiving", label: "รับสินค้าเข้า", icon: ClipboardCheck },
      { href: "/stock-transfer", label: "โอนสต็อก", icon: ArrowRightLeft },
      {
        href: "/intercompany",
        label: "ข้ามบริษัท",
        icon: ArrowLeftRight,
        roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
      },
    ],
  },
  {
    label: "รายงาน",
    items: [
      { href: "/reports/sales", label: "รายงานยอดขาย", icon: TrendingUp },
      { href: "/reports/inventory", label: "สินค้าคงคลัง", icon: Package },
      { href: "/reports/finance", label: "การเงิน", icon: CircleDollarSign },
    ],
  },
  {
    label: "การจัดการ",
    items: [
      {
        href: "/companies",
        label: "บริษัท",
        icon: Building2,
        roles: ["SUPER_ADMIN"],
      },
      { href: "/branches", label: "สาขา", icon: GitBranch },
      { href: "/warehouses", label: "คลังสินค้า", icon: Warehouse },
      { href: "/vehicles", label: "รถจัดส่ง", icon: Car },
      { href: "/suppliers", label: "ผู้จำหน่าย", icon: Users },
      { href: "/users", label: "ผู้ใช้งาน", icon: Users },
    ],
  },
];

export default function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col z-30 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                Astun System
              </h1>
              <p className="text-[10px] text-gray-400 leading-tight">
                ระบบจัดการธุรกิจ
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!("roles" in item) || !item.roles) return true;
            return item.roles.includes(user.role);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-6">
              {!collapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          isActive ? "text-blue-600" : "text-gray-400"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {user.companyName || user.role}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
