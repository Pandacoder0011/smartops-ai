import React from 'react';
import { 
  BarChart3, 
  Bot, 
  Database, 
  FileSpreadsheet, 
  History, 
  LayoutDashboard, 
  Settings, 
  ShieldAlert 
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
    { id: 'upload', label: 'Import Datasets', icon: FileSpreadsheet },
    { id: 'logs', label: 'Audit Logs', icon: History },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-73px)] border-r border-white/5 bg-zinc-950/20 flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Navigation</p>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/10 text-white border-l-4 border-violet-500 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        {/* Quick system status */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5">
          <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-zinc-300">Operational SLA</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-violet-500 to-cyan-400 h-1.5 rounded-full" style={{ width: '99.9%' }}></div>
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">99.98% overall performance</span>
        </div>

        <div className="px-3 py-1 flex items-center justify-between text-xs text-zinc-500">
          <span>v1.0.0</span>
          <span>System Normal</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
