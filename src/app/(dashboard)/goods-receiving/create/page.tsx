"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { createGoodsReceiving, getCompanyWarehouses } from "@/actions/goods-receiving";
import { getCompanies, getProducts } from "@/actions/data";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function CreateGoodsReceivingPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<{ productVariantId: string; variantName: string; expectedQty: number; unitCost: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getCompanies().then((c: any) => setCompanies(c)); }, []);

  useEffect(() => {
    if (selectedCompany) {
      getCompanyWarehouses(selectedCompany).then((w: any) => setWarehouses(w));
      getProducts().then((p: any) => setProducts(p.filter((pr: any) => pr.companyId === selectedCompany)));
    }
  }, [selectedCompany]);

  const addItem = (variantId: string, variantName: string, cost: number) => {
    if (items.find((i) => i.productVariantId === variantId)) return;
    setItems((prev) => [...prev, { productVariantId: variantId, variantName, expectedQty: 1, unitCost: cost }]);
  };

  const updateItem = (idx: number, field: string, value: number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((sum, i) => sum + i.unitCost * i.expectedQty, 0);

  const handleSubmit = async () => {
    if (!supplierName.trim()) { setError("กรอกชื่อ Supplier"); return; }
    if (!selectedWarehouse) { setError("เลือกคลังสินค้า"); return; }
    if (items.length === 0) { setError("เพิ่มสินค้าอย่างน้อย 1 รายการ"); return; }

    setLoading(true);
    setError("");
    try {
      await createGoodsReceiving({
        supplierName,
        supplierContact: supplierContact || undefined,
        invoiceNumber: invoiceNumber || undefined,
        warehouseId: selectedWarehouse,
        companyId: selectedCompany,
        items: items.map((i) => ({
          productVariantId: i.productVariantId,
          expectedQty: i.expectedQty,
          unitCost: i.unitCost,
        })),
        note: note || undefined,
      });
      router.push("/goods-receiving");
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/goods-receiving" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">สร้างใบรับสินค้า</h2>
          <p className="text-sm text-gray-500">Goods Receiving Note (GRN)</p>
        </div>
      </div>

      {/* Company + Warehouse */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">ข้อมูลหลัก</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">บริษัท</label>
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">เลือกบริษัท</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">คลังรับสินค้า</label>
              <SearchableSelect
                value={selectedWarehouse}
                onChange={(val) => setSelectedWarehouse(val)}
                placeholder="เลือกคลัง"
                disabled={!selectedCompany}
                options={warehouses.map((w: any) => ({ value: w.id, label: w.name, sub: w.branch.name }))}
              />
          </div>
        </div>
      </div>

      {/* Supplier */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">ข้อมูล Supplier</h3>
        <div className="grid grid-cols-3 gap-4">
          <input type="text" placeholder="ชื่อ Supplier *" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" placeholder="เบอร์ติดต่อ" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" placeholder="เลขที่ใบแจ้งหนี้" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <textarea placeholder="หมายเหตุ" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">รายการสินค้า</h3>
        </div>

        {/* Product selector */}
        {selectedCompany && products.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-2">เลือกสินค้าเพิ่ม:</p>
            <SearchableSelect
              value=""
              onChange={(val) => {
                const allVariants = products.flatMap((p: any) => p.variants.map((v: any) => ({ ...v, productName: p.name })));
                const v = allVariants.find((av: any) => av.id === val);
                if (v) addItem(v.id, `${v.productName} - ${v.name}`, v.cost);
              }}
              placeholder="ค้นหาสินค้า..."
              options={products.flatMap((p: any) =>
                p.variants
                  .filter((v: any) => !items.some((i) => i.productVariantId === v.id))
                  .map((v: any) => ({ value: v.id, label: `${v.name} (${v.sku})`, sub: p.name }))
              )}
            />
          </div>
        )}

        {/* Items table */}
        {items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">สินค้า</th>
                <th className="pb-2 w-24">จำนวน</th>
                <th className="pb-2 w-28">ราคาทุน/หน่วย</th>
                <th className="pb-2 w-24 text-right">รวม</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-900">{item.variantName}</td>
                  <td className="py-2">
                    <input type="number" min={1} value={item.expectedQty} onChange={(e) => updateItem(i, "expectedQty", parseInt(e.target.value) || 1)} className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center" />
                  </td>
                  <td className="py-2">
                    <input type="number" min={0} step={0.01} value={item.unitCost} onChange={(e) => updateItem(i, "unitCost", parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right" />
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900">฿{(item.unitCost * item.expectedQty).toLocaleString()}</td>
                  <td className="py-2">
                    <button onClick={() => removeItem(i)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="py-3 text-right font-bold text-gray-700">รวมทั้งหมด</td>
                <td className="py-3 text-right font-bold text-gray-900 text-base">฿{total.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <Link href="/goods-receiving" className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
          ยกเลิก
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          {loading ? "กำลังบันทึก..." : "บันทึกใบรับสินค้า"}
        </button>
      </div>
    </div>
  );
}
