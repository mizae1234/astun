"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Calendar, CreditCard, Banknote, Clock, Landmark, PieChart, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getFinanceReportData } from "@/actions/finance";

export default function FinanceReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Default to today
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getFinanceReportData(startDate, endDate);
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานการเงิน</h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบยอดรับชำระเงินตามช่องทาง และยอดเงินเข้าแต่ละบัญชีธนาคาร</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400 ml-2" />
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm outline-none px-2 text-gray-700 bg-transparent"
          />
          <span className="text-gray-300">-</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm outline-none px-2 text-gray-700 bg-transparent"
          />
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
          {/* Main KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
              <div>
                <p className="text-blue-100 font-medium mb-1">ยอดรับชำระสุทธิรวม</p>
                <h2 className="text-3xl font-bold">{formatCurrency(data.totalRevenue)}</h2>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-full w-fit">
                <TrendingUp className="w-4 h-4" /> รายได้
              </div>
            </div>
            <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
              <div>
                <p className="text-rose-100 font-medium mb-1">ค่าใช้จ่ายรวม</p>
                <h2 className="text-3xl font-bold">{formatCurrency(data.totalExpense)}</h2>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-full w-fit">
                <TrendingDown className="w-4 h-4" /> รายจ่าย
              </div>
            </div>
            <div className={`rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between ${data.netProfit >= 0 ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-orange-500 to-amber-600"}`}>
              <div>
                <p className="font-medium text-white/80 mb-1">กำไรสุทธิ</p>
                <h2 className="text-3xl font-bold">{formatCurrency(data.netProfit)}</h2>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-full w-fit">
                <DollarSign className="w-4 h-4" /> กำไรขั้นต้น
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Breakdowns by Method */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <Banknote className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 font-medium">ยอดรับเงินสด</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.cashTotal)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 font-medium">ยอดโอนเงิน</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.transferTotal)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 font-medium">ยอดตกลงค้างชำระ (เครดิต)</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.creditTotal)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Accounts Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                สรุปยอดเงินเข้าบัญชีธนาคาร (จากโอนเงิน)
              </h2>
              
              {data.bankAccountList.length > 0 ? (
                <div className="space-y-4">
                  {data.bankAccountList.map((b: any) => {
                    const percent = data.transferTotal > 0 ? (b.amount / data.transferTotal) * 100 : 0;
                    return (
                      <div key={b.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-2">
                              {b.bank}
                              {b.id === "unknown" && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-medium">โปรดระบุในคำสั่งซื้อ</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{b.name} <span className="text-gray-300 mx-1">|</span> {b.number}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600 text-lg">{formatCurrency(b.amount)}</p>
                            <p className="text-xs text-gray-400">{percent.toFixed(1)}% ของยอดโอน</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${b.id === 'unknown' ? 'bg-red-400' : 'bg-blue-600 group-hover:bg-blue-500'}`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 font-medium">ยังไม่มียอดการโอนเงินในช่วงเวลานี้</p>
                </div>
              )}
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                สรุปค่าใช้จ่ายแยกตามหมวดหมู่
              </h2>
              
              {data.expenseCategoryList && data.expenseCategoryList.length > 0 ? (
                <div className="space-y-4">
                  {data.expenseCategoryList.map((cat: any) => {
                    const percent = data.totalExpense > 0 ? (cat.amount / data.totalExpense) * 100 : 0;
                    return (
                      <div key={cat.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{cat.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-rose-600 text-lg">{formatCurrency(cat.amount)}</p>
                            <p className="text-xs text-gray-400">{percent.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-1.5 rounded-full bg-rose-500 group-hover:bg-rose-400" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 font-medium">ยังไม่มีค่าใช้จ่ายในช่วงเวลานี้</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
