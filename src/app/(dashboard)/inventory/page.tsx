"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, AlertTriangle, Filter } from "lucide-react";
import { getInventory, getWarehouses } from "@/actions/data";
import Pagination from "@/components/ui/Pagination";

export default function InventoryPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

  const load = useCallback((p: number, s: string, wId: string) => {
    getInventory(p, 20, s, wId).then((res: any) => {
      setStocks(res.data || []);
      setTotalPages(res.totalPages || 0);
      setTotal(res.total || 0);
    });
  }, []);

  useEffect(() => { 
    load(1, "", ""); 
    getWarehouses().then(setWarehouses);
  }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => { setPage(1); load(1, val, warehouseId); }, 400));
  };

  const handleWarehouseChange = (val: string) => {
    setWarehouseId(val);
    setPage(1);
    load(1, search, val);
  };

  const lowCount = stocks.filter((s: any) => s.quantity <= s.minQuantity).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">สต็อกสินค้า</h2>
          <p className="text-sm text-gray-500">ดูสต็อกสินค้าตามคลังสินค้า ({total} รายการ)</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="ค้นหาสินค้า หรือ SKU..." value={search} onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm" />
        </div>
        
        <div className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm appearance-none min-w-[180px]"
            >
              <option value="">คลังสินค้าทั้งหมด</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.branch.name})</option>
              ))}
            </select>
          </div>

          {lowCount > 0 && (
            <span className="px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4" /> ใกล้หมด ({lowCount})
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">สินค้า</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">คลังสินค้า</th>
              <th className="text-left py-3.5 px-5 text-gray-500 font-medium">บริษัท</th>
              <th className="text-right py-3.5 px-5 text-gray-500 font-medium">คงเหลือ</th>
              <th className="text-right py-3.5 px-5 text-gray-500 font-medium">ขั้นต่ำ</th>
              <th className="text-center py-3.5 px-5 text-gray-500 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock: any) => {
              const isLow = stock.quantity <= stock.minQuantity;
              return (
                <tr key={stock.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-gray-900">{stock.productVariant.product.name}</p>
                    <p className="text-xs text-gray-400">{stock.productVariant.name}</p>
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">{stock.warehouse.name}</td>
                  <td className="py-3.5 px-5 text-gray-500 text-xs">{stock.warehouse.branch.company.name}</td>
                  <td className={`py-3.5 px-5 text-right font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>{stock.quantity}</td>
                  <td className="py-3.5 px-5 text-right text-gray-500">{stock.minQuantity}</td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {isLow ? "ใกล้หมด" : "ปกติ"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {stocks.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">ยังไม่มีข้อมูลสต็อก</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); load(p, search, warehouseId); }} />
    </div>
  );
}
