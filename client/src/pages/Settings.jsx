import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Lock, Loader2, Save, Phone, Mail, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth();

  useEffect(() => {
    document.title = 'SmartOps AI - Settings & Profile';
  }, []);

  // Profile states
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [company, setCompany] = useState(user?.company || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync profile details when user object resolves
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setPhoneNumber(user.phoneNumber || '');
      setCompany(user.company || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || !company) return;

    setUpdatingProfile(true);
    await updateProfile({ name, username, phoneNumber, company });
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
        <p className="text-sm text-zinc-400">Configure your profile, phone authentication, security settings, and workspace metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings form */}
        <div className="p-6 rounded-xl glass-card space-y-6">
          <div className="flex items-center space-x-2 text-violet-400 border-b border-white/5 pb-3">
            <User className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">Account & User Profile</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Username</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_ops"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-950/40 text-white"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Connor"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-950/40 text-white"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 019-9921"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-950/40 text-white"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Company Name</label>
              <div className="relative flex items-center">
                <FileText className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="SmartOps Inc"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-950/40 text-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Email Address (Read-Only)</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-zinc-650 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-900/30 text-zinc-500 cursor-not-allowed border-white/5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
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
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-950/40 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">New Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-lg glass-input bg-zinc-950/40 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
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
