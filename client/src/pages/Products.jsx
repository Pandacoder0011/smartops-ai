import React from 'react';
import { Package, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Products = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-zinc-100"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Products Catalog</h2>
          <p className="text-sm text-zinc-400">Manage your active hardware inventory and pricing margins.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="p-12 rounded-xl glass-card text-center space-y-4">
        <Package className="w-12 h-12 text-violet-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Catalog Synchronizing</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Stock levels and margin metrics are being cached from local warehouses. Direct queries can also be made through the AI Assistant.
        </p>
      </div>
    </motion.div>
  );
};

export default Products;
