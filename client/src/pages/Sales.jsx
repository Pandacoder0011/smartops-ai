import React from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Sales = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-zinc-100"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sales Invoices</h2>
          <p className="text-sm text-zinc-400">Review regional invoice generation and profit splits.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Record Sale
        </button>
      </div>

      <div className="p-12 rounded-xl glass-card text-center space-y-4">
        <TrendingUp className="w-12 h-12 text-violet-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Ledger Loading</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Synchronizing invoices. Real-time telemetry connection will notify you of incoming customer transactions.
        </p>
      </div>
    </motion.div>
  );
};

export default Sales;
