import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-foreground antialiased overflow-hidden transition-colors duration-300">
      {/* Dynamic Background Glow Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/10 to-indigo-600/0 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 to-violet-500/0 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Top Navbar */}
      <Navbar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex overflow-hidden z-10 relative">
        {/* Collapsible Sidebar */}
        <Sidebar isCollapsed={isCollapsed} />

        {/* Content Wrapper Viewport */}
        <motion.main
          layout
          className="flex-1 flex flex-col overflow-y-auto bg-zinc-950/40"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
