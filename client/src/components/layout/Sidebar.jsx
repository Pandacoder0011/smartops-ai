import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Bot,
  FileText,
  Settings,
  ShieldAlert
} from 'lucide-react';

const Sidebar = ({ isCollapsed }) => {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/sales', label: 'Sales Invoices', icon: TrendingUp },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/employees', label: 'Employees', icon: Briefcase },
    { path: '/finance', label: 'Finance Ledger', icon: DollarSign },
    { path: '/analytics', label: 'Analytics Insights', icon: BarChart3 },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-[calc(100vh-73px)] border-r border-white/5 bg-zinc-950/60 flex flex-col justify-between p-4 z-20 shrink-0 select-none overflow-hidden"
    >
      <div className="space-y-6">
        {/* Navigation Category Header */}
        <div className="px-3 h-4 flex items-center">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                Operational Workspace
              </motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full border-b border-white/5"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation items list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/10 text-white border-l-4 border-violet-500 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Panel */}
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 overflow-hidden">
          <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-semibold text-zinc-300 whitespace-nowrap"
                >
                  Operational SLA
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-400 h-1.5 rounded-full"
              style={{ width: '99.9%' }}
            ></div>
          </div>
        </div>

        <div className="px-3 flex items-center justify-between text-xs text-zinc-500">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                v1.0.0 • Normal
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-bold mx-auto text-zinc-500"
              >
                S1
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
