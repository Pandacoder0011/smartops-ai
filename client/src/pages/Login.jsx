import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Check for remembered email on boot
  useEffect(() => {
    const remembered = localStorage.getItem('remembered_email');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    
    if (!email) {
      tempErrors.email = 'Email address is required ✉️';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Please enter a valid email format ✉️';
    }

    if (!password) {
      tempErrors.password = 'Password is required 🔒';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters 🔒';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = () => {
    toast.success('Google Single Sign-On simulation triggered 🚀');
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 transition-colors duration-300 select-none">
      
      {/* LEFT PANEL: Clean, glassmorphic login forms (50% on lg) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="absolute inset-0 bg-zinc-950 opacity-90 lg:opacity-100 z-0 pointer-events-none" />
        
        {/* Responsive background glow for mobile */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none z-0 lg:hidden"></div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8 relative z-10 text-zinc-100"
        >
          {/* Logo / Header */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center glow-primary mb-4">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="text-xs text-zinc-400 mt-2">Simplify your enterprise workflows with AI digital assistance.</p>
          </div>

          {/* Social login option */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/20 text-zinc-200 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            <div className="w-[40%] h-[1px] bg-white/5" />
            <span>or</span>
            <div className="w-[40%] h-[1px] bg-white/5" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  disabled={submitting}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="name@company.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input ${
                    errors.email ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-400 font-semibold">
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
                <a href="#" className="text-[10px] text-violet-400 hover:underline">Forgot password?</a>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  disabled={submitting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input ${
                    errors.password ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-400 font-semibold">
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={submitting}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/10 bg-zinc-900 text-violet-500 focus:ring-violet-500 w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-zinc-850 disabled:to-zinc-850 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating secure token...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirection */}
          <div className="text-center text-xs text-zinc-400">
            <span>New user or company? </span>
            <Link to="/register" className="text-violet-400 font-semibold hover:underline">
              Create a workspace
            </Link>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL: Stripe-style visuals and copy (hidden on md) */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 border-l border-white/5 items-center justify-center p-12 relative overflow-hidden">
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
        
        {/* Abstract graphic display */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-lg space-y-8 z-10"
        >
          {/* Headline */}
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> Premium Enterprise Workspace
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Empower your enterprise with digital AI assistance
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Aggregate sales datasets, track key employee rosters, and audit ledger transactions with our intelligent Gemini-driven digital assistant.
            </p>
          </div>

          {/* Metric cards list (Notion/Stripe layout style) */}
          <div className="grid grid-cols-1 gap-4 mt-6">
            
            {/* Live conversion rate card */}
            <div className="p-4 rounded-xl glass-card border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Conversion Rate Status</span>
                  <span className="text-[10px] text-zinc-500">Auto-aggregated conversion statistics</span>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-400">+11.72%</span>
            </div>

            {/* AI report generation card */}
            <div className="p-4 rounded-xl glass-card border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">System SLA Uptime</span>
                  <span className="text-[10px] text-zinc-500">Live Socket telemetry check</span>
                </div>
              </div>
              <span className="text-sm font-bold text-white">99.98%</span>
            </div>

          </div>

          {/* Quote footer */}
          <div className="border-t border-white/5 pt-6 text-[10px] text-zinc-500 flex justify-between items-center">
            <span>SmartOps AI © 2026</span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Support System
            </span>
          </div>

        </motion.div>
      </div>

    </div>
  );
};

export default Login;
