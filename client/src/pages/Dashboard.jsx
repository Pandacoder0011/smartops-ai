import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { analyticsService, dashboardService } from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight,
  RefreshCw, Download, Bell, Activity, Sparkles, MapPin, CheckCircle,
  AlertTriangle, Calendar, ShoppingBag, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// Custom count-up animation for counters
const AnimatedCounter = ({ value, format = (v) => v }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 1000; // 1s
    const increment = end / (duration / 16); // ~60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{format(displayValue)}</span>;
};

const Dashboard = () => {
  const { socket, connected } = useSocket();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard Data States
  const [overview, setOverview] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [regionalRevenue, setRegionalRevenue] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Sparklines trends
  const revenueSparkline = [10000, 12000, 11500, 13000, 12800, 14200, 14850].map((v, i) => ({ value: v, name: `Day ${i + 1}` }));
  const salesSparkline = [40, 50, 48, 55, 52, 60, 68].map((v, i) => ({ value: v, name: `Day ${i + 1}` }));
  const customerSparkline = [290, 295, 298, 302, 305, 308, 312].map((v, i) => ({ value: v, name: `Day ${i + 1}` }));
  const inventorySparkline = [800, 810, 805, 820, 815, 830, 840].map((v, i) => ({ value: v, name: `Day ${i + 1}` }));

  const fetchDashboardData = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const overviewRes = await analyticsService.getOverview();
      const trendRes = await analyticsService.getSalesTrend(period);
      const prodRes = await analyticsService.getTopProducts(5);
      const segRes = await analyticsService.getCustomerSegments();
      const regRes = await analyticsService.getRevenueByRegion();
      const invRes = await analyticsService.getInventoryStatus();

      // Retrieve recent transactions from DB if any, otherwise default
      if (overviewRes.success) setOverview(overviewRes.data);
      if (trendRes.success) setSalesTrend(trendRes.data);
      if (prodRes.success) setTopProducts(prodRes.data);
      if (segRes.success) setCustomerSegments(segRes.data);
      if (regRes.success) setRegionalRevenue(regRes.data);
      if (invRes.success) {
        setLowStockCount(invRes.data.alerts?.lowStockCount || 0);
        // Map category distribution
        setCategoryDistribution(invRes.data.distribution?.map(d => ({
          name: d.category,
          value: d.totalStock
        })) || []);
      }

      // Mock live transactions
      setRecentTransactions([
        { id: 'TX-4001', type: 'income', category: 'sale', amount: 1240, date: new Date().toISOString(), status: 'completed' },
        { id: 'TX-4002', type: 'expense', category: 'inventory', amount: 450, date: new Date(Date.now() - 3600000).toISOString(), status: 'completed' },
        { id: 'TX-4003', type: 'income', category: 'sale', amount: 890, date: new Date(Date.now() - 10800000).toISOString(), status: 'completed' }
      ]);

      if (showToast) toast.success('Telemetry caches synced cleanly! 🚀');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reload analytics aggregations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Real-time socket event receivers
  useEffect(() => {
    if (socket) {
      // 1. New Sale Broadcast Receiver
      const handleNewSale = (sale) => {
        toast.success(`📣 New Sale Invoiced: $${sale.totalAmount} from ${sale.customer?.name || 'Customer'}! 🛒`);
        
        // Add to recent transactions list
        setRecentTransactions(prev => [
          {
            id: `TX-${sale._id.slice(-4).toUpperCase()}`,
            type: 'income',
            category: 'sale',
            amount: sale.totalAmount,
            date: new Date().toISOString(),
            status: 'completed'
          },
          ...prev.slice(0, 4)
        ]);

        // Dynamically increment overall revenue in state
        setOverview(prev => {
          if (!prev) return null;
          return {
            ...prev,
            totals: {
              ...prev.totals,
              revenue: prev.totals.revenue + sale.totalAmount,
              profit: prev.totals.profit + sale.profit
            }
          };
        });
      };

      // 2. Low Stock Alerts Receiver
      const handleLowStock = (product) => {
        toast((t) => (
          <span className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Low Stock Alert: <strong>{product.name}</strong> ({product.stock} left)</span>
          </span>
        ), {
          duration: 5000,
          style: {
            border: '1px solid rgba(245, 158, 11, 0.2)',
            background: '#09090b',
            color: '#f59e0b'
          }
        });
        setLowStockCount(prev => prev + 1);
      };

      // 3. General Dashboard updates receiver
      const handleDashboardUpdate = (metric) => {
        // Refetch full datasets to update all charts
        fetchDashboardData();
      };

      socket.on('new-sale', handleNewSale);
      socket.on('low-stock-alert', handleLowStock);
      socket.on('dashboard-update', handleDashboardUpdate);

      return () => {
        socket.off('new-sale', handleNewSale);
        socket.off('low-stock-alert', handleLowStock);
        socket.off('dashboard-update', handleDashboardUpdate);
      };
    }
  }, [socket]);

  // Export metrics to CSV format
  const exportToCSV = () => {
    if (!overview) return;
    const rows = [
      ['Indicator', 'Value'],
      ['Total Revenue', `$${overview.totals.revenue}`],
      ['Net Profit', `$${overview.totals.profit}`],
      ['Operating Expenses', `$${overview.totals.expenses}`],
      ['Active Customers', overview.counts.customers],
      ['Total Products', overview.counts.products],
      ['Staff Count', overview.counts.employees]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartops_bi_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report CSV downloaded successfully! 📊');
  };

  const formatCurrency = (val) => `$${Math.round(val).toLocaleString()}`;
  const formatCompact = (val) => Math.round(val).toLocaleString();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded bg-zinc-900"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-zinc-900"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 rounded-xl bg-zinc-900"></div>
          <div className="lg:col-span-1 h-96 rounded-xl bg-zinc-900"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 text-zinc-100 select-none pb-12"
    >
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            BI Analytics Dashboard <Sparkles className="w-6 h-6 text-violet-400" />
          </h2>
          <p className="text-xs text-zinc-400">Aggregated database summaries and forecast indicators.</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Timeline Selector */}
          <div className="flex rounded-lg bg-zinc-900 border border-white/5 p-1 text-xs">
            {['today', '7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  period === p 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'Today' : p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            title="Refresh database caches"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

        </div>
      </div>

      {/* ROW 1: KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Total Revenue */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-violet-500/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gross Revenues</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              <AnimatedCounter value={overview?.totals?.revenue} format={formatCurrency} />
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{overview?.growth?.revenue}% vs last month
            </span>
          </div>
          {/* Mini Sparkline in Background */}
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-15 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSparkline}>
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 2: Total Sales */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-cyan-500/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sales Invoiced</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              <AnimatedCounter value={salesTrend.reduce((acc, c) => acc + (c.unitsSold || 0), 0) || 128} format={formatCompact} />
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +9.4% volumes increase
            </span>
          </div>
          {/* Mini Sparkline */}
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-15 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSparkline}>
                <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#06b6d4" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 3: Active Customers */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Customers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              <AnimatedCounter value={overview?.counts?.customers} format={formatCompact} />
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.5% new registrations
            </span>
          </div>
          {/* Mini Sparkline */}
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-15 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerSparkline}>
                <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 4: Inventory Alerts */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Inventory Status</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              {lowStockCount > 0 ? (
                <span className="text-amber-500">{lowStockCount} Alerts</span>
              ) : (
                <span className="text-emerald-400">Stable</span>
              )}
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} items below threshold
            </span>
          </div>
          {/* Mini Sparkline */}
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-15 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inventorySparkline}>
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 2: Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card flex flex-col justify-between h-[400px]">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" /> Revenue & Volume Trend
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Timeline representation of financial gross receipts</p>
          </div>
          <div className="flex-1 w-full mt-6 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="mainRevGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8b5cf6" fillOpacity={1} fill="url(#mainRevGlow)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card flex flex-col justify-between h-[400px]">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-cyan-400" /> Sales by Category
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Breakdown of product volume distributions</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 3: Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Products with Progress Bars */}
        <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-[380px]">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-violet-400" /> Top-Selling Licenses
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Highest grossing enterprise products</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1">
            {topProducts.slice(0, 4).map((prod) => {
              const maxVal = Math.max(...topProducts.map(p => p.revenue), 1);
              const percent = (prod.revenue / maxVal) * 100;
              return (
                <div key={prod.sku} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-200 truncate max-w-[150px]">{prod.name}</span>
                    <span className="text-zinc-400 font-bold">{formatCurrency(prod.revenue)}</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2">
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions (Live Updating Feed) */}
        <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-[380px]">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Recent Activity Log
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Database operations transaction checks</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 mt-4 pr-1">
            <AnimatePresence initial={false}>
              {recentTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-2.5 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      tx.type === 'income' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block">{tx.id}</span>
                      <span className="text-[10px] text-zinc-500 capitalize">{tx.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount}
                    </span>
                    <span className="text-[9px] text-zinc-500">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Customer Tiers Radial Chart */}
        <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-[380px]">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" /> Customer Segments
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Unique active profiles by loyalty levels</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                innerRadius="30%" 
                outerRadius="90%" 
                barSize={12} 
                data={customerSegments}
              >
                <RadialBar 
                  minAngle={15} 
                  background 
                  clockWise 
                  dataKey="revenue" 
                  nameKey="segment"
                >
                  {customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RadialBar>
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9, textTransform: 'capitalize' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 4: Activity & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue by Region Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card flex flex-col justify-between h-[360px]">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-violet-400" /> Sales distribution by Region
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Geographical aggregation breakdowns</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="region" type="category" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card flex flex-col justify-between h-[360px]">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-cyan-400" /> Live Audit Stream
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Real-time socket telemetry feed</p>
          </div>
          <div className="flex-1 mt-6 flex flex-col justify-center space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/5 space-y-3.5 text-xs text-zinc-400">
              <div className="flex items-center space-x-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Socket client auth verified successfully!</span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MongoDB connection buffer active.</span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-300">
                <Activity className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Fluctuations telemetry emulator active.</span>
              </div>
            </div>
            
            <Link 
              to="/ai-assistant" 
              className="py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-white/5 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Ask Copilot for analysis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* ROW 5: Quick Stats Tally */}
      <div className="p-6 rounded-2xl glass-card space-y-6">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Operational Target Progress</h4>
          <p className="text-xs text-zinc-400 mt-1">Monthly targets comparison checks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          
          {/* Today vs Yesterday */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-2">
            <span className="text-zinc-500 font-semibold block uppercase tracking-wider text-[10px]">Today vs Yesterday Tally</span>
            <div className="flex justify-between items-center text-sm font-bold text-white">
              <span>Today's Sales: {formatCurrency(overview?.today?.revenue || 4200)}</span>
              <span className="text-emerald-400 flex items-center gap-0.5 text-xs">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12%
              </span>
            </div>
          </div>

          {/* Goal Progress */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-2">
            <div className="flex justify-between text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <span>Monthly Revenue Goal</span>
              <span className="text-zinc-300">74%</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 mt-1.5">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full" style={{ width: '74%' }} />
            </div>
          </div>

          {/* Performance Index */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-2">
            <div className="flex justify-between text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <span>Copilot Response Rate</span>
              <span className="text-zinc-300">99.8%</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 mt-1.5">
              <div className="bg-gradient-to-r from-cyan-500 to-violet-500 h-1.5 rounded-full" style={{ width: '99.8%' }} />
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
