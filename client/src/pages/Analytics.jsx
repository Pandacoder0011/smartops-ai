import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  Layers,
  MapPin,
  Users,
  Download,
  Maximize2,
  Minimize2,
  FolderHeart,
  RefreshCw,
  Zap,
  Info,
  DollarSign,
  Briefcase,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Treemap
} from 'recharts';
import { analyticsService, aiService } from '../services/api';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

const Analytics = () => {
  // --- Global States ---
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'customers' | 'products' | 'financials' | 'predictive'
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [dateRange, setDateRange] = useState('30d'); // 'today' | '7d' | '30d' | '90d' | 'custom'

  // Presets State
  const [presets, setPresets] = useState([
    { name: 'Default Enterprise', dateRange: '30d', region: '', category: '', employee: '' }
  ]);
  const [selectedPresetName, setSelectedPresetName] = useState('Default Enterprise');

  // Filter Bar values
  const [regionFilter, setRegionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Cross-filtering triggers (interactive click chart filters)
  const [chartRegionFilter, setChartRegionFilter] = useState(null);
  const [chartCategoryFilter, setChartCategoryFilter] = useState(null);
  const [chartSegmentFilter, setChartSegmentFilter] = useState(null);

  // Full-screen Maximized Chart Modal State
  const [maximizedChart, setMaximizedChart] = useState(null); // { title, element }

  // Telemetry API Data States
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [regionalRevenue, setRegionalRevenue] = useState([]);
  const [employeePerf, setEmployeePerf] = useState([]);
  const [financialSummary, setFinancialSummary] = useState([]);
  const [aiInsights, setAiInsights] = useState({ anomalies: [], insights: [], suggestions: [] });
  const [predictions, setPredictions] = useState([]);

  // Fetch telemetry
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        ovRes,
        trendRes,
        prodRes,
        segRes,
        invRes,
        regRes,
        empRes,
        finRes,
        insightsRes,
        predRes
      ] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getSalesTrend(dateRange),
        analyticsService.getTopProducts(10),
        analyticsService.getCustomerSegments(),
        analyticsService.getInventoryStatus(),
        analyticsService.getRevenueByRegion(),
        analyticsService.getEmployeePerformance(),
        analyticsService.getFinancialSummary(),
        aiService.getInsights(),
        aiService.getPredictions()
      ]);

      if (ovRes.success) setAnalyticsOverview(ovRes.data);
      if (trendRes.success) setSalesTrend(trendRes.data);
      if (prodRes.success) setTopProducts(prodRes.data);
      if (segRes.success) setCustomerSegments(segRes.data);
      if (invRes.success) setInventoryStats(invRes.data);
      if (regRes.success) setRegionalRevenue(regRes.data);
      if (empRes.success) setEmployeePerf(empRes.data);
      if (finRes.success) setFinancialSummary(finRes.data);
      if (insightsRes.success) setAiInsights(insightsRes.data);
      if (predRes.success) setPredictions(predRes.data);
    } catch (e) {
      console.error(e);
      toast.error('Could not load MERN analytics database logs 🚨');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Load presets from localStorage
  useEffect(() => {
    const cachedPresets = localStorage.getItem('smartops_analytics_presets');
    if (cachedPresets) {
      try {
        setPresets(JSON.parse(cachedPresets));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // --- Preset Actions ---
  const savePreset = () => {
    const name = prompt('Enter a name for this filter preset:');
    if (!name || !name.trim()) return;

    const newPreset = {
      name: name.trim(),
      dateRange,
      region: regionFilter,
      category: categoryFilter,
      employee: employeeFilter
    };

    const updated = [...presets.filter(p => p.name !== name), newPreset];
    setPresets(updated);
    localStorage.setItem('smartops_analytics_presets', JSON.stringify(updated));
    setSelectedPresetName(name);
    toast.success(`Preset "${name}" saved 💾`);
  };

  const loadPreset = (presetName) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setSelectedPresetName(presetName);
      setDateRange(preset.dateRange);
      setRegionFilter(preset.region);
      setCategoryFilter(preset.category);
      setEmployeeFilter(preset.employee);
      
      // Clear cross-filters to prevent confusion
      clearChartCrossFilters();
      toast.success(`Loaded preset: ${presetName}`);
    }
  };

  // --- Dynamic Filtering & Cross-filtering math ---
  const clearChartCrossFilters = () => {
    setChartRegionFilter(null);
    setChartCategoryFilter(null);
    setChartSegmentFilter(null);
    toast('Cross-filters cleared', { icon: '🔄' });
  };

  // Applies filter adjustments to datasets dynamically before rendering
  const getFilteredSalesTrend = () => {
    const region = chartRegionFilter || regionFilter;
    const category = chartCategoryFilter || categoryFilter;
    
    // Scaling helper to simulate live subset selection dynamically
    let multiplier = 1.0;
    if (region) multiplier *= 0.35;
    if (category) multiplier *= 0.45;
    if (employeeFilter) multiplier *= 0.25;

    return salesTrend.map(item => ({
      ...item,
      revenue: parseFloat((item.revenue * multiplier).toFixed(2)),
      unitsSold: Math.ceil(item.unitsSold * multiplier)
    }));
  };

  const getFilteredTopProducts = () => {
    const category = chartCategoryFilter || categoryFilter;
    const region = chartRegionFilter || regionFilter;
    
    let list = [...topProducts];
    if (category) {
      list = list.filter(p => p.category === category);
    }
    
    let multiplier = 1.0;
    if (region) multiplier *= 0.4;
    if (employeeFilter) multiplier *= 0.3;

    return list.map(item => ({
      ...item,
      revenue: parseFloat((item.revenue * multiplier).toFixed(2))
    }));
  };

  const getFilteredRegionalRevenue = () => {
    const category = chartCategoryFilter || categoryFilter;
    
    let multiplier = 1.0;
    if (category) multiplier *= 0.4;
    if (employeeFilter) multiplier *= 0.3;

    return regionalRevenue.map(item => ({
      ...item,
      revenue: parseFloat((item.revenue * multiplier).toFixed(2))
    }));
  };

  const getFilteredCustomerSegments = () => {
    const region = chartRegionFilter || regionFilter;
    const category = chartCategoryFilter || categoryFilter;

    let multiplier = 1.0;
    if (region) multiplier *= 0.3;
    if (category) multiplier *= 0.5;

    return customerSegments.map(item => ({
      ...item,
      revenue: parseFloat((item.revenue * multiplier).toFixed(2))
    }));
  };

  // --- Downloader: Renders SVG node to data URI download ---
  const downloadChartAsSVG = (chartId, title) => {
    const container = document.getElementById(chartId);
    if (!container) {
      toast.error('Could not export chart structure');
      return;
    }

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      toast.error('SVG canvas not ready');
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${title.toLowerCase().replace(/\s+/g, '_')}_export.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('Chart exported as vector SVG graphic! 🎨');
  };

  // --- Semi-Donut Goal Gauge Chart Component ---
  const renderGauge = (value, max = 100, title = 'KPI Goal Target', chartId) => {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const data = [
      { name: 'Completed', value: percent },
      { name: 'Remaining', value: 100 - percent }
    ];
    
    const gaugeColors = percent > 75 ? ['#10b981', '#27272a'] : percent > 45 ? ['#f59e0b', '#27272a'] : ['#ef4444', '#27272a'];

    const element = (
      <div id={chartId} className="w-full h-44 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={gaugeColors[0]} />
              <Cell fill={gaugeColors[1]} />
            </Pie>
            <Tooltip disabled />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-[20%] text-center">
          <span className="text-2xl font-extrabold text-white">{percent.toFixed(1)}%</span>
          <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mt-0.5">Performance Index</span>
        </div>
      </div>
    );

    if (maximizedChart?.id === chartId) return element;
    
    return (
      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-zinc-400">{title}</span>
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
            <button onClick={() => setMaximizedChart({ id: chartId, title, element })} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Maximize2 className="w-3 h-3" />
            </button>
            <button onClick={() => downloadChartAsSVG(chartId, title)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
        {element}
      </div>
    );
  };

  // --- Visual stages conversion funnel ---
  const renderFunnel = (title = 'Sales Funnel stages', chartId) => {
    // Stage counts
    const funnelStages = [
      { name: '1. Leads Generated', value: 1000, rate: '100%' },
      { name: '2. Audits Complete', value: 780, rate: '78%' },
      { name: '3. Proposals Issued', value: 450, rate: '45%' },
      { name: '4. Sales Concluded', value: 240, rate: '24%' }
    ];

    const element = (
      <div id={chartId} className="w-full h-44 flex flex-col justify-center space-y-2.5">
        {funnelStages.map((stage, i) => {
          const barWidths = ['w-full', 'w-[78%]', 'w-[45%]', 'w-[24%]'];
          const barColors = ['bg-violet-650', 'bg-indigo-650', 'bg-cyan-650', 'bg-emerald-650'];
          
          return (
            <div key={i} className="text-xs space-y-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 px-1">
                <span>{stage.name}</span>
                <span className="font-bold text-white">{stage.value} ({stage.rate})</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 border border-zinc-850/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barWidths[i]} ${barColors[i]} transition-all duration-500`} />
              </div>
            </div>
          );
        })}
      </div>
    );

    if (maximizedChart?.id === chartId) return element;

    return (
      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-zinc-400">{title}</span>
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
            <button onClick={() => setMaximizedChart({ id: chartId, title, element })} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {element}
      </div>
    );
  };

  // --- Dynamic Grid Block Hourly Activity Heatmap ---
  const renderHeatmap = (title = 'Hourly Activity Distribution', chartId) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['9am', '11am', '1pm', '3pm', '5pm', '7pm'];

    // Mock intensity matrix (7 days x 6 hour bands)
    const intensity = [
      [2, 5, 8, 9, 4, 1], // Mon
      [3, 6, 7, 8, 5, 2], // Tue
      [4, 7, 9, 8, 6, 3], // Wed
      [2, 4, 8, 9, 5, 1], // Thu
      [5, 8, 9, 9, 7, 4], // Fri
      [1, 2, 4, 5, 3, 1], // Sat
      [0, 1, 2, 3, 2, 0]  // Sun
    ];

    const element = (
      <div id={chartId} className="w-full h-44 flex flex-col justify-between pt-1">
        <div className="flex justify-end gap-1.5 pr-2 mb-1.5 text-[8px] text-zinc-500 font-bold uppercase">
          <span>Low</span>
          <div className="w-2.5 h-2.5 rounded bg-violet-650 opacity-15" />
          <div className="w-2.5 h-2.5 rounded bg-violet-650 opacity-50" />
          <div className="w-2.5 h-2.5 rounded bg-violet-650 opacity-90" />
          <span>High</span>
        </div>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {days.map((day, colIdx) => (
            <div key={day} className="flex flex-col justify-between gap-1 text-center">
              <span className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">{day}</span>
              {hours.map((hour, rowIdx) => {
                const val = intensity[colIdx][rowIdx];
                const opacityClass = val >= 8 ? 'opacity-90' : val >= 5 ? 'opacity-55' : val >= 2 ? 'opacity-25' : 'opacity-5';
                
                return (
                  <div
                    key={hour}
                    className={`flex-1 rounded bg-violet-500 ${opacityClass} border border-violet-500/5 hover:border-violet-400 hover:scale-105 transition-all cursor-pointer`}
                    title={`${day} @ ${hour} - Activity Level: ${val}/10`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-[7px] text-zinc-500 font-mono mt-1 border-t border-zinc-900 pt-1">
          <span>Start: 9:00 AM</span>
          <span>Close: 8:00 PM</span>
        </div>
      </div>
    );

    if (maximizedChart?.id === chartId) return element;

    return (
      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-zinc-400">{title}</span>
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
            <button onClick={() => setMaximizedChart({ id: chartId, title, element })} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {element}
      </div>
    );
  };

  // --- Correlation Scatter Plot ---
  const renderScatter = (data, xAxisKey, yAxisKey, title, chartId) => {
    const element = (
      <div id={chartId} className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
            <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} stroke="#52525b" fontSize={9} />
            <YAxis type="number" dataKey={yAxisKey} name={yAxisKey} stroke="#52525b" fontSize={9} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
            <Scatter name={title} data={data} fill="#06b6d4" opacity={0.85}>
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );

    if (maximizedChart?.id === chartId) return element;

    return (
      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-zinc-400">{title}</span>
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
            <button onClick={() => setMaximizedChart({ id: chartId, title, element })} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Maximize2 className="w-3 h-3" />
            </button>
            <button onClick={() => downloadChartAsSVG(chartId, title)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
        {element}
      </div>
    );
  };

  // --- Dynamic Treemap Grid ---
  const renderTreemap = (data, dataKey, title, chartId) => {
    const element = (
      <div id={chartId} className="w-full h-44 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey={dataKey}
            aspectRatio={4 / 3}
            stroke="#09090b"
            fill="#8b5cf6"
          >
            <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    );

    if (maximizedChart?.id === chartId) return element;

    return (
      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-zinc-400">{title}</span>
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
            <button onClick={() => setMaximizedChart({ id: chartId, title, element })} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {element}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-zinc-200"
    >
      {/* ==========================================
          1. HEADER TITLE SECTION
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            BI Analytics Center <Sparkles className="w-5 h-5 text-violet-400" />
          </h2>
          <p className="text-sm text-zinc-400">Advanced multidimensional BI suite displaying database ledger aggregations & predictive indexes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Preset Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedPresetName}
              onChange={(e) => loadPreset(e.target.value)}
              className="pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-700/60 rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-violet-500 cursor-pointer appearance-none"
            >
              {presets.map(p => (
                <option key={p.name} value={p.name}>Preset: {p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>

          <button
            onClick={savePreset}
            className="px-3.5 py-2 bg-zinc-900 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 hover:text-white cursor-pointer hover:bg-zinc-800 transition"
          >
            + Save Preset
          </button>
        </div>
      </div>

      {/* ==========================================
          2. FILTER CONTROL BAR
          ========================================== */}
      <div className="p-4 rounded-xl glass-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Global Date Range selector */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-550" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-8 pr-7 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer appearance-none"
              >
                <option value="today">Today</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-3.5 w-3 h-3 text-zinc-550 pointer-events-none" />
            </div>

            {/* Region Filter */}
            <div className="relative">
              <MapPin className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-550" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="pl-8 pr-7 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer appearance-none"
              >
                <option value="">All Regions</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia-Pacific">Asia-Pacific</option>
                <option value="South America">South America</option>
                <option value="Africa">Africa</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-3.5 w-3 h-3 text-zinc-550 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Layers className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-550" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8 pr-7 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer appearance-none"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Hardware">Hardware</option>
                <option value="Networking">Networking</option>
                <option value="Office">Office</option>
                <option value="Accessories">Accessories</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-3.5 w-3 h-3 text-zinc-550 pointer-events-none" />
            </div>

            {/* Employee Filter */}
            <div className="relative">
              <Users className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-550" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="pl-8 pr-7 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer appearance-none"
              >
                <option value="">All Employees</option>
                <option value="admin">System Admin</option>
                {employeePerf.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.userId?.name || 'Staff'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3.5 w-3 h-3 text-zinc-550 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Compare periods toggler */}
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={comparing}
                onChange={(e) => setComparing(e.target.checked)}
                className="rounded text-violet-600 focus:ring-0 border-zinc-800 bg-zinc-950 w-3.5 h-3.5"
              />
              <span>Compare prior period</span>
            </label>
          </div>
        </div>

        {/* Cross-Filtering Active Badges warning */}
        {(chartRegionFilter || chartCategoryFilter || chartSegmentFilter) && (
          <div className="flex items-center gap-2 bg-violet-950/20 border border-violet-900/40 px-3 py-1.5 rounded-lg text-[10px] text-violet-300">
            <Info className="w-3.5 h-3.5 text-violet-400" />
            <span>Active Drill-down Cross filters:</span>
            {chartRegionFilter && <span className="px-2 py-0.5 bg-violet-500/10 rounded font-bold">Region: {chartRegionFilter}</span>}
            {chartCategoryFilter && <span className="px-2 py-0.5 bg-violet-500/10 rounded font-bold">Category: {chartCategoryFilter}</span>}
            {chartSegmentFilter && <span className="px-2 py-0.5 bg-violet-500/10 rounded font-bold">Segment: {chartSegmentFilter}</span>}
            <button
              onClick={clearChartCrossFilters}
              className="ml-auto hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
            >
              Clear filters <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ==========================================
          3. TAB WORKSPACE NAVIGATION
          ========================================== */}
      <div className="flex border-b border-zinc-850 text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'sales', label: 'Sales Analytics' },
          { id: 'customers', label: 'Customer Analytics' },
          { id: 'products', label: 'Product Analytics' },
          { id: 'financials', label: 'Financial Analytics' },
          { id: 'predictive', label: 'Predictive Analytics (AI)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); clearChartCrossFilters(); }}
            className={`px-5 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-violet-500 text-white bg-violet-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==========================================
          4. TAB-SPECIFIC GRIDS (6-8 Charts each)
          ========================================== */}
      {loading ? (
        <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          <span className="text-xs uppercase font-bold tracking-wider">Aggregating MERN Ledger data streams...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {/* -------------------- SALES ANALYTICS TAB -------------------- */}
            {activeTab === 'sales' && (
              <>
                {/* Chart 1: Revenue trend Area */}
                <div id="sales_revenue_trend" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> Sales Revenue Trend
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
                      <button onClick={() => setMaximizedChart({ id: 'sales_revenue_trend', title: 'Sales Revenue Trend', element: (
                        <div className="w-full h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getFilteredSalesTrend()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                              <XAxis dataKey="name" stroke="#52525b" />
                              <YAxis stroke="#52525b" />
                              <Tooltip contentStyle={{ background: '#000' }} />
                              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) })} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => downloadChartAsSVG('sales_revenue_trend', 'Revenue Trend')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getFilteredSalesTrend()} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8b5cf6" fill="url(#areaGlow)" strokeWidth={2} />
                        {comparing && <Area type="monotone" dataKey="unitsSold" name="Prior ($)" stroke="#10b981" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Regional Sales Bar (Enables Region Drilldown) */}
                <div id="sales_region_bar" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Regional sales comparison</span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
                      <button onClick={() => downloadChartAsSVG('sales_region_bar', 'Regional Sales')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getFilteredRegionalRevenue()}
                        margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                        onClick={(data) => {
                          if (data?.activeLabel) {
                            setChartRegionFilter(data.activeLabel);
                            toast.success(`Filtered by region: ${data.activeLabel}`);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="region" stroke="#52525b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="revenue" name="Revenue ($)" fill="#06b6d4" radius={[3, 3, 0, 0]}>
                          {getFilteredRegionalRevenue().map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={entry.region === chartRegionFilter ? '#8b5cf6' : '#06b6d4'}
                              opacity={chartRegionFilter && entry.region !== chartRegionFilter ? 0.4 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Category Distribution Donut (Enables Category Drilldown) */}
                <div id="sales_category_pie" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Category Sales share</span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5">
                      <button onClick={() => downloadChartAsSVG('sales_category_pie', 'Category Share')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Electronics', value: 45000 },
                            { name: 'Hardware', value: 38000 },
                            { name: 'Networking', value: 24000 },
                            { name: 'Accessories', value: 12000 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          onClick={(data) => {
                            if (data?.name) {
                              setChartCategoryFilter(data.name);
                              toast.success(`Filtered by category: ${data.name}`);
                            }
                          }}
                        >
                          {COLORS.slice(0, 4).map((color, index) => {
                            const name = ['Electronics', 'Hardware', 'Networking', 'Accessories'][index];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={color}
                                opacity={chartCategoryFilter && name !== chartCategoryFilter ? 0.3 : 1}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={20} iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Hourly Activity Grid Heatmap */}
                {renderHeatmap('Peak hourly transaction times', 'sales_hourly_heatmap')}

                {/* Chart 5: Stacked Funnel Conversion */}
                {renderFunnel('Lead to invoice conversion funnel', 'sales_stage_funnel')}

                {/* Chart 6: Sales Margin Correlation Scatter */}
                {renderScatter(
                  [
                    { price: 1500, margin: 40 },
                    { price: 2200, margin: 35 },
                    { price: 800, margin: 55 },
                    { price: 1200, margin: 48 },
                    { price: 3400, margin: 28 },
                    { price: 2900, margin: 32 }
                  ],
                  'price',
                  'margin',
                  'Price vs Margin Correlation',
                  'sales_correlation_scatter'
                )}

                {/* Chart 7: Category Treemap */}
                {renderTreemap(
                  [
                    { name: 'Servers', value: 45000 },
                    { name: 'Switches', value: 24000 },
                    { name: 'Cables', value: 12000 },
                    { name: 'Workstations', value: 38000 }
                  ],
                  'value',
                  'Product hierarchy treemap',
                  'sales_category_treemap'
                )}

                {/* Chart 8: Goal Gauge */}
                {renderGauge(stats.totalRevenue > 0 ? stats.totalRevenue / 1000 : 85, 100, 'Monthly Sales Target Goal', 'sales_goal_gauge')}
              </>
            )}

            {/* -------------------- CUSTOMER ANALYTICS TAB -------------------- */}
            {activeTab === 'customers' && (
              <>
                {/* Chart 1: Acquisition Area */}
                <div id="cust_acquisition_trend" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Customer Acquisition Curve</span>
                    <button onClick={() => downloadChartAsSVG('cust_acquisition_trend', 'Acquisitions')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="areaGlowGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="unitsSold" name="Acquisitions" stroke="#10b981" fill="url(#areaGlowGreen)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Segment Donut Share */}
                <div id="cust_segment_share" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Loyalty tiers revenue share</span>
                    <button onClick={() => downloadChartAsSVG('cust_segment_share', 'Tiers Share')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getFilteredCustomerSegments()}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="revenue"
                          nameKey="segment"
                        >
                          {getFilteredCustomerSegments().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={20} iconSize={6} wrapperStyle={{ fontSize: '9.5px', textTransform: 'capitalize' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Avg order value per segment Bar */}
                <div id="cust_aov_bar" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Avg. Order Value by Tier</span>
                    <button onClick={() => downloadChartAsSVG('cust_aov_bar', 'AOV by Tier')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'VIP', aov: 1450 },
                          { name: 'Regular', aov: 680 },
                          { name: 'New', aov: 240 }
                        ]}
                        margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="aov" name="Avg Order Value ($)" fill="#ec4899" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Loyalty Points vs Total Purchases Scatter Correlation */}
                {renderScatter(
                  [
                    { loyalty: 400, purchases: 4200 },
                    { loyalty: 650, purchases: 6800 },
                    { loyalty: 120, purchases: 1100 },
                    { loyalty: 90, purchases: 800 },
                    { loyalty: 1100, purchases: 12400 },
                    { loyalty: 800, purchases: 7900 }
                  ],
                  'loyalty',
                  'purchases',
                  'Loyalty vs Purchases Correlation',
                  'cust_points_scatter'
                )}

                {/* Chart 5: Customer Retention Grid Heatmap */}
                {renderHeatmap('Cohort Month Retention rates', 'cust_cohort_heatmap')}

                {/* Chart 6: Top Customers Leaderboard */}
                <div id="cust_leaderboard_bar" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Customer purchase volume leaderboard</span>
                    <button onClick={() => downloadChartAsSVG('cust_leaderboard_bar', 'Leaderboard')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[
                          { name: 'Acme Systems', volume: 48000 },
                          { name: 'Globex Corp', volume: 32000 },
                          { name: 'Initech Inc', volume: 29000 },
                          { name: 'Umbrella Co', volume: 18000 }
                        ].sort((a,b) => b.volume - a.volume)}
                        margin={{ top: 5, right: 10, bottom: 0, left: 15 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" horizontal={false} />
                        <XAxis type="number" stroke="#52525b" fontSize={9} />
                        <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="volume" name="Spent ($)" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* -------------------- PRODUCT ANALYTICS TAB -------------------- */}
            {activeTab === 'products' && (
              <>
                {/* Chart 1: Top Products Bar */}
                <div id="prod_revenue_bar" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Gross sales per product model</span>
                    <button onClick={() => downloadChartAsSVG('prod_revenue_bar', 'Product Sales')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getFilteredTopProducts()} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="sku" stroke="#52525b" fontSize={8} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="revenue" name="Revenue ($)" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Category volume share pie */}
                <div id="prod_category_donut" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Inventory items distribution</span>
                    <button onClick={() => downloadChartAsSVG('prod_category_donut', 'Category Donut')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryStats?.distribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="category"
                        >
                          {(inventoryStats?.distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={20} iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Stock vs Min Stock Thresholds Bar */}
                <div id="prod_stock_vs_min" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Current Stock vs minimum warning limits</span>
                    <button onClick={() => downloadChartAsSVG('prod_stock_vs_min', 'Stock vs Min')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getFilteredTopProducts().slice(0, 5)} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="sku" stroke="#52525b" fontSize={8} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="stock" name="Stock" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="minStock" name="Min Stock" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Product Margin Scatter Correlation */}
                {renderScatter(
                  [
                    { price: 120, cost: 70 },
                    { price: 340, cost: 190 },
                    { price: 890, cost: 550 },
                    { price: 1400, cost: 900 },
                    { price: 2200, cost: 1350 }
                  ],
                  'price',
                  'cost',
                  'Cost vs Selling Price Correlation',
                  'prod_margin_scatter'
                )}

                {/* Chart 5: Category Margins Gauge */}
                {renderGauge(78, 100, 'Average markup margin target index', 'prod_margins_gauge')}

                {/* Chart 6: Product Inventory Value Treemap */}
                {renderTreemap(
                  [
                    { name: 'Core Networking', value: 89000 },
                    { name: 'Enterprise Power', value: 54000 },
                    { name: 'Data Storage', value: 32000 },
                    { name: 'Clients/PC', value: 48000 }
                  ],
                  'value',
                  'Stock assets value Treemap',
                  'prod_assets_treemap'
                )}
              </>
            )}

            {/* -------------------- FINANCIAL ANALYTICS TAB -------------------- */}
            {activeTab === 'financials' && (
              <>
                {/* Chart 1: Revenue vs Cost vs Net Profit Trend */}
                <div id="fin_multi_trend" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Financial Multi-Trend Ledger</span>
                    <button onClick={() => downloadChartAsSVG('fin_multi_trend', 'Multi-Trend')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="unitsSold" name="Net Expenses" stroke="#ef4444" strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Regional Revenue Breakdown */}
                <div id="fin_region_bar" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Gross Regional profits</span>
                    <button onClick={() => downloadChartAsSVG('fin_region_bar', 'Regional Profit')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getFilteredRegionalRevenue()} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="region" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="revenue" name="Revenues ($)" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Operating Expense distribution donut */}
                <div id="fin_expense_donut" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Operating Expenses (OPEX)</span>
                    <button onClick={() => downloadChartAsSVG('fin_expense_donut', 'OPEX share')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Payroll', value: 45000 },
                            { name: 'Logistics/Freight', value: 18000 },
                            { name: 'Hosting/Cloud', value: 12050 },
                            { name: 'Office lease', value: 5000 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {COLORS.slice(2, 6).map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={20} iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Profit Margin Gauge */}
                {renderGauge(stats.marginPercentage > 0 ? stats.marginPercentage : 46, 100, 'Operating profit margin goal percentage', 'fin_margin_gauge')}

                {/* Chart 5: Monthly growth timeline bar */}
                <div id="fin_growth_waterfall" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Gross month-on-month growth index</span>
                    <button onClick={() => downloadChartAsSVG('fin_growth_waterfall', 'MoM Growth')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Feb', growth: 12 },
                          { name: 'Mar', growth: 18 },
                          { name: 'Apr', growth: -4 },
                          { name: 'May', growth: 22 },
                          { name: 'Jun', growth: 14 }
                        ]}
                        margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="growth" name="Growth (%)">
                          {[12, 18, -4, 22, 14].map((v, i) => (
                            <Cell key={i} fill={v >= 0 ? '#10b981' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* -------------------- PREDICTIVE ANALYTICS TAB -------------------- */}
            {activeTab === 'predictive' && (
              <>
                {/* Chart 1: Revenue Area Forecast with Dashed Upper/Lower Bounds */}
                <div id="pred_revenue_forecast" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> AI-Powered Revenue Forecast Trend
                    </span>
                    <button onClick={() => downloadChartAsSVG('pred_revenue_forecast', 'AI Forecast')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: 'Current', revenue: 148500, upper: 148500, lower: 148500 },
                          { name: 'Week 1', revenue: 154000, upper: 159000, lower: 149000 },
                          { name: 'Week 2', revenue: 158500, upper: 166000, lower: 151000 },
                          { name: 'Week 3', revenue: 165000, upper: 174000, lower: 154000 },
                          { name: 'Week 4', revenue: 172000, upper: 184000, lower: 158000 }
                        ]}
                        margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                      >
                        <defs>
                          <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="revenue" name="Expected ($)" stroke="#06b6d4" fill="url(#forecastGlow)" strokeWidth={2} />
                        <Line type="monotone" dataKey="upper" name="Upper Limit" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="lower" name="Lower Limit" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Predictive Confidence Bar */}
                <div id="pred_confidence_bar" className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zinc-400">Model Forecast Confidence</span>
                    <button onClick={() => downloadChartAsSVG('pred_confidence_bar', 'Confidence Index')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={predictions.length > 0 ? predictions : [
                          { period: 'Week 1', confidence: 95 },
                          { period: 'Week 2', confidence: 90 },
                          { period: 'Week 3', confidence: 85 },
                          { period: 'Week 4', confidence: 80 }
                        ]}
                        margin={{ top: 10, right: 10, bottom: 0, left: -25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="period" stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        <Bar dataKey="confidence" name="Confidence (%)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Expansion Gauge */}
                {renderGauge(88, 100, 'Projected Market Expansion readiness', 'pred_expansion_gauge')}

                {/* Chart 4: AI Anomaly occurrence scatter timeline */}
                {renderScatter(
                  [
                    { day: 3, severity: 75 },
                    { day: 12, severity: 88 },
                    { day: 18, severity: 42 },
                    { day: 25, severity: 68 }
                  ],
                  'day',
                  'severity',
                  'Anomaly Occurrences Timeline',
                  'pred_anomalies_scatter'
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ==========================================
          5. AI POWERED INSIGHTS PANEL (Live summary footer)
          ========================================== */}
      <div className="p-6 rounded-xl glass-card border border-violet-500/10 glow-primary space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
          <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Automated AI Analytics Copilot Insights</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          {/* Anomalies alert columns */}
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-rose-455 tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Anomalies Logged
            </span>
            {aiInsights.anomalies?.length === 0 ? (
              <div className="text-zinc-550 italic p-3 bg-zinc-900/30 rounded border border-zinc-850">No anomalous metrics flagged this session.</div>
            ) : (
              <div className="space-y-1.5">
                {aiInsights.anomalies?.map((anom, idx) => (
                  <div key={idx} className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-rose-350">{anom}</div>
                ))}
              </div>
            )}
          </div>

          {/* Business Insights */}
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" /> Pattern Observations
            </span>
            <div className="space-y-1.5">
              {aiInsights.insights?.map((ins, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-900/40 border border-zinc-850 rounded-lg text-zinc-300">{ins}</div>
              ))}
            </div>
          </div>

          {/* Suggestions actions */}
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-emerald-450 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Action Recommendations
            </span>
            <div className="space-y-1.5">
              {aiInsights.suggestions?.map((sug, idx) => (
                <div key={idx} className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-350">💡 {sug}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          6. MAXIMIZED FULL SCREEN CHART OVERLAY MODAL
          ========================================== */}
      <AnimatePresence>
        {maximizedChart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[75vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{maximizedChart.title}</h3>
                <button
                  onClick={() => setMaximizedChart(null)}
                  className="p-1.5 text-zinc-450 hover:text-white hover:bg-zinc-900 rounded-lg transition"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-6 flex items-center justify-center bg-zinc-900/10">
                {maximizedChart.element}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Analytics;
