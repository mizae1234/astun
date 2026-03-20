"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Package, Save, ArrowLeft } from "lucide-react";
import { getProductSets, createProductSet, deleteProductSet } from "@/actions/product-features";
import { getProducts, getCompanies } from "@/actions/data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function ProductSetsPage() {
  const [sets, setSets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", description: "", price: 0 });
  const [items, setItems] = useState<{ productVariantId: string; variantName: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    getProductSets().then((s: any) => setSets(s));
    getCompanies().then((c: any) => setCompanies(c));
    getProducts().then((p: any) => setProducts(p));
  };
  useEffect(() => { load(); }, []);

  const addItem = (variantId: string, variantName: string) => {
    if (items.find((i) => i.productVariantId === variantId)) return;
    setItems([...items, { productVariantId: variantId, variantName, quantity: 1 }]);
  };

  const handleCreate = async () => {
    if (!form.name || !form.sku || !selectedCompany || items.length === 0) {
      setError("กรอกข้อมูลให้ครบ"); return;
    }
    setLoading(true); setError("");
    try {
      await createProductSet({
        ...form, companyId: selectedCompany,
        items: items.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
      });
      setShowForm(false); setForm({ name: "", sku: "", barcode: "", description: "", price: 0 }); setItems([]);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    await deleteProductSet(id);
    load();
  };

  const companyProducts = products.filter((p: any) => p.companyId === selectedCompany);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">เซ็ตสินค้า</h2>
          <p className="text-sm text-gray-500">Product Sets — ขายสินค้าเป็นชุดราคาพิเศษ</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> สร้างเซ็ตใหม่
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">สร้างเซ็ตสินค้า</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">เลือกบริษัท</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="ชื่อเซ็ต *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="text" placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="number" placeholder="ราคาเซ็ต *" value={form.price || ""} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {selectedCompany && companyProducts.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-2">เลือกสินค้าในเซ็ต:</p>
              <SearchableSelect
                value=""
                onChange={(val) => {
                  const allV = companyProducts.flatMap((p: any) => p.variants.map((v: any) => ({ ...v, productName: p.name })));
                  const v = allV.find((av: any) => av.id === val);
                  if (v) addItem(v.id, `${v.productName} - ${v.name}`);
                }}
                placeholder="ค้นหาสินค้า..."
                options={companyProducts.flatMap((p: any) =>
                  p.variants
                    .filter((v: any) => !items.some((i) => i.productVariantId === v.id))
                    .map((v: any) => ({ value: v.id, label: `${v.name} (${v.sku})`, sub: p.name }))
                )}
              />
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-blue-50 rounded-lg p-2.5">
                  <span className="flex-1 text-sm text-gray-900">{item.variantName}</span>
                  <input type="number" min={1} value={item.quantity}
                    onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                    className="w-16 px-2 py-1 border border-blue-200 rounded-lg text-sm text-center" />
                  <span className="text-xs text-gray-500">ชิ้น</span>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">ยกเลิก</button>
            <button onClick={handleCreate} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300">
              <Save className="w-4 h-4" /> {loading ? "กำลังบันทึก..." : "บันทึกเซ็ต"}
            </button>
          </div>
        </div>
      )}

      {/* Sets list */}
      {sets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sets.map((set: any) => {
            const itemsTotal = set.items.reduce((s: number, i: any) => s + (i.productVariant.price * i.quantity), 0);
            const savings = itemsTotal - set.price;
            return (
              <div key={set.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Package className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                      <p className="font-bold text-gray-900">{set.name}</p>
                      <p className="text-xs text-gray-400">{set.sku} · {set.company.name}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(set.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1 mb-3">
                  {set.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600">
                      <span>{item.productVariant.product.name} - {item.productVariant.name} ×{item.quantity}</span>
                      <span className="text-gray-400">{formatCurrency(item.productVariant.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-lg font-bold text-indigo-600">{formatCurrency(set.price)}</span>
                    {savings > 0 && <span className="ml-2 text-xs text-emerald-600">ประหยัด {formatCurrency(savings)}</span>}
                  </div>
                  <span className="text-xs line-through text-gray-400">{formatCurrency(itemsTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">ยังไม่มีเซ็ตสินค้า</div>
      )}
    </div>
  );
}
