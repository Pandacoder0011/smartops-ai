import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, AlertCircle, Sparkles } from 'lucide-react';

const GoogleSimModal = ({ isOpen, onClose, onSuccess, title = 'Sign in with Google' }) => {
  const [customMode, setCustomMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectAccount = (selectedEmail, selectedName) => {
    // format: mock-google-token-email-name
    const token = `mock-google-token-${selectedEmail}-${selectedName.replace(/\s+/g, '_')}`;
    onSuccess(token);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in both fields 📝');
      return;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email format ✉️');
      return;
    }
    handleSelectAccount(email, name);
  };

  const mockAccounts = [
    { name: 'John Doe', email: 'john@smartops.ai', initial: 'JD', color: 'bg-indigo-500' },
    { name: 'Sarah Connor', email: 'sarah@cyberdyne.com', initial: 'SC', color: 'bg-rose-500' },
    { name: 'Bruce Wayne', email: 'bruce@waynecorp.com', initial: 'BW', color: 'bg-emerald-500' }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-bold text-white tracking-tight">Google Accounts</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-400 mt-1.5 flex items-center justify-center gap-1">
                to continue to <span className="font-semibold text-cyan-400">SmartOps AI</span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" /> Dev Sandbox
                </span>
              </p>
            </div>

            {!customMode ? (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Select a Sandbox Profile
                </span>
                
                {mockAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleSelectAccount(account.email, account.name)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 hover:bg-white/10 text-left transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${account.color} flex items-center justify-center text-xs font-bold text-white uppercase`}>
                        {account.initial}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block group-hover:text-cyan-400 transition-colors">
                          {account.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">{account.email}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Choose
                    </span>
                  </button>
                ))}

                <button
                  onClick={() => setCustomMode(true)}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-white/5 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Use another account</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Custom Social Profile
                </span>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input border border-white/10 bg-zinc-950 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input border border-white/10 bg-zinc-950 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode(false);
                      setError('');
                    }}
                    className="w-1/2 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-all"
                  >
                    Back to Accounts
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoogleSimModal;
