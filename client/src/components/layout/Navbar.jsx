import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Activity,
  Bell,
  Search,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const { connected } = useSocket();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Dynamic user initials
  const getUserInitials = () => {
    if (!user || !user.name) return 'SO';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const mockNotifications = [
    { id: 1, message: 'Stock alert: ASN-202 is low (3 left)', time: '5m ago', unread: true },
    { id: 2, message: 'Sarah Connor completed a sale ($1,240)', time: '1h ago', unread: false },
    { id: 3, message: 'System health check completed successfully', time: '4h ago', unread: false }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between transition-colors duration-300 select-none">
      
      {/* Left Area - Branding & Sidebar Toggle */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center glow-primary">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              SmartOps AI
            </h1>
            <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">
              BI Digital Co-Pilot
            </p>
          </div>
        </div>
      </div>

      {/* Middle Area - Search Bar */}
      <div className="hidden md:flex items-center w-80 lg:w-96 relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search metrics, reports, prompts..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg glass-input text-zinc-200"
        />
      </div>

      {/* Right Area - Controls, Themes & Profiles */}
      <div className="flex items-center space-x-4">
        
        {/* Real-time connection badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/5 text-[11px] font-medium text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span>{connected ? 'LIVE TELEMETRY' : 'DISCONNECTED'}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-violet-400" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-80 rounded-xl glass-card border border-white/5 p-4 shadow-xl z-40 text-xs"
                >
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                    <span className="font-bold text-white">Notifications Inbox</span>
                    <button className="text-[10px] text-violet-400 hover:underline">Mark all read</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-lg border transition-all ${
                          notif.unread
                            ? 'bg-violet-950/20 border-violet-500/20 text-zinc-200'
                            : 'bg-zinc-900/20 border-white/5 text-zinc-400'
                        }`}
                      >
                        <p className="font-medium leading-relaxed">{notif.message}</p>
                        <span className="text-[9px] text-zinc-500 block mt-1">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-white/5"></div>

        {/* User Profile Area */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-white/5 transition-all text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {getUserInitials()}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                {user ? user.name : 'Guest User'}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold truncate max-w-[120px]">
                {user ? user.role : 'Guest'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden lg:block" />
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-56 rounded-xl glass-card border border-white/5 p-2 shadow-xl z-40"
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
                    <p className="text-[9px] text-violet-400 mt-0.5 font-semibold uppercase tracking-wider">
                      {user?.company}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left cursor-pointer border-t border-white/5 mt-1.5 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
