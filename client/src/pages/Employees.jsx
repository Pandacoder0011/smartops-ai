import React from 'react';
import { Briefcase, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const Employees = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-zinc-100"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Staff Roster</h2>
          <p className="text-sm text-zinc-400">Manage positioning departments, payrolls, and KPI reports.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer">
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <div className="p-12 rounded-xl glass-card text-center space-y-4">
        <Briefcase className="w-12 h-12 text-violet-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Roster Syncing</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Loading performance reviews, attendance records, and active task items. Use AI commands to check ranking status instantly.
        </p>
      </div>
    </motion.div>
  );
};

export default Employees;
