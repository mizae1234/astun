"use client";

import { Bell, Search } from "lucide-react";

type TopbarProps = {
  title: string;
  subtitle?: string;
  user: {
    name: string;
    role: string;
    companyName?: string | null;
    branchName?: string | null;
  };
};

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "ผู้ดูแลระบบ",
    OWNER: "เจ้าของ",
    COMPANY_ADMIN: "ผู้ดูแลบริษัท",
    BRANCH_ADMIN: "ผู้ดูแลสาขา",
    STAFF: "พนักงาน",
  };
  return map[role] || role;
}

export default function Topbar({ title, subtitle, user }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Title */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{getRoleLabel(user.role)}</p>
            <p className="text-[11px] text-gray-400">
              {user.companyName || "ทุกบริษัท"}
              {user.branchName && ` · ${user.branchName}`}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
