import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton
} from '@clerk/react';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  useEffect(() => {
    document.title = 'SmartOps AI - Enterprise Login';
  }, []);

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
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Authentication is managed securely by Clerk. Click the button below to sign in or sign up.
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
