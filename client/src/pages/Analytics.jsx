import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Sparkles, AlertCircle, PieChart as PieIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const [period, setPeriod] = useState('7d');
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const trendRes = await analyticsService.getSalesTrend(period);
        const prodRes = await analyticsService.getTopProducts(5);
        const segRes = await analyticsService.getCustomerSegments();
        const invRes = await analyticsService.getInventoryStatus();

        if (trendRes.success) setSalesTrend(trendRes.data);
        if (prodRes.success) setTopProducts(prodRes.data);
        if (segRes.success) setCustomerSegments(segRes.data);
        if (invRes.success) setInventoryStats(invRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        toast.error('Could not load detailed metrics telemetry');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 rounded-xl bg-zinc-900/40 border border-white/5"></div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-zinc-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Enterprise Analytics <Sparkles className="w-5 h-5 text-violet-400" />
          </h2>
          <p className="text-sm text-zinc-400">Deep-dive MERN aggregation summaries and forecast indices.</p>
        </div>
        
        {/* Period filter buttons */}
        <div className="flex rounded-lg bg-zinc-900 border border-white/5 p-1 text-xs">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                period === p 
                  ? 'bg-violet-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Sales Trend Area Chart */}
        <div className="p-6 rounded-xl glass-card flex flex-col justify-between h-96">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" /> Sales Revenue Trend
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Earnings and volume grouped chronologically</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8b5cf6" fillOpacity={1} fill="url(#revenueGlow)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Top Products Bar Chart */}
        <div className="p-6 rounded-xl glass-card flex flex-col justify-between h-96">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Top-Selling Licenses
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Best performing items by gross sales value</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                <XAxis dataKey="sku" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Customer Segments Pie Chart */}
        <div className="p-6 rounded-xl glass-card flex flex-col justify-between h-96">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" /> Customer Segment Revenue
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Breakdown of gross value contribution per customer tier</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerSegments}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="segment"
                >
                  {customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Inventory Alerts status overview */}
        <div className="p-6 rounded-xl glass-card flex flex-col justify-between h-96">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Stock Alerts Summary
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Alert thresholds and category counts from MongoDB</p>
          </div>
          <div className="flex-1 mt-6 flex flex-col justify-center space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                <span className="text-xs text-zinc-500 block">Out of Stock Count</span>
                <span className="text-3xl font-extrabold text-red-500 block mt-2">
                  {inventoryStats?.alerts?.outOfStockCount ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                <span className="text-xs text-zinc-500 block">Low Stock Warnings</span>
                <span className="text-3xl font-extrabold text-amber-500 block mt-2">
                  {inventoryStats?.alerts?.lowStockCount ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Inventory Distribution</span>
              <div className="divide-y divide-white/5">
                {inventoryStats?.distribution?.slice(0, 3).map((item) => (
                  <div key={item.category} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300">{item.category}</span>
                    <span className="text-zinc-500">{item.count} items / <strong className="text-zinc-300 font-bold">{item.totalStock}</strong> units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Analytics;
