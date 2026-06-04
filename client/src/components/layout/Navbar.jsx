import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Activity, Bell, Search, Settings, User } from 'lucide-react';

const Navbar = () => {
  const { connected } = useSocket();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
      {/* Left Area - Branding */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center glow-primary">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            SmartOps AI
          </h1>
          <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">
            BI Digital Co-Pilot
          </p>
        </div>
      </div>

      {/* Middle Area - Search Bar */}
      <div className="hidden md:flex items-center w-96 relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3" />
        <input
          type="text"
          placeholder="Search metrics, reports, prompts..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg glass-input text-zinc-200"
        />
      </div>

      {/* Right Area - Telemetry Status and Icons */}
      <div className="flex items-center space-x-4">
        {/* Real-time connection badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/5 text-[11px] font-medium text-zinc-300">
          <span className={`relative flex h-2 w-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span>{connected ? 'LIVE TELEMETRY' : 'DISCONNECTED'}</span>
        </div>

        <button className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-8 w-[1px] bg-white/5"></div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-white">John Doe</p>
            <p className="text-[10px] text-zinc-400">Operations Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
