"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft, Package, Tag, Barcode, DollarSign, Layers, Warehouse,
  History, Plus, X, Save, Pencil, TrendingUp, TrendingDown
} from "lucide-react";
import { getProductById, updateVariant, createVariant, createUnitConversion, deleteUnitConversion, getUniqueUnitNames } from "@/actions/product-features";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "units" | "stock" | "history">("info");
  const [editVariant, setEditVariant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [newUnit, setNewUnit] = useState<any>(null);
  const [newVariant, setNewVariant] = useState<any>(null);
  const [uniqueUnits, setUniqueUnits] = useState<string[]>([]);

  const load = () => {
    getProductById(id).then((p: any) => { 
      setProduct(p); 
      setLoading(false);
      if (p?.companyId) getUniqueUnitNames(p.companyId).then(setUniqueUnits);
    });
  };
  useEffect(() => { load(); }, [id]);

  const handleSaveVariant = async () => {
    if (!editVariant) return;
    setSaving(true);
    await updateVariant(editVariant.id, {
      name: editVariant.name,
      sku: editVariant.sku,
      barcode: editVariant.barcode || undefined,
      price: parseFloat(editVariant.price),
      cost: parseFloat(editVariant.cost),
    });
    setEditVariant(null);
    setSaving(false);
    load();
  };

  const handleCreateVariant = async () => {
    if (!newVariant?.name || !newVariant?.sku) return;
    setSaving(true);
    await createVariant(id, {
      name: newVariant.name,
      sku: newVariant.sku,
      price: parseFloat(newVariant.price || "0"),
      cost: parseFloat(newVariant.cost || "0"),
      size: newVariant.size || undefined,
      color: newVariant.color || undefined,
      material: newVariant.material || undefined,
      barcode: newVariant.barcode || undefined,
    });
    setNewVariant(null);
    setSaving(false);
    load();
  };

  const handleAddUnit = async (variantId: string) => {
    if (!newUnit?.unitName || !newUnit?.qtyPerUnit) return;
    setSaving(true);
    await createUnitConversion({
      productVariantId: variantId,
      unitName: newUnit.unitName,
      qtyPerUnit: parseInt(newUnit.qtyPerUnit),
      pricePerUnit: parseFloat(newUnit.pricePerUnit || "0"),
      barcode: newUnit.barcode || undefined,
    });
    setNewUnit(null);
    setSaving(false);
    load();
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("ลบหน่วยขายนี้?")) return;
    await deleteUnitConversion(unitId);
    load();
  };

  if (loading) return <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>;
  if (!product) return <div className="p-12 text-center text-gray-400">ไม่พบสินค้า</div>;

  const tabs = [
    { key: "info", label: "ข้อมูล/ราคา", icon: Tag },
    { key: "units", label: "หน่วยขาย", icon: Layers },
    { key: "stock", label: "สต็อก", icon: Warehouse },
    { key: "history", label: "ประวัติ", icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/products")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          <p className="text-sm text-gray-500">{product.company.name} · {product.category?.name || "ไม่มีหมวดหมู่"}</p>
        </div>
        <button onClick={() => setNewVariant({ name: "", sku: "", price: "", cost: "", size: "", color: "", material: "", barcode: "" })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> เพิ่มตัวเลือก
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {product.variants.map((v: any) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{v.name}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>SKU: {v.sku}</span>
                      {v.barcode && <span>Barcode: {v.barcode}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setEditVariant({ ...v })}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  <Pencil className="w-3 h-3" /> แก้ไข
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">ราคาขาย</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(v.price)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">ต้นทุน</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(v.cost)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">กำไร</p>
                  <p className={`text-lg font-bold ${v.price - v.cost > 0 ? "text-blue-600" : "text-red-600"}`}>
                    {formatCurrency(v.price - v.cost)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">% กำไร</p>
                  <p className="text-lg font-bold text-purple-600">
                    {v.cost > 0 ? `${(((v.price - v.cost) / v.cost) * 100).toFixed(0)}%` : "—"}
                  </p>
                </div>
              </div>

              {(v.size || v.color || v.material) && (
                <div className="flex gap-2 mt-3">
                  {v.size && <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">ขนาด: {v.size}</span>}
                  {v.color && <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">สี: {v.color}</span>}
                  {v.material && <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">วัสดุ: {v.material}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "units" && (
        <div className="space-y-4">
          {product.variants.map((v: any) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400">หน่วยพื้นฐาน: ชิ้น (ราคา {formatCurrency(v.price)})</p>
                </div>
                <button onClick={() => setNewUnit({ variantId: v.id, unitName: "", qtyPerUnit: "", pricePerUnit: "" })}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                  <Plus className="w-3 h-3" /> เพิ่มหน่วย
                </button>
              </div>

              {/* Unit list */}
              <div className="space-y-2">
                {v.unitConversions.length === 0 && !newUnit?.variantId ? (
                  <p className="text-xs text-gray-300 text-center py-4 border border-dashed border-gray-200 rounded-xl">ยังไม่มีหน่วยขายเพิ่มเติม</p>
                ) : (
                  v.unitConversions.map((unit: any) => (
                    <div key={unit.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{unit.unitName}</p>
                          <p className="text-xs text-gray-400">= {unit.qtyPerUnit} ชิ้น {unit.barcode && `· ${unit.barcode}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(unit.pricePerUnit)}</p>
                        <button onClick={() => handleDeleteUnit(unit.id)} className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
                      </div>
                    </div>
                  ))
                )}

                {/* New unit form */}
                {newUnit?.variantId === v.id && (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-200">
                    <p className="text-xs font-bold text-blue-700">เพิ่มหน่วยขายใหม่</p>
                    <div className="grid grid-cols-4 gap-2">
                      <input value={newUnit.unitName} onChange={(e) => setNewUnit({ ...newUnit, unitName: e.target.value })}
                        list="unit-suggestions"
                        placeholder="ชื่อหน่วย (เช่น โหล)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <datalist id="unit-suggestions">
                        {uniqueUnits.map((u, i) => <option key={i} value={u} />)}
                      </datalist>
                      <input value={newUnit.qtyPerUnit} onChange={(e) => setNewUnit({ ...newUnit, qtyPerUnit: e.target.value })}
                        placeholder="จำนวน/หน่วย" type="number" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <input value={newUnit.pricePerUnit} onChange={(e) => setNewUnit({ ...newUnit, pricePerUnit: e.target.value })}
                        placeholder="ราคา/หน่วย" type="number" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <input value={newUnit.barcode || ""} onChange={(e) => setNewUnit({ ...newUnit, barcode: e.target.value })}
                        placeholder="Barcode (ถ้ามี)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setNewUnit(null)} className="px-3 py-1.5 text-gray-500 text-xs">ยกเลิก</button>
                      <button onClick={() => handleAddUnit(v.id)} disabled={saving}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stock" && (
        <div className="space-y-4">
          {product.variants.map((v: any) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-900 mb-3">{v.name}</p>
              {v.stocks.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">ไม่มีข้อมูลสต็อก</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium text-xs">คลัง</th>
                      <th className="text-left py-2 text-gray-500 font-medium text-xs">สาขา</th>
                      <th className="text-right py-2 text-gray-500 font-medium text-xs">จำนวน</th>
                      <th className="text-right py-2 text-gray-500 font-medium text-xs">ขั้นต่ำ</th>
                      <th className="text-center py-2 text-gray-500 font-medium text-xs">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.stocks.map((s: any) => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="py-2.5 font-medium text-gray-900">{s.warehouse.name}</td>
                        <td className="py-2.5 text-gray-500">{s.warehouse.branch?.name || "—"}</td>
                        <td className="py-2.5 text-right font-bold text-gray-900">{s.quantity}</td>
                        <td className="py-2.5 text-right text-gray-400">{s.minQuantity}</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            s.quantity <= 0 ? "bg-red-100 text-red-700" :
                            s.quantity <= s.minQuantity ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {s.quantity <= 0 ? "หมด" : s.quantity <= s.minQuantity ? "ใกล้หมด" : "ปกติ"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {product.variants.map((v: any) => {
            // Merge order items and GR items into one timeline
            const timeline: any[] = [
              ...v.orderItems.map((oi: any) => ({
                type: "sale",
                date: oi.order.createdAt,
                ref: oi.order.orderNumber,
                customer: oi.order.customerName,
                qty: -oi.quantity,
                total: oi.totalPrice,
                status: oi.order.status,
              })),
              ...v.goodsReceivingItems.map((gi: any) => ({
                type: "receive",
                date: gi.receiving.createdAt,
                ref: gi.receiving.grNumber,
                customer: gi.receiving.supplierName,
                qty: gi.quantity,
                total: gi.totalCost,
                status: "RECEIVED",
              })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="font-bold text-gray-900 mb-3">{v.name} — ประวัติเคลื่อนไหว ({timeline.length})</p>
                {timeline.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-4">ไม่มีประวัติ</p>
                ) : (
                  <div className="space-y-1">
                    {timeline.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === "sale" ? "bg-red-50" : "bg-green-50"
                        }`}>
                          {item.type === "sale" ?
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
                            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-gray-900">{item.ref}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                              item.type === "sale" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                            }`}>
                              {item.type === "sale" ? "ขาย" : "รับเข้า"}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">{item.customer || "—"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold ${item.qty < 0 ? "text-red-600" : "text-green-600"}`}>
                            {item.qty > 0 ? "+" : ""}{item.qty}
                          </p>
                          <p className="text-[10px] text-gray-400">{formatCurrency(item.total || 0)}</p>
                        </div>
                        <p className="text-[10px] text-gray-300 shrink-0 w-16 text-right">
                          {new Date(item.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Variant Modal */}
      {editVariant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditVariant(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">✏️ แก้ไข {editVariant.name}</h3>
              <button onClick={() => setEditVariant(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อตัวเลือก</label>
                <input value={editVariant.name} onChange={(e) => setEditVariant({ ...editVariant, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">SKU</label>
                  <input value={editVariant.sku} onChange={(e) => setEditVariant({ ...editVariant, sku: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Barcode</label>
                  <input value={editVariant.barcode || ""} onChange={(e) => setEditVariant({ ...editVariant, barcode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ราคาขาย (บาท)</label>
                  <input value={editVariant.price} onChange={(e) => setEditVariant({ ...editVariant, price: e.target.value })}
                    type="number" step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ต้นทุน (บาท)</label>
                  <input value={editVariant.cost} onChange={(e) => setEditVariant({ ...editVariant, cost: e.target.value })}
                    type="number" step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ขนาด</label>
                  <input value={editVariant.size || ""} onChange={(e) => setEditVariant({ ...editVariant, size: e.target.value })}
                    placeholder="เช่น 120x60"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">สี</label>
                  <input value={editVariant.color || ""} onChange={(e) => setEditVariant({ ...editVariant, color: e.target.value })}
                    placeholder="เช่น ธรรมชาติ, วอลนัท"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">วัสดุ</label>
                  <input value={editVariant.material || ""} onChange={(e) => setEditVariant({ ...editVariant, material: e.target.value })}
                    placeholder="เช่น MDF, ไม้จริง"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditVariant(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSaveVariant} disabled={saving}
                className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Variant Modal */}
      {newVariant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNewVariant(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">➕ เพิ่มตัวเลือกใหม่</h3>
              <button onClick={() => setNewVariant(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อตัวเลือก *</label>
                  <input value={newVariant.name} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    placeholder="เช่น 120x60cm - สีดำ"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">SKU *</label>
                  <input value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                    placeholder="เช่น BRM-DK-003"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ราคาขาย (บาท)</label>
                  <input value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ต้นทุน (บาท)</label>
                  <input value={newVariant.cost} onChange={(e) => setNewVariant({ ...newVariant, cost: e.target.value })}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ขนาด</label>
                  <input value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                    placeholder="เช่น 120x60"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">สี</label>
                  <input value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                    placeholder="เช่น ดำ, ขาว, วอลนัท"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">วัสดุ</label>
                  <input value={newVariant.material} onChange={(e) => setNewVariant({ ...newVariant, material: e.target.value })}
                    placeholder="เช่น MDF, ไม้จริง"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Barcode</label>
                <input value={newVariant.barcode} onChange={(e) => setNewVariant({ ...newVariant, barcode: e.target.value })}
                  placeholder="EAN-13 / UPC (ถ้ามี)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setNewVariant(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleCreateVariant} disabled={saving || !newVariant.name || !newVariant.sku}
                className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> {saving ? "กำลังบันทึก..." : "เพิ่มตัวเลือก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
