import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch dashboard summary:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  const { summary, lowStockProducts, topSellingProducts, recentTransactions, salesChartData } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Welcome Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Eco Store Dashboard</h2>
        <p className="text-xs text-slate-400">Real-time sales performance & inventory health (LKR)</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Today's Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white">
              {formatCurrency(summary.totalRevenueToday)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Monthly Total: <span className="text-emerald-400 font-semibold">{formatCurrency(summary.totalRevenueMonth)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Transactions Today */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Transactions Today</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white">
              {summary.totalTransactionsToday}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Completed checkouts
            </p>
          </div>
        </div>

        {/* Card 3: Avg Basket Value */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg Sale Value</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white">
              {formatCurrency(summary.averageSaleValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Per transaction average</p>
          </div>
        </div>

        {/* Card 4: Low Stock Alert Count */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Low Stock Alerts</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-amber-400">
              {summary.lowStockCount} Products
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Below minimum threshold</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (Last 7 Days) */}
        <div className="lg:col-span-2 glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-base text-white">Weekly Sales Trend</h4>
              <p className="text-xs text-slate-400">Daily revenue performance (LKR)</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(val) => [`Rs. ${val.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products Widget */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
          <h4 className="font-bold text-base text-white flex items-center justify-between">
            <span>Top Selling Eco Goods</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </h4>

          <div className="space-y-3">
            {topSellingProducts.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-100 line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.totalQty} units sold</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {formatCurrency(p.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Widget */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low Stock Alerts</span>
            </h4>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Needs Restock
            </span>
          </div>

          <div className="space-y-2">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                All inventory stock levels are healthy!
              </p>
            ) : (
              lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">
                      SKU: {prod.sku} • Category: {prod.category?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                      {prod.stockQuantity} {prod.unit} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Transactions</span>
            </h4>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs"
              >
                <div>
                  <p className="font-bold text-white flex items-center space-x-1.5">
                    <span>{tx.invoiceNumber}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-normal">
                      {tx.paymentMethod}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatDate(tx.createdAt)} • Cashier: {tx.cashier?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{formatCurrency(tx.grandTotal)}</p>
                  <span className="text-[10px] text-emerald-400/80 uppercase font-semibold">
                    {tx.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
