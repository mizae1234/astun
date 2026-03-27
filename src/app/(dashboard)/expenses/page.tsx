"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getExpenses, getExpenseCategories, createExpense, updateExpense, deleteExpense } from "@/actions/expense";
import { getBankAccounts } from "@/actions/finance";
import { 
  Receipt, Plus, Search, Filter, ArrowRight, Download, 
  Wallet, Building2, Banknote, Calendar, CheckCircle, X, Edit, Trash2
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function ExpensePage() {
  const [data, setData] = useState<{ data: any[], total: number, totalPages: number, page: number }>({
    data: [], total: 0, totalPages: 0, page: 1
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // New Expense form
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    paymentMethod: "CASH",
    bankAccountId: "",
    description: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getExpenses(page, 20, search);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getExpenseCategories().then(setCategories);
    getBankAccounts().then(setBankAccounts);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount || !newExpense.categoryId) return;
    
    setSaving(true);
    try {
      const payload = {
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date),
        categoryId: newExpense.categoryId,
        paymentMethod: newExpense.paymentMethod,
        bankAccountId: newExpense.paymentMethod === "TRANSFER" ? newExpense.bankAccountId || undefined : undefined,
        description: newExpense.description,
      };

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split("T")[0],
      categoryId: expense.categoryId || expense.category.id,
      paymentMethod: expense.paymentMethod || "CASH",
      bankAccountId: expense.bankAccountId || "",
      description: expense.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการค่าใช้จ่ายนี้?")) return;
    try {
      await deleteExpense(id);
      loadData();
    } catch (err: any) {
      alert("ลบไม่สำเร็จ: " + err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNewExpense({
      title: "", amount: "", date: new Date().toISOString().split("T")[0], 
      categoryId: categories[0]?.id || "", paymentMethod: "CASH", bankAccountId: "", description: ""
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            บัญชีรายจ่าย (Expenses)
          </h1>
          <p className="text-sm text-gray-500 mt-1">จัดการและบันทึกค่าใช้จ่ายต่างๆ ของบริษัท</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" /> พิมพ์รายงาน
          </button>
          <button 
            onClick={() => {
              resetForm();
              if (categories.length > 0) {
                setNewExpense(p => ({ ...p, categoryId: categories[0].id }));
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> สร้างรายการจ่าย
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาเลขที่เอกสาร หรือชื่อรายการ..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
            />
          </div>
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>
        ) : data.data.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <p className="font-semibold text-gray-900">ยังไม่มีรายการค่าใช้จ่าย</p>
            <p className="text-sm text-gray-500 mt-1">กดปุ่ม สร้างรายการจ่าย เพื่อบันทึกค่าใช้จ่ายใหม่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4">เลขที่/วันที่</th>
                  <th className="px-6 py-4">รายการ</th>
                  <th className="px-6 py-4">หมวดหมู่</th>
                  <th className="px-6 py-4">ชำระโดย</th>
                  <th className="px-6 py-4">สร้างโดย</th>
                  <th className="px-6 py-4 text-right">ยอดเงิน</th>
                  <th className="px-4 py-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                        {expense.expenseNumber}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {formatDate(expense.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{expense.title}</div>
                      {expense.description && (
                         <div className="text-xs text-gray-400 truncate max-w-[200px]">{expense.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {expense.paymentMethod === "CASH" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                          <Banknote className="w-4 h-4" /> เงินสด
                        </div>
                      ) : expense.paymentMethod === "TRANSFER" ? (
                        <div className="flex items-center gap-1.5 text-blue-600 font-medium text-xs">
                          <Building2 className="w-4 h-4" /> โอนเงิน
                          {expense.bankAccount && <span className="text-gray-400 font-normal">({expense.bankAccount.bankName})</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-600 font-medium text-xs">
                          <Wallet className="w-4 h-4" /> บัตรเครดิต/อื่นๆ
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {expense.createdBy.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900 text-base">{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(expense)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                {editingId ? "แก้ไขค่าใช้จ่าย" : "บันทึกค่าใช้จ่ายใหม่"}
              </h3>
              <button onClick={() => !saving && setIsModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {categories.length === 0 && (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm mb-4">
                  ⚠️ ยังไม่มีหมวดหมู่ค่าใช้จ่าย กรุณาเพิ่มหมวดหมู่ผ่านฐานข้อมูลก่อน หรือจะเลือกไม่ได้
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">รายการค่าใช้จ่าย *</label>
                  <input required
                    value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                    placeholder="เช่น ค่าไฟประจำเดือน"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">จำนวนเงิน (บาท) *</label>
                  <input required type="number" step="0.01" min="0"
                    value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">วันที่ทำรายการ *</label>
                  <input required type="date"
                    value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">หมวดหมู่ *</label>
                  <select required
                    value={newExpense.categoryId} onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  >
                    <option value="" disabled>เลือกหมวดหมู่...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">ช่องทางชำระ</label>
                  <select 
                    value={newExpense.paymentMethod} onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  >
                    <option value="CASH">เงินสด</option>
                    <option value="TRANSFER">โอนเงิน</option>
                    <option value="CREDIT">อื่นๆ / บัตรเครดิต</option>
                  </select>
                </div>

                {newExpense.paymentMethod === "TRANSFER" && (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">โอนออกจากบัญชีธนาคาร</label>
                    <select required
                      value={newExpense.bankAccountId} onChange={(e) => setNewExpense({ ...newExpense, bankAccountId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    >
                      <option value="" disabled>เลือกบัญชีธนาคาร...</option>
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountName} ({b.accountNumber})</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">หมายเหตุเพิ่มเติม</label>
                  <textarea rows={2}
                    value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving || !newExpense.title || !newExpense.amount || !newExpense.categoryId} 
                  className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {saving ? "กำลังบันทึก..." : "บันทึกค่าใช้จ่าย"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
