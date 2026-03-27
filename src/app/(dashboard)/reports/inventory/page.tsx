"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Search, DollarSign, TrendingUp, Download, PieChart, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getInventoryReportData } from "@/actions/finance";
import { getWarehouses } from "@/actions/data";
import Link from "next/link";

export default function InventoryReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getInventoryReportData(selectedWarehouse || undefined);
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getWarehouses().then(setWarehouses);
  }, []);

  // Filter items client-side
  const filteredItems = data?.items?.filter((item: any) => 
    item.productName.toLowerCase().includes(search.toLowerCase()) || 
    item.variantName.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    (item.barcode && item.barcode.includes(search)) ||
    item.categoryName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานสินค้าคงคลัง</h1>
          <p className="text-sm text-gray-500 mt-1">สรุปมูลค่าสต็อกและจำนวนสินค้าแยกตามคลัง</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={selectedWarehouse} 
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">รวมทุกคลังสินค้า (All Warehouses)</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>
            ))}
          </select>
          <button 
            type="button" 
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" /> พิมพ์
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-20 text-blue-600">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-1">มูลค่าสต็อก (ทุน)</p>
                <h2 className="text-3xl font-bold">{formatCurrency(data.totalCostValue)}</h2>
              </div>
              <PieChart className="w-24 h-24 text-white/10 absolute -bottom-4 -right-4" />
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-emerald-100 text-sm font-medium mb-1">มูลค่าสต็อก (ราคาขายรวม)</p>
                <h2 className="text-3xl font-bold">{formatCurrency(data.totalRetailValue)}</h2>
                <p className="text-xs text-emerald-100 mt-2">
                  กำไรคาดการณ์: {formatCurrency(data.totalRetailValue - data.totalCostValue)}
                </p>
              </div>
              <TrendingUp className="w-24 h-24 text-white/10 absolute -bottom-4 -right-4" />
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">จำนวนสินค้าทั้งหมด</p>
                <h2 className="text-3xl font-bold text-gray-900">{data.totalItems.toLocaleString()} <span className="text-lg text-gray-500 font-normal">ชิ้น</span></h2>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center absolute right-6 top-1/2 -translate-y-1/2">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                รายละเอียดสินค้า ({filteredItems.length} รายการ)
              </h3>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาสินค้า / SKU..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4">สินค้า</th>
                    <th className="px-5 py-4">หมวดหมู่</th>
                    <th className="px-5 py-4 text-right">จำนวน</th>
                    <th className="px-5 py-4 text-right">ต้นทุน/ชิ้น</th>
                    <th className="px-5 py-4 text-right">ราคาพาร์ค</th>
                    <th className="px-5 py-4 text-right">มูลค่ารวม (ทุน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <Link href={`/products/${item.productId || item.id}`} className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.productName}
                          </Link>
                          <span className="text-xs text-gray-500 mt-0.5">{item.variantName} | SKU: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">{item.sku}</span></span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{item.categoryName}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-bold ${item.quantity <= 0 ? 'text-red-500' : 'text-gray-900'}`}>{item.quantity.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-500">{formatCurrency(item.cost)}</td>
                      <td className="px-5 py-4 text-right text-gray-500">{formatCurrency(item.price)}</td>
                      <td className="px-5 py-4 text-right font-medium text-indigo-600">{formatCurrency(item.costValue)}</td>
                    </tr>
                  ))}
                  
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        {search ? "ไม่พบผลลัพธ์ที่ค้นหา" : "ไม่มีข้อมูลสินค้า"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

