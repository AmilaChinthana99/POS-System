import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BarChart3, TrendingUp, DollarSign, Package, Download, Calendar } from 'lucide-react';

export default function Reports() {
  const [activeReportTab, setActiveReportTab] = useState('SALES'); // SALES, PNL, STOCK
  const [salesReport, setSalesReport] = useState(null);
  const [pnlReport, setPnlReport] = useState(null);
  const [stockReport, setStockReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [activeReportTab, startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      if (activeReportTab === 'SALES') {
        const res = await api.get(`/reports/sales${queryParams}`);
        setSalesReport(res.data);
      } else if (activeReportTab === 'PNL') {
        const res = await api.get(`/reports/profit-loss${queryParams}`);
        setPnlReport(res.data);
      } else if (activeReportTab === 'STOCK') {
        const res = await api.get(`/reports/stock`);
        setStockReport(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch report data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Reports & Business Analytics</h2>
          <p className="text-xs text-slate-400">Exportable financial performance, profit & loss, and inventory valuation</p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 p-1 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveReportTab('SALES')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeReportTab === 'SALES' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Sales Summary Report
        </button>
        <button
          onClick={() => setActiveReportTab('PNL')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeReportTab === 'PNL' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveReportTab('STOCK')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeReportTab === 'STOCK' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Stock Valuation & Movement
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading Report Analytics...</div>
      ) : activeReportTab === 'SALES' && salesReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Total Invoices</p>
              <p className="text-xl font-bold text-white">{salesReport.sales.length}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Gross Sales Subtotal</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(salesReport.totals.subtotal)}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Discounts Given</p>
              <p className="text-xl font-bold text-amber-400">-{formatCurrency(salesReport.totals.discountAmount)}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Net Revenue</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(salesReport.totals.grandTotal)}</p>
            </div>
          </div>

          <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Total (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salesReport.sales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono font-bold text-emerald-400">{s.invoiceNumber}</td>
                    <td className="p-3 text-slate-400">{formatDate(s.createdAt)}</td>
                    <td className="p-3">{s.cashier?.name}</td>
                    <td className="p-3">{s.paymentMethod}</td>
                    <td className="p-3 text-right font-bold text-white">{formatCurrency(s.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReportTab === 'PNL' && pnlReport ? (
        <div className="space-y-6">
          <div className="glass-panel border border-slate-800 p-6 rounded-2xl max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Profit & Loss Summary (LKR)
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-bold text-slate-200">
                <span>Total Sales Revenue</span>
                <span className="text-emerald-400">{formatCurrency(pnlReport.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-4">
                <span>Less: Cost of Goods Sold (COGS)</span>
                <span className="text-rose-400">-{formatCurrency(pnlReport.totalCostOfGoodsSold)}</span>
              </div>

              <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                <span>Gross Profit</span>
                <span className="text-emerald-400">{formatCurrency(pnlReport.grossProfit)}</span>
              </div>

              <div className="flex justify-between text-slate-400 pl-4 pt-2">
                <span>Less: Operating Expenses (Rent, Utilities, etc.)</span>
                <span className="text-rose-400">-{formatCurrency(pnlReport.totalOperatingExpenses)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-white pt-3 border-t-2 border-slate-700">
                <span>NET OPERATING PROFIT</span>
                <span className="text-emerald-400 text-lg">{formatCurrency(pnlReport.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeReportTab === 'STOCK' && stockReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Total Unique SKUs</p>
              <p className="text-xl font-bold text-white">{stockReport.totalProductsCount}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Total Stock Cost Value</p>
              <p className="text-xl font-bold text-slate-200">{formatCurrency(stockReport.totalStockValueCost)}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-slate-400">Total Stock Retail Value</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(stockReport.totalStockValueRetail)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
