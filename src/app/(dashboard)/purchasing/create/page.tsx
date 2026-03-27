"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Search, Trash2, ArrowLeft, Save, Building2, UserCircle, Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCompanies, getProducts } from "@/actions/data";
import { getAllSuppliers } from "@/actions/supplier";
import { createPurchaseOrder } from "@/actions/purchasing";
import { formatCurrency } from "@/lib/utils";

type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  productName: string;
  cost: number;
};

export default function CreatePOPage() {
  const router = useRouter();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  
  const [items, setItems] = useState<{ variantId: string; quantity: number; unitPrice: number; }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      getAllSuppliers(selectedCompany).then(setSuppliers);
      // Get products for the company to add to PO
      getProducts().then((res: any) => {
        // Flatten variants
        const flattened: ProductVariant[] = [];
        res.data.forEach((p: any) => {
          if (p.companyId === selectedCompany) {
            p.variants.forEach((v: any) => {
              flattened.push({
                id: v.id,
                name: v.name,
                sku: v.sku,
                productName: p.name,
                cost: v.cost || 0
              });
            });
          }
        });
        setProducts(flattened);
      });
    } else {
      setSuppliers([]);
      setProducts([]);
    }
  }, [selectedCompany]);

  const handleAddItem = (variant: ProductVariant) => {
    if (items.some(i => i.variantId === variant.id)) return;
    setItems([...items, { variantId: variant.id, quantity: 1, unitPrice: variant.cost }]);
    setProductSearch("");
  };

  const updateItemQty = (idx: number, delta: number) => {
    setItems(items.map((item, i) => {
      if (i !== idx) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const updateItemPrice = (idx: number, price: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, unitPrice: price } : item));
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const filteredProducts = products.filter(p => 
    !items.some(i => i.variantId === p.id) && 
    (p.productName.toLowerCase().includes(productSearch.toLowerCase()) || 
     p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 5);

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async () => {
    if (!selectedCompany || !selectedSupplier) { setError("กรุณาเลือกบริษัทและผู้จำหน่าย"); return; }
    if (items.length === 0) { setError("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"); return; }
    
    setLoading(true); setError("");
    try {
      await createPurchaseOrder({
        companyId: selectedCompany,
        supplierId: selectedSupplier,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        note: note || undefined,
        items: items.map(i => ({ productVariantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice }))
      });
      router.push("/purchasing");
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchasing" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">สร้างใบสั่งซื้อ (PO)</h2>
          <p className="text-sm text-gray-500">ระบุรายละเอียดและรายการสินค้าที่ต้องการสั่งซื้อ</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm font-medium">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Header Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400" /> บริษัทผู้สั่งซื้อ *
            </label>
            <select value={selectedCompany} onChange={(e) => { setSelectedCompany(e.target.value); setSelectedSupplier(""); setItems([]); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
              <option value="">เลือกบริษัท</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <UserCircle className="w-4 h-4 text-gray-400" /> ผู้จำหน่าย (Supplier) *
            </label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} disabled={!selectedCompany}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">เลือกผู้จำหน่าย</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" /> วันที่กำหนดส่ง
            </label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-gray-400" /> หมายเหตุ
            </label>
            <textarea placeholder="ระบุหมายเหตุการสั่งซื้อ..." value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none" />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">รายการสินค้า ({items.length})</h3>
            
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="ค้นหาสินค้าเพื่อเพิ่ม..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                disabled={!selectedCompany}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" />
              
              {productSearch && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => handleAddItem(p)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center text-sm transition-colors">
                      <div className="truncate pr-4">
                        <span className="font-medium text-gray-900 block truncate">{p.productName}</span>
                        <span className="text-xs text-gray-500">{p.name} · {p.sku}</span>
                      </div>
                      <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <div className="p-3 text-sm text-gray-500 text-center">ไม่พบสินค้า</div>}
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">สินค้า</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-32 text-center">จำนวน</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-32 text-right">ราคาต่อหน่วย</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-32 text-right">รวม</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const product = products.find(p => p.id === item.variantId);
                  return (
                    <tr key={item.variantId} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate">{product?.productName}</div>
                        <div className="text-xs text-gray-500">{product?.name} · {product?.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateItemQty(idx, -1)} className="w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center bg-white hover:bg-gray-50"><Minus className="w-3 h-3 text-gray-500" /></button>
                          <input type="number" min="1" value={item.quantity} onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) setItems(items.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                          }} className="w-12 text-center text-sm font-medium outline-none bg-transparent" />
                          <button onClick={() => updateItemQty(idx, 1)} className="w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center bg-white hover:bg-gray-50"><Plus className="w-3 h-3 text-gray-500" /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" step="0.01" value={item.unitPrice} 
                          onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-right text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 float-right" />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeItem(idx)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีรายการสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-900">ยอดรวมทั้งสิ้น</td>
                  <td className="px-4 py-4 text-right font-bold text-blue-600 text-lg">{formatCurrency(totalAmount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSubmit} disabled={loading || items.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Save className="w-5 h-5" />
            {loading ? "กำลังบันทึก..." : "บันทึกใบสั่งซื้อ"}
          </button>
        </div>
      </div>
    </div>
  );
}
