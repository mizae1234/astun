"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Calendar, DollarSign, ShoppingCart, Package, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getSalesReportData } from "@/actions/reports";

export default function SalesReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getSalesReportData(startDate, endDate);
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
          <h1 className="text-2xl font-bold text-gray-900">รายงานยอดขาย</h1>
          <p className="text-sm text-gray-500 mt-1">สรุปยอดขายแยกตามวันและสินค้าขายดี (เฉพาะรายการที่จัดส่งแล้ว)</p>
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
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">ยอดขายรวม</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">จำนวนคำสั่งซื้อ</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString()} บิล</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">ยอดขายเฉลี่ยต่อบิล</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.avgOrderValue)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                แนวโน้มยอดขาย
              </h2>
              
              <div className="h-64 flex items-end gap-1 relative pt-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-[10px] text-gray-400 pb-6 hidden md:flex">
                  <span>{formatCurrency(data.maxDailyRevenue).replace(/\\.\\d+$/, '')}</span>
                  <span>{formatCurrency(data.maxDailyRevenue / 2).replace(/\\.\\d+$/, '')}</span>
                  <span>0</span>
                </div>
                
                {/* Bars */}
                <div className="flex-1 flex items-end justify-between h-full pb-6 pl-0 md:pl-16 relative">
                  {/* Grid lines */}
                  <div className="absolute top-0 left-0 md:left-16 right-0 border-t border-dashed border-gray-100"></div>
                  <div className="absolute top-1/2 left-0 md:left-16 right-0 border-t border-dashed border-gray-100"></div>
                  <div className="absolute bottom-6 left-0 md:left-16 right-0 border-t border-gray-200"></div>
                  
                  {data.chartData.map((d: any, idx: number) => {
                    const heightPercent = data.maxDailyRevenue > 0 ? (d.revenue / data.maxDailyRevenue) * 100 : 0;
                    // Only show dates if not too many, or evenly spaced
                    const totalDays = data.chartData.length;
                    const showLabel = totalDays <= 14 || idx % Math.ceil(totalDays / 7) === 0;
                    
                    return (
                      <div key={d.date} className="relative flex-1 flex flex-col items-center justify-end h-full group">
                        <div 
                          className="w-full max-w-[20px] bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors z-10"
                          style={{ height: `${Math.max(1, heightPercent)}%` }}
                        ></div>
                        {showLabel && (
                          <span className="absolute -bottom-5 text-[9px] text-gray-400 rotate-45 transform origin-top-left">
                            {d.date.slice(5, 10).replace('-', '/')}
                          </span>
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
                          {d.date}: {formatCurrency(d.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                10 อันดับสินค้าขายดี
              </h2>
              
              {data.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {data.topProducts.map((p: any, idx: number) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-500 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.variant}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
                        <p className="text-[11px] text-gray-500">{p.qty.toLocaleString()} ชิ้น</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">ไม่มีข้อมูลสินค้าขายดี</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
