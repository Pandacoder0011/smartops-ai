import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Lock, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth();

  React.useEffect(() => {
    document.title = 'SmartOps AI - Settings & Profile';
  }, []);

  // Profile states
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || !company) return;

    setUpdatingProfile(true);
    await updateProfile({ name, company });
    setUpdatingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setUpdatingPassword(true);
    const result = await changePassword({ currentPassword, newPassword });
    setUpdatingPassword(false);

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings form */}
        <div className="p-6 rounded-xl glass-card space-y-6">
          <div className="flex items-center space-x-2 text-violet-400 border-b border-white/5 pb-3">
            <User className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">Account details</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg glass-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Company Name</label>
              <input
                type="text"
                required
                value={company}
                className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Email Address (Read-Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs rounded-lg glass-input bg-zinc-900/30 text-zinc-500 cursor-not-allowed border-white/5"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          </form>
        </div>

        {/* Change Password form */}
        <div className="p-6 rounded-xl glass-card space-y-6">
          <div className="flex items-center space-x-2 text-violet-400 border-b border-white/5 pb-3">
            <Lock className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">Security Credentials</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-lg glass-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-lg glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
