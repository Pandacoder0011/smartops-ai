import React from 'react';
import { FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const Reports = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-zinc-100"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Operational Reports</h2>
          <p className="text-sm text-zinc-400">Generate and download structured business summaries.</p>
        </div>
      </div>

      <div className="p-12 rounded-xl glass-card text-center space-y-4">
        <FileText className="w-12 h-12 text-violet-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Aggregations Staging</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Querying logs. Custom balance and sales reports can also be compiled on-the-fly using natural language prompts within the AI Assistant.
        </p>
      </div>
    </motion.div>
  );
};

export default Reports;
