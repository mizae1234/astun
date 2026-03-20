"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, LayoutGrid, List, Package } from "lucide-react";
import { getProductsWithUnits } from "@/actions/product-features";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

  const load = useCallback((p: number, s: string) => {
    getProductsWithUnits(p, 20, s).then((res: any) => {
      setProducts(res.data || []);
      setTotalPages(res.totalPages || 0);
      setTotal(res.total || 0);
    });
  }, []);

  useEffect(() => { load(1, ""); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => { setPage(1); load(1, val); }, 400));
  };

  const handlePage = (p: number) => { setPage(p); load(p, search); };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/products/sets" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
              <Package className="w-3.5 h-3.5" /> เซ็ตสินค้า
            </Link>
            <span className="text-xs text-gray-400">{total} สินค้า</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="ค้นหาสินค้า / SKU / barcode" value={search} onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
            </div>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setView("grid")}
                className={`p-2 ${view === "grid" ? "bg-blue-600 text-white" : "bg-white text-gray-400 hover:bg-gray-50"} transition-colors`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")}
                className={`p-2 ${view === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-400 hover:bg-gray-50"} transition-colors`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product: any) => {
            const minPrice = product.variants.length > 0 ? Math.min(...product.variants.map((v: any) => v.price)) : 0;
            const maxPrice = product.variants.length > 0 ? Math.max(...product.variants.map((v: any) => v.price)) : 0;
            const totalStock = product.variants.reduce((s: number, v: any) => s + v.stocks.reduce((ss: number, st: any) => ss + st.quantity, 0), 0);
            return (
              <div key={product.id} onClick={() => window.location.href = `/products/${product.id}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <span className="text-5xl">{product.image || "📦"}</span>
                  <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">{product.variants.length} ตัวเลือก</span>
                  {totalStock <= 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">หมด</span>}
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 leading-tight min-h-[2.5rem]">{product.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{product.category?.name || "ไม่มีหมวด"} · {product.company.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-red-500">{formatCurrency(minPrice)}</span>
                    {maxPrice > minPrice && <span className="text-xs text-gray-400">- {formatCurrency(maxPrice)}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">สต็อก: {totalStock}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">สินค้า</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Barcode</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">ราคา</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">ทุน</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">สต็อก</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">หน่วยขาย</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">บริษัท</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) =>
                product.variants.map((v: any) => {
                  const totalStock = v.stocks.reduce((s: number, st: any) => s + st.quantity, 0);
                  return (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400">{v.name} {v.size && `· ${v.size}`} {v.color && `· ${v.color}`}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{v.sku}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-gray-500">{v.barcode || "—"}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-sm font-medium text-gray-900">{formatCurrency(v.price)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-sm text-gray-500">{formatCurrency(v.cost)}</span></td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${totalStock <= 0 ? "text-red-500" : totalStock < 10 ? "text-amber-500" : "text-emerald-600"}`}>{totalStock}</span>
                      </td>
                      <td className="px-4 py-3">
                        {v.unitConversions.length > 0 ? (
                          <div className="space-y-0.5">
                            {v.unitConversions.map((u: any) => (
                              <span key={u.id} className="inline-block text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded mr-1">
                                {u.unitName} ({u.qtyPerUnit}) = {formatCurrency(u.pricePerUnit)}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-300">ชิ้น</span>}
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-400">{product.company.name}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {products.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">ไม่พบสินค้า</div>}
        </div>
      )}

      {products.length === 0 && view === "grid" && (
        <div className="text-center py-20 text-gray-400">ไม่พบสินค้า</div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePage} />
    </div>
  );
}
