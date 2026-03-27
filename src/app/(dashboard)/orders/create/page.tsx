"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, Package,
  Pause, Play, X, Tag, DollarSign, FileText, Warehouse,
  CreditCard, Banknote, Clock, CheckCircle, UserCheck
} from "lucide-react";
import { createOrder } from "@/actions/mutations";
import { getPOSProducts, getCompanyWarehouses } from "@/actions/goods-receiving";
import { getCompanies } from "@/actions/data";
import { getBankAccounts } from "@/actions/finance";
import { searchCustomersByPhone } from "@/actions/customer";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import SearchableSelect from "@/components/ui/SearchableSelect";

type UnitOption = { id: string; unitName: string; qtyPerUnit: number; pricePerUnit: number };
type CartItem = {
  variantId: string; variantName: string; productName: string;
  sku: string; price: number; quantity: number; available: number;
  warehouseId: string; warehouseName: string;
  selectedUnitId: string;
  units: UnitOption[];
};
type POSProduct = {
  stockId: string; variantId: string; variantName: string; sku: string;
  price: number; productName: string; productImage: string | null;
  category: string; available: number; warehouseId: string;
  units: UnitOption[];
};
type ParkedBill = {
  id: string; label: string; cart: CartItem[];
  companyId: string; warehouseId: string; createdAt: string;
};

const STORAGE_KEY = "astun_pos_state";
const PARKED_KEY = "astun_pos_parked";

export default function POSPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parkedBills, setParkedBills] = useState<ParkedBill[]>([]);
  const [showParked, setShowParked] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("fixed");
  const [addonAmount, setAddonAmount] = useState(0);
  const [addonLabel, setAddonLabel] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "CREDIT">("CASH");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [customerFound, setCustomerFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [phoneSearchTimeout, setPhoneSearchTimeout] = useState<any>(null);
  const [suggestedCustomers, setSuggestedCustomers] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PARKED_KEY);
      if (saved) setParkedBills(JSON.parse(saved));
      const state = localStorage.getItem(STORAGE_KEY);
      if (state) {
        const s = JSON.parse(state);
        // Migrate old cart items that lack units/warehouseId
        const migratedCart = (s.cart || []).map((c: any) => ({
          ...c,
          units: c.units || [{ id: "piece", unitName: "ชิ้น", qtyPerUnit: 1, pricePerUnit: c.price }],
          selectedUnitId: c.selectedUnitId || "piece",
          warehouseId: c.warehouseId || s.warehouseId || "",
          warehouseName: c.warehouseName || "",
        }));
        setCart(migratedCart);
        if (s.companyId) setSelectedCompany(s.companyId);
        if (s.warehouseId) setSelectedWarehouse(s.warehouseId);
      }
    } catch { /* ignore */ }
    setInitialized(true);
  }, []);

  // Auto-save cart
  const saveState = useCallback(() => {
    if (!initialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cart, companyId: selectedCompany, warehouseId: selectedWarehouse,
    }));
  }, [cart, selectedCompany, selectedWarehouse, initialized]);
  useEffect(() => { saveState(); }, [saveState]);

  useEffect(() => { getCompanies().then((c: any) => setCompanies(c)); }, []);
  useEffect(() => { getBankAccounts().then((b: any) => setBankAccounts(b)); }, []);

  useEffect(() => {
    if (selectedCompany) {
      getCompanyWarehouses(selectedCompany).then((w: any) => setWarehouses(w));
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedCompany && selectedWarehouse) {
      getPOSProducts(selectedCompany, selectedWarehouse).then((p) => setProducts(p as POSProduct[]));
    }
  }, [selectedCompany, selectedWarehouse]);

  // Extract unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchSearch = !search ||
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.variantName.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const getWarehouseName = (whId: string) => {
    const wh = warehouses.find((w: any) => w.id === whId);
    return wh ? wh.name : "—";
  };

  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.variantId === product.variantId && c.warehouseId === product.warehouseId);
      if (existing) {
        if (existing.quantity >= product.available) return prev;
        return prev.map((c) =>
          c.variantId === product.variantId && c.warehouseId === product.warehouseId
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, {
        variantId: product.variantId, variantName: product.variantName,
        productName: product.productName, sku: product.sku,
        price: product.price, quantity: 1, available: product.available,
        warehouseId: product.warehouseId,
        warehouseName: getWarehouseName(product.warehouseId),
        selectedUnitId: "piece",
        units: product.units || [{ id: "piece", unitName: "ชิ้น", qtyPerUnit: 1, pricePerUnit: product.price }],
      }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0 || newQty > c.available) return c;
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const changeUnit = (idx: number, unitId: string) => {
    setCart((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      const unit = c.units.find((u) => u.id === unitId);
      if (!unit) return c;
      return { ...c, selectedUnitId: unitId, price: unit.pricePerUnit };
    }));
  };

  const changeWarehouse = (idx: number, newWhId: string) => {
    setCart((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      return { ...c, warehouseId: newWhId, warehouseName: getWarehouseName(newWhId) };
    }));
  };

  const getEffectivePrice = (item: CartItem) => {
    if (!item.units || item.units.length === 0) return item.price;
    const unit = item.units.find((u) => u.id === item.selectedUnitId);
    return unit ? unit.pricePerUnit : item.price;
  };

  const getEffectiveQtyPerUnit = (item: CartItem) => {
    if (!item.units || item.units.length === 0) return 1;
    const unit = item.units.find((u) => u.id === item.selectedUnitId);
    return unit ? unit.qtyPerUnit : 1;
  };

  const subtotal = cart.reduce((sum, c) => sum + getEffectivePrice(c) * c.quantity, 0);
  const discountValue = discountType === "percent" ? subtotal * (discount / 100) : discount;
  const total = Math.max(0, subtotal - discountValue + addonAmount);

  // Park bill
  const parkBill = () => {
    if (cart.length === 0) return;
    const bill: ParkedBill = { id: Date.now().toString(), label: `บิล ${parkedBills.length + 1}`, cart, companyId: selectedCompany, warehouseId: selectedWarehouse, createdAt: new Date().toISOString() };
    const updated = [...parkedBills, bill];
    setParkedBills(updated);
    localStorage.setItem(PARKED_KEY, JSON.stringify(updated));
    clearCart();
  };

  const restoreBill = (bill: ParkedBill) => {
    setCart(bill.cart);
    if (bill.companyId) setSelectedCompany(bill.companyId);
    if (bill.warehouseId) setSelectedWarehouse(bill.warehouseId);
    const updated = parkedBills.filter((b) => b.id !== bill.id);
    setParkedBills(updated);
    localStorage.setItem(PARKED_KEY, JSON.stringify(updated));
    setShowParked(false);
  };

  const deleteParked = (id: string) => {
    const updated = parkedBills.filter((b) => b.id !== id);
    setParkedBills(updated);
    localStorage.setItem(PARKED_KEY, JSON.stringify(updated));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const openConfirmModal = () => {
    if (cart.length === 0) { setError("เพิ่มสินค้าก่อน"); return; }
    setShowConfirm(true);
    setError("");
    setCustomerFound(false);
  };

  // Auto-fill customer by phone (with debounce and auto-suggest)
  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    setCustomerFound(false);
    
    if (phoneSearchTimeout) clearTimeout(phoneSearchTimeout);
    
    if (phone.length >= 4 && selectedCompany) {
      setSearching(true);
      setPhoneSearchTimeout(
        setTimeout(async () => {
          try {
            const customers = await searchCustomersByPhone(phone, selectedCompany);
            setSuggestedCustomers(customers);
            setShowSuggestions(customers.length > 0);
          } catch { /* ignore */ }
          finally { setSearching(false); }
        }, 500)
      );
    } else {
      setSearching(false);
      setShowSuggestions(false);
      setSuggestedCustomers([]);
    }
  };

  const selectCustomer = (customer: any) => {
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
    setCustomerAddress(customer.address || "");
    setCustomerFound(true);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError("กรุณากรอกชื่อลูกค้า"); return; }
    const wh = warehouses.find((w: any) => w.id === selectedWarehouse);
    if (!wh) return;

    setLoading(true); setError("");
    try {
      await createOrder({
        customerName, customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        companyId: selectedCompany, branchId: wh.branchId, warehouseId: selectedWarehouse,
        items: cart.map((c) => ({
          productVariantId: c.variantId,
          quantity: c.quantity * getEffectiveQtyPerUnit(c),
          unitPrice: getEffectivePrice(c) / getEffectiveQtyPerUnit(c),
          warehouseId: c.warehouseId,
        })),
        note: note || undefined,
        discount: discount > 0 ? discount : undefined,
        discountType: discount > 0 ? discountType : undefined,
        addonAmount: addonAmount > 0 ? addonAmount : undefined,
        addonLabel: addonLabel || undefined,
        paymentMethod,
        bankAccountId: paymentMethod === "TRANSFER" ? bankAccountId : undefined,
        dueDate: paymentMethod === "CREDIT" && dueDate ? dueDate : undefined,
      });
      clearCart();
      setShowConfirm(false);
      setCustomerName(""); setCustomerPhone(""); setCustomerAddress("");
      setNote(""); setDiscount(0); setAddonAmount(0); setAddonLabel("");
      setPaymentMethod("CASH"); setBankAccountId(""); setDueDate("");
      router.push("/orders");
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-80px)] gap-4">
        {/* LEFT — Product Catalog */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-3 mb-4 items-center">
            <select value={selectedCompany} onChange={(e) => { setSelectedCompany(e.target.value); setSelectedWarehouse(""); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">เลือกบริษัท</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <SearchableSelect
              value={selectedWarehouse}
              onChange={(val) => setSelectedWarehouse(val)}
              placeholder="เลือกคลังสินค้า"
              disabled={!selectedCompany}
              options={warehouses.map((w: any) => ({ value: w.id, label: w.name, sub: w.branch.name }))}
            />
            <div className="ml-auto flex gap-2">
              {parkedBills.length > 0 && (
                <button onClick={() => setShowParked(!showParked)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors relative">
                  <Play className="w-4 h-4" /> พักบิล
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{parkedBills.length}</span>
                </button>
              )}
            </div>
          </div>

          {showParked && parkedBills.length > 0 && (
            <div className="mb-4 bg-amber-50 rounded-xl border border-amber-200 p-3 space-y-2">
              <p className="text-xs font-bold text-amber-700">📋 บิลที่พัก ({parkedBills.length})</p>
              {parkedBills.map((bill) => (
                <div key={bill.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-amber-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{bill.label}</p>
                    <p className="text-xs text-gray-400">{bill.cart.length} รายการ · {formatCurrency(bill.cart.reduce((s, c) => s + c.price * c.quantity, 0))}</p>
                  </div>
                  <button onClick={() => restoreBill(bill)} className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200">เรียกคืน</button>
                  <button onClick={() => deleteParked(bill.id)} className="p-1 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="ค้นหาสินค้า / SKU / barcode..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {cat === "all" ? "ทั้งหมด" : cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedWarehouse ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">เลือกบริษัทและคลังสินค้าก่อน</div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">ไม่พบสินค้าในคลังนี้</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((c) => c.variantId === p.variantId && c.warehouseId === p.warehouseId);
                  return (
                    <button key={p.stockId} onClick={() => addToCart(p)}
                      className={`bg-white rounded-xl border p-3 text-left hover:shadow-md transition-all ${inCart ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-100 hover:border-blue-200"}`}>
                      <div className="text-2xl mb-2">{p.productImage || "📦"}</div>
                      <p className="text-sm font-medium text-gray-900 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.variantName} · {p.sku}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-blue-600">{formatCurrency(p.price)}</span>
                        <span className="text-xs text-gray-400">คงเหลือ {p.available}</span>
                      </div>
                      {p.units.length > 1 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.units.filter(u => u.id !== "piece").map(u => (
                            <span key={u.id} className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">{u.unitName}</span>
                          ))}
                        </div>
                      )}
                      {inCart && (
                        <div className="mt-2 bg-blue-50 text-blue-600 rounded-lg px-2 py-0.5 text-xs font-medium text-center">ในตะกร้า: {inCart.quantity}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart (wider) */}
        <div className="w-[460px] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" /> ตะกร้า ({cart.length})
            </h3>
            <div className="flex gap-1">
              {cart.length > 0 && (
                <>
                  <button onClick={parkBill} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100" title="พักบิล">
                    <Pause className="w-3 h-3" /> พัก
                  </button>
                  <button onClick={clearCart} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100" title="ล้าง">
                    <Trash2 className="w-3 h-3" /> ล้าง
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <Package className="w-12 h-12 mb-2" /><p className="text-sm">ยังไม่มีสินค้า</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const currentUnit = item.units.find(u => u.id === item.selectedUnitId);
                const unitPrice = currentUnit ? currentUnit.pricePerUnit : item.price;
                return (
                  <div key={`${item.variantId}-${item.warehouseId}-${idx}`} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    {/* Row 1: Product info + qty + price + delete */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400 truncate">{item.variantName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="text-sm font-bold text-gray-900 w-20 text-right">{formatCurrency(unitPrice * item.quantity)}</p>
                      <button onClick={() => removeFromCart(idx)} className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {/* Row 2: Warehouse + Unit selectors */}
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.warehouseId}
                          onChange={(e) => changeWarehouse(idx, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                        >
                          {warehouses.map((w: any) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-0">
                          <select
                            value={item.selectedUnitId}
                            onChange={(e) => changeUnit(idx, e.target.value)}
                            className="w-full px-2 py-1 border border-purple-200 rounded-lg text-xs bg-purple-50 focus:ring-1 focus:ring-purple-400 outline-none"
                          >
                            {(item.units || []).map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.unitName} ({u.qtyPerUnit} ชิ้น) {formatCurrency(u.pricePerUnit)}
                              </option>
                            ))}
                          </select>
                        </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Total + Confirm Button */}
          <div className="border-t border-gray-100 p-4">
            {error && !showConfirm && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">ยอดรวม ({cart.reduce((s, c) => s + c.quantity, 0)} รายการ)</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <button onClick={openConfirmModal} disabled={cart.length === 0}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm">
              ดำเนินการสั่งซื้อ
            </button>
          </div>
        </div>
      </div>

      {/* ============ CONFIRMATION MODAL ============ */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">📋 ยืนยันคำสั่งซื้อ</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">รายการสินค้า ({cart.length} รายการ)</p>
                <div className="space-y-1">
                  {cart.map((item, idx) => {
                    const unit = item.units.find(u => u.id === item.selectedUnitId);
                    const unitLabel = unit && unit.id !== "piece" ? ` (${unit.unitName})` : "";
                    return (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate flex-1">{item.productName} - {item.variantName}{unitLabel} ×{item.quantity}</span>
                        <span className="font-medium text-gray-900 ml-2">{formatCurrency(getEffectivePrice(item) * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">👤 ข้อมูลลูกค้า</p>
                <div className="space-y-3">
                  <div className="relative">
                    <input type="tel" placeholder="เบอร์โทรลูกค้า (พิมพ์ 4 ตัวเพื่อค้นหา)" value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onFocus={() => { if (suggestedCustomers.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 outline-none ${
                        customerFound ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-400" : "border-gray-200 focus:ring-blue-500"
                      }`} />
                    {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ค้นหา...</span>}
                    {customerFound && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-600">
                        <UserCheck className="w-3.5 h-3.5" /> พบข้อมูล
                      </span>
                    )}

                    {showSuggestions && suggestedCustomers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {suggestedCustomers.map((c, i) => (
                          <div key={i} onClick={() => selectCustomer(c)} className="px-3 py-2 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors">
                            <span className="text-sm font-medium text-gray-900">{c.phone}</span>
                            <span className="text-xs text-gray-500">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="text" placeholder="ชื่อลูกค้า *" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea placeholder={"ที่อยู่จัดส่ง\nเช่น 123/45 ถ.สุขุมวิท แขวงคลองเตย..."} value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)} rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">💳 ช่องทางชำระเงิน</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "CASH" as const, label: "เงินสด", icon: Banknote, color: "emerald" },
                    { value: "TRANSFER" as const, label: "โอนเงิน", icon: CreditCard, color: "blue" },
                    { value: "CREDIT" as const, label: "ค้างชำระ", icon: Clock, color: "amber" },
                  ]).map((pm) => (
                    <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        paymentMethod === pm.value
                          ? `border-${pm.color}-400 bg-${pm.color}-50 ring-1 ring-${pm.color}-200`
                          : "border-gray-100 hover:border-gray-300"
                      }`}>
                      <pm.icon className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === pm.value ? `text-${pm.color}-600` : "text-gray-400"}`} />
                      <p className={`text-xs font-medium ${paymentMethod === pm.value ? "text-gray-900" : "text-gray-500"}`}>{pm.label}</p>
                    </button>
                  ))}
                </div>
                {paymentMethod === "CREDIT" && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">วันครบกำหนดชำระ</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm bg-amber-50 focus:ring-2 focus:ring-amber-400 outline-none" />
                  </div>
                )}
                {paymentMethod === "TRANSFER" && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">โอนเข้าบัญชีไหน?</label>
                    <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm bg-blue-50 focus:ring-2 focus:ring-blue-400 outline-none">
                      <option value="">-- เลือกบัญชีธนาคาร --</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountName} ({b.accountNumber})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Discount + Addon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-emerald-700 flex items-center gap-1"><Tag className="w-3 h-3" /> ส่วนลดท้ายบิล</p>
                  <div className="flex gap-2">
                    <input type="number" min={0} placeholder="0" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                      className="px-2 py-1.5 border border-emerald-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
                      <option value="fixed">฿</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-purple-700 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Addon</p>
                  <input type="text" placeholder="ชื่อ เช่น ค่าจัดส่ง" value={addonLabel} onChange={(e) => setAddonLabel(e.target.value)}
                    className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
                  <input type="number" min={0} placeholder="จำนวนเงิน" value={addonAmount || ""} onChange={(e) => setAddonAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
                </div>
              </div>

              {/* Note */}
              <textarea placeholder="หมายเหตุ" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>ยอดรวมสินค้า</span><span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>ส่วนลด {discountType === "percent" ? `(${discount}%)` : ""}</span><span>-{formatCurrency(discountValue)}</span>
                  </div>
                )}
                {addonAmount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>{addonLabel || "Addon"}</span><span>+{formatCurrency(addonAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">ยอดสุทธิ</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-400">
                  {paymentMethod === "CASH" && <><Banknote className="w-3 h-3" /> เงินสด</>}
                  {paymentMethod === "TRANSFER" && <><CreditCard className="w-3 h-3" /> โอนเงิน</>}
                  {paymentMethod === "CREDIT" && <><Clock className="w-3 h-3" /> ค้างชำระ {dueDate && `(ครบ ${dueDate})`}</>}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                ย้อนกลับ
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm flex items-center justify-center gap-2">
                {loading ? "กำลังสร้าง..." : <><CheckCircle className="w-4 h-4" /> ยืนยันคำสั่งซื้อ ({formatCurrency(total)})</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
