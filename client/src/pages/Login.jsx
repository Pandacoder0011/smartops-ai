import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton
} from '@clerk/react';
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = 'SmartOps AI - Enterprise Login';
  }, []);

  const handleSandboxLogin = (provider, e) => {
    if (e) e.preventDefault();
    
    // Simple verification if Email flow is chosen
    if (provider === 'email') {
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
      if (Object.keys(tempErrors).length > 0) {
        setErrors(tempErrors);
        return;
      }
    }

    setSubmitting(true);
    toast.success(`Authenticating via sandbox ${provider}... 🚀`);

    setTimeout(() => {
      localStorage.setItem('sandbox_signed_in', 'true');
      window.dispatchEvent(new CustomEvent('sandbox-auth-change'));
      setSubmitting(false);
      navigate('/dashboard');
    }, 800);
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
          className="w-full max-w-md space-y-7 relative z-10 text-zinc-100"
        >
          {/* Logo / Dynamic Bold Title */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center glow-primary mb-4">
              <Activity className="w-5 h-5 text-white" />
            </div>
            
            {/* Dynamic Dynamic Bold Title */}
            <motion.h1
              className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-cyan-400 to-indigo-500 uppercase pb-2"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 8,
                ease: 'linear',
                repeat: Infinity
              }}
              style={{ backgroundSize: '200% 200%' }}
            >
              SmartOps AI
            </motion.h1>
            <div className="h-[2px] w-32 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full mb-2" />
            
            <p className="text-xs text-zinc-400 mt-2">Simplify your enterprise workflows with Clerk Auth & AI digital assistance.</p>
          </div>

          {/* Authentication Container */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
            
            {/* Signed Out View */}
            <Show when="signed-out">
              {/* Check if Clerk key is present in client configuration */}
              {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Authentication is managed securely by Clerk. Click below to sign in or register.
                  </p>
                  <div className="flex flex-col gap-3 pt-2">
                    <SignInButton mode="modal">
                      <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-500/10 transition-all cursor-pointer flex items-center justify-center gap-2">
                        Sign In with Clerk 🔐
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-zinc-200 text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                        Create New Account
                      </button>
                    </SignUpButton>
                  </div>
                </div>
              ) : (
                /* Sandbox Mode: Custom Email, Google, and GitHub Sign In form */
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sandbox Login</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Zero latency</span>
                  </div>

                  <form onSubmit={(e) => handleSandboxLogin('email', e)} className="space-y-3.5">
                    {/* Email Input */}
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
                          placeholder="admin@smartops.ai"
                          className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input bg-zinc-950 text-white border border-white/10 focus:border-cyan-500/50 transition-colors ${
                            errors.email ? 'border-red-500/50 focus:border-red-500' : ''
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[10px] text-red-400 font-semibold">{errors.email}</p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
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
                          className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input bg-zinc-950 text-white border border-white/10 focus:border-cyan-500/50 transition-colors ${
                            errors.password ? 'border-red-500/50 focus:border-red-500' : ''
                          }`}
                        />
                      </div>
                      {errors.password && (
                        <p className="text-[10px] text-red-400 font-semibold">{errors.password}</p>
                      )}
                    </div>

                    {/* Email Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      Sign In with Email
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center justify-between text-[9px] text-zinc-600 uppercase tracking-widest font-bold pt-2">
                    <div className="w-[32%] h-[1px] bg-white/5" />
                    <span>Or continue with</span>
                    <div className="w-[32%] h-[1px] bg-white/5" />
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleSandboxLogin('Google')}
                      disabled={submitting}
                      className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-zinc-200 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>Google</span>
                    </button>
                    
                    <button
                      onClick={() => handleSandboxLogin('GitHub')}
                      disabled={submitting}
                      className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-zinc-200 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                    </button>
                  </div>
                </div>
              )}
            </Show>

            {/* Signed In View */}
            <Show when="signed-in">
              <div className="space-y-4 text-center">
                <div className="flex justify-center py-2">
                  <UserButton afterSignOutUrl="/login" />
                </div>
                <p className="text-xs text-zinc-300">
                  You are signed in! Welcome to your operations command console.
                </p>
                <Link
                  to="/dashboard"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
              </div>
            </Show>

          </div>

          {/* Redirection fallback */}
          <div className="text-center text-xs text-zinc-400">
            <span>Authentication powered by </span>
            <a href="https://clerk.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 font-semibold hover:underline">
              Clerk Dev Suite
            </a>
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

          {/* Metric cards list */}
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
