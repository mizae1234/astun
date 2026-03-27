"use client";

import { Printer } from "lucide-react";

export default function PrintButton({
  label = "พิมพ์ใบแจ้งหนี้",
  className = "print:hidden px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm font-bold flex items-center gap-2",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button onClick={() => window.print()} className={className}>
      <Printer className="w-4 h-4" /> {label}
    </button>
  );
}
