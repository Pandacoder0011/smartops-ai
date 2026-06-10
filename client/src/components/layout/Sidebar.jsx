import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
  Briefcase,
  BarChart3,
  Bot,
  FileText,
  Settings,
  ShieldAlert,
  Activity,
  Copy,
  Check
} from 'lucide-react';

const Sidebar = ({ isCollapsed }) => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = () => {
    if (user?.workspaceId) {
      navigator.clipboard.writeText(user.workspaceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/sales', label: 'Sales Invoices', icon: TrendingUp },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/employees', label: 'Employees', icon: Briefcase },
    { path: '/analytics', label: 'Analytics Insights', icon: BarChart3 },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/monitoring', label: 'System Health', icon: Activity },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <motion.aside
      animate={{ 
        width: isCollapsed ? (isMobile ? 0 : 80) : 260,
        x: isCollapsed && isMobile ? -260 : 0,
        opacity: isCollapsed && isMobile ? 0 : 1
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`h-[calc(100vh-73px)] border-r border-white/5 bg-zinc-950/90 backdrop-blur-md flex flex-col justify-between p-4 z-20 shrink-0 select-none overflow-hidden ${
        isMobile ? 'absolute left-0 top-0 shadow-2xl' : 'relative'
      }`}
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
      <div className="space-y-3.5">
        
        {/* Workspace ID copy Widget */}
        {user?.workspaceId && (
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 overflow-hidden relative group">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              {!isCollapsed ? (
                <span>Workspace ID</span>
              ) : (
                <span className="mx-auto text-[8px]">WS</span>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-1.5 mt-1">
              {!isCollapsed ? (
                <span
                  className="text-xs font-mono font-semibold text-zinc-300 truncate max-w-[170px]"
                  title={user.workspaceId}
                >
                  {user.workspaceId}
                </span>
              ) : null}

              <button
                type="button"
                onClick={handleCopy}
                className={`p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-all shrink-0 relative ${
                  isCollapsed ? 'mx-auto' : 'ml-auto'
                }`}
                title={copied ? "Copied!" : "Copy Workspace ID"}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                
                {/* Micro-tooltip pop */}
                {copied && !isCollapsed && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 text-[9px] bg-emerald-500 text-white rounded font-bold shadow-md whitespace-nowrap animate-bounce">
                    Copied! 📋
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SLA Progress Bar */}
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

        {/* Version info */}
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
