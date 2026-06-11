import React from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  React.useEffect(() => {
    document.title = 'SmartOps AI - Settings & Profile';
  }, []);

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
