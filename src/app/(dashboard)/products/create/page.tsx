"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCompanies, getCategories } from "@/actions/data";
import { createProduct } from "@/actions/mutations";

export default function CreateProductPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    companyId: "",
    categoryId: "",
  });

  const [variants, setVariants] = useState<any[]>([
    { sku: "", name: "Default", price: "", cost: "", size: "", color: "", material: "", barcode: "" }
  ]);

  useEffect(() => {
    getCompanies().then(setCompanies);
    getCategories().then(setCategories);
  }, []);

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.companyId || !formData.slug) {
        setError("กรุณากรอกชื่อสินค้า, รหัสย่อสินค้า (Slug) และเลือกบริษัทให้ครบถ้วน");
        return;
      }
      for (const v of variants) {
        if (!v.sku || !v.name) {
          setError("กรุณากรอกชื่อตัวเลือกและ SKU ให้ครบถ้วน");
          return;
        }
      }

      setSaving(true);
      setError("");

      const parsedVariants = variants.map((v) => ({
        ...v,
        price: parseFloat(v.price || "0"),
        cost: parseFloat(v.cost || "0"),
        size: v.size || undefined,
        color: v.color || undefined,
        material: v.material || undefined,
        barcode: v.barcode || undefined,
      }));

      await createProduct({
        ...formData,
        categoryId: formData.categoryId || undefined,
        variants: parsedVariants,
      });

      router.push("/products");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสร้างสินค้า");
      setSaving(false);
    }
  };

  const updateVariant = (index: number, key: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index][key] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: "", name: "", price: "", cost: "", size: "", color: "", material: "", barcode: "" }
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">เพิ่มสินค้าใหม่</h2>
            <p className="text-sm text-gray-500">สร้างข้อมูลสินค้าหลักและตัวเลือกของสินค้า</p>
          </div>
        </div>
        <button onClick={handleCreate} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium shadow-sm">
          <Save className="w-4 h-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">ข้อมูลทั่วไป</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">ชื่อสินค้า *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="เช่น โต๊ะทำงานไม้โอ๊ค" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">รหัสย่อ (Slug) *</label>
              <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="เช่น oak-desk" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">บริษัท *</label>
              <select value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option value="">-- เลือกบริษัท --</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">หมวดหมู่</label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option value="">ไม่มีหมวดหมู่</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">ตัวเลือกสินค้า (Variants)</h3>
            <p className="text-xs text-gray-500">เช่น สี ขนาด รุ่น หรือขนาดบรรจุภัณฑ์</p>
          </div>
          <button onClick={addVariant} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            <Plus className="w-4 h-4" /> เพิ่มตัวเลือก
          </button>
        </div>
        <div className="p-5 space-y-4">
          {variants.map((v, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-4 relative bg-gray-50/20">
              {variants.length > 1 && (
                <button onClick={() => removeVariant(i)} className="absolute top-4 right-4 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อตัวเลือก *</label>
                  <input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น สีดำ 120cm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">SKU *</label>
                  <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="รหัสสินค้า" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ราคาขาย</label>
                  <input type="number" step="0.01" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ต้นทุน</label>
                  <input type="number" step="0.01" value={v.cost} onChange={(e) => updateVariant(i, "cost", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Barcode</label>
                  <input value={v.barcode} onChange={(e) => updateVariant(i, "barcode", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ขนาด</label>
                  <input value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">สี</label>
                  <input value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">วัสดุ</label>
                  <input value={v.material} onChange={(e) => updateVariant(i, "material", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
