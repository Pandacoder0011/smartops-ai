import React from 'react';
import { DollarSign, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const Finance = () => {
  React.useEffect(() => {
    document.title = 'SmartOps AI - Finance Ledger';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-zinc-100"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Finance Ledger</h2>
          <p className="text-sm text-zinc-400">Review business cash flow accounts, operating expenses, and margins.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="p-12 rounded-xl glass-card text-center space-y-4">
        <DollarSign className="w-12 h-12 text-violet-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Balance Accounts Balancing</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Consolidating transaction entries, salaries, and operating incomes. Financial aggregations can be queried live through the dashboard views.
        </p>
      </div>
    </motion.div>
  );
};

export default Finance;
