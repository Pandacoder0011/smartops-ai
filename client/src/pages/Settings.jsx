import React, { useState } from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { Settings as SettingsIcon, Database, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  React.useEffect(() => {
    document.title = 'SmartOps AI - Settings & Profile';
  }, []);

  const [isActionPending, setIsActionPending] = useState(false);

  const handleSeed = async () => {
    setIsActionPending(true);
    const loadId = toast.loading('Seeding workspace demo data... 🚀');
    try {
      const response = await api.post('/seed/demo');
      if (response.data.success) {
        toast.success(response.data.message || 'Workspace seeded successfully! 🎉', { id: loadId });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error('Failed to seed workspace data.', { id: loadId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error seeding workspace data 🚨', { id: loadId });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to clear all data in your workspace? This action is permanent and cannot be undone.')) {
      return;
    }
    setIsActionPending(true);
    const loadId = toast.loading('Clearing workspace data... 🗑️');
    try {
      const response = await api.post('/seed/reset');
      if (response.data.success) {
        toast.success(response.data.message || 'Workspace data reset successfully. ✨', { id: loadId });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error('Failed to reset workspace data.', { id: loadId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error resetting workspace data 🚨', { id: loadId });
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-zinc-100 max-w-4xl"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          System Settings <SettingsIcon className="w-5 h-5 text-violet-400" />
        </h2>
        <p className="text-sm text-zinc-400">Configure your profile, credential details, and general workspace settings.</p>
      </div>

      {/* Workspace Seeding Controls */}
      <div className="glass-card border border-white/10 p-6 rounded-xl bg-zinc-950/40 backdrop-blur-md shadow-lg space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Workspace Data Management <Database className="w-5 h-5 text-violet-400" />
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Seed your workspace with realistic demo data (products, customers, employees, sales, and transactions) to explore all dashboards and features instantly, or reset it back to empty.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleSeed}
            disabled={isActionPending}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 text-white transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Database className="w-4 h-4" />
            {isActionPending ? 'Seeding...' : 'Seed Demo Data'}
          </button>
          <button
            onClick={handleReset}
            disabled={isActionPending}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600/90 hover:bg-red-500 disabled:bg-zinc-700 text-white transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {isActionPending ? 'Resetting...' : 'Reset My Data'}
          </button>
        </div>
      </div>

      <div className="flex justify-center md:justify-start">
        <UserProfile 
          appearance={{
            variables: {
              colorPrimary: '#8b5cf6', // Violet color matching the theme
              colorBackground: '#18181b', // Zinc-900 matching glass-card
              colorText: '#f4f4f5',
              colorTextSecondary: '#a1a1aa'
            },
            elements: {
              card: 'bg-zinc-950 border border-white/5 rounded-xl shadow-2xl w-full',
              navbar: 'bg-zinc-900 border-r border-white/5',
              navbarButton: 'text-zinc-400 hover:text-white hover:bg-white/5',
              navbarButtonActive: 'text-white bg-violet-600/20 text-violet-400',
              headerTitle: 'text-white',
              headerSubtitle: 'text-zinc-400',
              profileSectionTitle: 'text-violet-400 font-semibold',
              accordionTriggerButton: 'text-zinc-300 hover:text-white',
              breadcrumbsItem: 'text-zinc-400',
              breadcrumbsItemActive: 'text-white',
              fileDropAreaButtons: 'bg-violet-600 hover:bg-violet-500 text-white',
              formButtonPrimary: 'bg-violet-600 hover:bg-violet-500 text-white',
              formButtonReset: 'text-zinc-400 hover:text-white hover:bg-white/5'
            }
          }}
        />
      </div>
    </motion.div>
  );
};

export default Settings;
