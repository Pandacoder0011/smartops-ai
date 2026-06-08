import React, { useState, useEffect, useContext } from 'react';
import {
  Activity,
  Terminal,
  Server,
  Database,
  Cpu,
  ShieldAlert,
  Clock,
  RefreshCw,
  BellRing,
  AlertCircle,
  Play,
  X,
  Check
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
  Tooltip
} from 'recharts';
import { useSocket } from '../context/SocketContext';

const Monitoring = () => {
  const { socket } = useSocket();

  // --- Live Metrics States ---
  const [metrics, setMetrics] = useState({
    cpu: 24.5,
    ram: 68.2,
    dbLatency: 4.8,
    apiLatency: 42
  });

  // Performance latency logs history chart
  const [latencyHistory, setLatencyHistory] = useState([
    { name: '01:00', api: 45, db: 5 },
    { name: '02:00', api: 48, db: 4 },
    { name: '03:00', api: 42, db: 6 },
    { name: '04:00', api: 55, db: 5 },
    { name: '05:00', api: 38, db: 4 },
    { name: '06:00', api: 41, db: 5 }
  ]);

  // Real-time Activity Logs (Connected to Sockets!)
  const [activityLogs, setActivityLogs] = useState([
    { id: 'init', type: 'system', msg: 'System telemetry monitor initialized 🚀', time: new Date().toLocaleTimeString() }
  ]);

  // Database / API error logs viewer
  const [filterErrorType, setFilterErrorType] = useState('all'); // 'all' | 'db' | 'auth' | 'system'
  const [errorLogs, setErrorLogs] = useState([
    { id: '1', type: 'auth', msg: 'JWT verification failure: Token expired 🔑', code: 401, time: '12:05:40' },
    { id: '2', type: 'db', msg: 'Slow query warning: Sale aggregate pipeline took 118ms 🐌', code: 200, time: '12:10:15' },
    { id: '3', type: 'system', msg: 'Google Gemini rate limiter warning: API quota threshold reached 🛡️', code: 429, time: '12:18:32' },
    { id: '4', type: 'db', msg: 'Database connection retry 2/5 succeeded 🟢', code: 200, time: '12:22:10' }
  ]);

  // Alert settings configurations
  const [alerts, setAlerts] = useState({
    latencyAlarm: 150,
    cpuAlert: 85,
    emailOnFailure: true,
    socketLogsEnabled: true
  });

  // --- Real-time Sockets Listeners ---
  useEffect(() => {
    if (socket) {
      // Listen for socket triggers to append real-time telemetry logs
      socket.on('new-sale', (data) => {
        appendActivityLog('sale', `New sales transaction recorded! Invoice total: $${data.totalAmount || 0} 🛒`);
      });

      socket.on('low-stock-alert', (data) => {
        appendActivityLog('warning', `Low Stock Alert: product "${data.name}" stock level fell to ${data.stock} 🚨`);
      });

      socket.on('dashboard-update', (data) => {
        appendActivityLog('metrics', `Dashboard metrics fluctuated: metric "${data.name}" set to ${data.value} 📊`);
      });

      return () => {
        socket.off('new-sale');
        socket.off('low-stock-alert');
        socket.off('dashboard-update');
      };
    }
  }, [socket]);

  // --- Telemetry metrics fluctuations emulator ---
  useEffect(() => {
    const timer = setInterval(() => {
      // Fluctuates metrics slightly
      setMetrics(prev => {
        const cpuFluc = (Math.random() * 4 - 2);
        const ramFluc = (Math.random() * 1.5 - 0.75);
        const apiFluc = Math.floor(Math.random() * 10 - 5);
        const dbFluc = (Math.random() * 1.2 - 0.6);

        const newCpu = parseFloat(Math.min(100, Math.max(1, prev.cpu + cpuFluc)).toFixed(1));
        const newRam = parseFloat(Math.min(100, Math.max(1, prev.ram + ramFluc)).toFixed(1));
        const newApi = Math.min(250, Math.max(5, prev.apiLatency + apiFluc));
        const newDb = parseFloat(Math.min(50, Math.max(0.5, prev.dbLatency + dbFluc)).toFixed(1));

        // Update latency charts history logs
        setLatencyHistory(hist => {
          const updated = [...hist];
          const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          updated.push({ name: timeLabel, api: newApi, db: newDb });
          if (updated.length > 8) {
            updated.shift();
          }
          return updated;
        });

        // Trigger alarm warning if api latency > configured alarm threshold
        if (newApi > alerts.latencyAlarm) {
          toast(`System alert: API Response latency spiked to ${newApi}ms! 🚨`, {
            icon: '⚠️',
            style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }
          });
        }

        return { cpu: newCpu, ram: newRam, dbLatency: newDb, apiLatency: newApi };
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [alerts]);

  const appendActivityLog = (type, msg) => {
    const newLog = {
      id: String(Date.now()),
      type,
      msg,
      time: new Date().toLocaleTimeString()
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 15)]);
  };

  const handleSaveAlerts = (e) => {
    e.preventDefault();
    toast.success('System alert configurations saved successfully 🛡️');
  };

  const getFilteredErrorLogs = () => {
    if (filterErrorType === 'all') return errorLogs;
    return errorLogs.filter(err => err.type === filterErrorType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-zinc-200"
    >
      {/* --- Header Title --- */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-7 h-7 text-emerald-400 animate-pulse" /> System Health Dashboard
        </h2>
        <p className="text-sm text-zinc-400">Real-time telemetry, MERN backend load auditing, error log monitors, and trigger thresholds settings.</p>
      </div>

      {/* ==========================================
          1. REAL-TIME METRICS TILES
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: CPU */}
        <div className="p-4 rounded-xl bg-zinc-950/45 border border-zinc-800/80 relative overflow-hidden group">
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">CPU Utilization</div>
          <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline gap-1">
            {metrics.cpu}%
            <Cpu className="w-4 h-4 text-violet-400 self-center ml-2" />
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${metrics.cpu}%` }} />
          </div>
          <div className="text-[10px] text-zinc-550 mt-2">Core allocation: 4 vCPU Active</div>
        </div>

        {/* Metric 2: RAM */}
        <div className="p-4 rounded-xl bg-zinc-950/45 border border-zinc-800/80 relative overflow-hidden group">
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Memory Allocation</div>
          <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline gap-1">
            {metrics.ram}%
            <Server className="w-4 h-4 text-emerald-400 self-center ml-2" />
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${metrics.ram}%` }} />
          </div>
          <div className="text-[10px] text-zinc-550 mt-2">RAM usage: 5.4 GB / 8.0 GB</div>
        </div>

        {/* Metric 3: DB Speed */}
        <div className="p-4 rounded-xl bg-zinc-950/45 border border-zinc-800/80 relative overflow-hidden group">
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">DB Query Latency</div>
          <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline gap-1">
            {metrics.dbLatency}
            <span className="text-sm font-normal text-zinc-500 font-mono">ms</span>
            <Database className="w-4 h-4 text-cyan-400 self-center ml-2" />
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${(metrics.dbLatency / 30) * 100}%` }} />
          </div>
          <div className="text-[10px] text-zinc-550 mt-2">Connection pool size: 10 sockets active</div>
        </div>

        {/* Metric 4: API Response */}
        <div className="p-4 rounded-xl bg-zinc-950/45 border border-zinc-800/80 relative overflow-hidden group">
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">API Response Time</div>
          <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline gap-1">
            {metrics.apiLatency}
            <span className="text-sm font-normal text-zinc-500 font-mono">ms</span>
            <Clock className="w-4 h-4 text-amber-400 self-center ml-2" />
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${metrics.apiLatency > 120 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${(metrics.apiLatency / 200) * 100}%` }} />
          </div>
          <div className="text-[10px] text-zinc-550 mt-2">Latency SLA threshold: 150ms</div>
        </div>

      </div>

      {/* ==========================================
          2. PERFORMANCE GRAPHS
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Latency trend area */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-zinc-950/45 border border-zinc-850 flex flex-col h-80">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-450 animate-pulse" /> Telemetry Latency Response Trend
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Real-time HTTP requests and database aggregation query response metrics.</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyHistory} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <defs>
                  <linearGradient id="apiLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dbLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                <YAxis stroke="#52525b" fontSize={9} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="api" name="API Latency (ms)" stroke="#8b5cf6" fill="url(#apiLatencyGrad)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="db" name="DB Query (ms)" stroke="#06b6d4" fill="url(#dbLatencyGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Threshold settings panel */}
        <div className="p-5 rounded-xl bg-zinc-950/45 border border-zinc-850 flex flex-col h-80 justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-violet-400" /> SLA Alarm Threshold Settings
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Toggle alert dispatch logs on key system threshold exhausts.</p>
          </div>

          <form onSubmit={handleSaveAlerts} className="space-y-3 mt-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-450 mb-0.5">API Latency alarm (ms)</label>
                <input
                  type="number"
                  value={alerts.latencyAlarm}
                  onChange={(e) => setAlerts({ ...alerts, latencyAlarm: parseInt(e.target.value) || 150 })}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-450 mb-0.5">CPU alarm (%)</label>
                <input
                  type="number"
                  value={alerts.cpuAlert}
                  onChange={(e) => setAlerts({ ...alerts, cpuAlert: parseInt(e.target.value) || 85 })}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={alerts.emailOnFailure}
                  onChange={(e) => setAlerts({ ...alerts, emailOnFailure: e.target.checked })}
                  className="rounded text-violet-500 bg-zinc-900 border-zinc-800"
                />
                <span>Dispatch email alerts on crash</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={alerts.socketLogsEnabled}
                  onChange={(e) => setAlerts({ ...alerts, socketLogsEnabled: e.target.checked })}
                  className="rounded text-violet-500 bg-zinc-900 border-zinc-800"
                />
                <span>Bind Socket.io activity logs stream</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-violet-650 hover:bg-violet-600 font-semibold text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 mt-2"
            >
              <Check className="w-3.5 h-3.5" /> Save Alarm Rules
            </button>
          </form>
        </div>

      </div>

      {/* ==========================================
          3. REAL-TIME ACTIVITY FEED (Websocket messages)
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Terminal Live Activity feed */}
        <div className="p-5 rounded-xl bg-zinc-950/45 border border-zinc-850 flex flex-col h-[350px]">
          <div className="border-b border-zinc-850 pb-2 flex justify-between items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-450" /> Live Websocket Activity logs stream
            </h4>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded text-[8px] uppercase font-bold tracking-wider animate-pulse">
              socket.io listening
            </span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] p-3 space-y-2 bg-zinc-950/80 rounded-xl border border-zinc-900/60 mt-3 select-text leading-relaxed">
            {activityLogs.map((log, idx) => (
              <div key={log.id || idx} className="flex gap-2">
                <span className="text-zinc-600 shrink-0 font-bold">[{log.time}]</span>
                <span className={`shrink-0 uppercase font-extrabold ${
                  log.type === 'sale' ? 'text-emerald-450' : log.type === 'warning' ? 'text-amber-500' : 'text-violet-400'
                }`}>
                  {log.type}:
                </span>
                <span className="text-zinc-300">{log.msg}</span>
              </div>
            ))}
            
            {activityLogs.length === 1 && (
              <div className="text-zinc-600 italic py-6 text-center">
                Waiting for backend database mutations (like adding sales, stock warnings, or telemetry changes) to stream triggers...
              </div>
            )}
          </div>
        </div>

        {/* System Error Logs viewer */}
        <div className="p-5 rounded-xl bg-zinc-950/45 border border-zinc-850 flex flex-col h-[350px]">
          <div className="border-b border-zinc-850 pb-2 flex justify-between items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Auditable server error stack
            </h4>
            
            {/* Filter buttons */}
            <div className="flex rounded bg-zinc-900 border border-zinc-800 p-0.5 text-[9px] font-bold">
              {['all', 'db', 'auth', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterErrorType(t)}
                  className={`px-2 py-0.5 rounded transition capitalize cursor-pointer ${
                    filterErrorType === t ? 'bg-rose-900/40 text-rose-400 border border-rose-500/10' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 mt-3 select-text">
            {getFilteredErrorLogs().map(err => (
              <div key={err.id} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center text-[10px] text-zinc-550 font-mono">
                    <span className="uppercase font-bold tracking-wider">{err.type} • code {err.code}</span>
                    <span>{err.time}</span>
                  </div>
                  <p className="text-zinc-300 leading-normal font-mono text-[11px]">{err.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default Monitoring;
