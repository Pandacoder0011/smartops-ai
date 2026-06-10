import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Mail,
  Lock,
  User,
  Building,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('employee');
  const [submitting, setSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    document.title = 'SmartOps AI - Enterprise Registration';
  }, []);

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (!name) {
      tempErrors.name = 'Full name is required 👤';
    }

    if (!email) {
      tempErrors.email = 'Email address is required ✉️';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Please enter a valid email format ✉️';
    }

    if (!company) {
      tempErrors.company = 'Company name is required 🏢';
    }

    if (!password) {
      tempErrors.password = 'Password is required 🔒';
    } else if (!passwordRegex.test(password)) {
      tempErrors.password = 'Must be 6+ chars with letters and numbers 🔒';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const result = await register({
      name,
      email,
      password,
      company,
      role
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignUp = () => {
    toast.success('Google registration simulation triggered 🚀');
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 transition-colors duration-300 select-none">
      
      {/* LEFT PANEL: Register inputs (50% on lg) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="absolute inset-0 bg-zinc-950 opacity-90 lg:opacity-100 z-0 pointer-events-none" />
        
        {/* Mobile background glow */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none z-0 lg:hidden"></div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6 relative z-10 text-zinc-100"
        >
          {/* Header */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center glow-primary mb-4">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Register company</h2>
            <p className="text-xs text-zinc-400 mt-2">Initialize your MERN operational database analytics.</p>
          </div>

          {/* Social Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-zinc-200 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Register with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            <div className="w-[40%] h-[1px] bg-white/5" />
            <span>or</span>
            <div className="w-[40%] h-[1px] bg-white/5" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  disabled={submitting}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="Sarah Connor"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input ${
                    errors.name ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.name && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-400 font-semibold">
                  {errors.name}
                </motion.p>
              )}
            </div>

            {/* Email Address */}
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

            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Company Name</label>
              <div className="relative flex items-center">
                <Building className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={company}
                  disabled={submitting}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors({ ...errors, company: null });
                  }}
                  placeholder="SmartOps Inc"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-lg glass-input ${
                    errors.company ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.company && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-400 font-semibold">
                  {errors.company}
                </motion.p>
              )}
            </div>

            {/* System Role and Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">System Role</label>
                <select
                  value={role}
                  disabled={submitting}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-lg glass-input appearance-none bg-zinc-900 border border-white/5 cursor-pointer"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:from-zinc-850 disabled:to-zinc-850 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering database profiles...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirection */}
          <div className="text-center text-xs text-zinc-400">
            <span>Already have a workspace? </span>
            <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL: Stripe-style visuals and copy (hidden on md) */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 border-l border-white/5 items-center justify-center p-12 relative overflow-hidden">
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 to-violet-500/0 rounded-full blur-3xl pointer-events-none" />
        
        {/* Abstract graphics card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-lg space-y-8 z-10"
        >
          {/* Headline */}
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> High-Fidelity Data Pipelines
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Connect your teams, inventory, and ledger in real time
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Register your workspace profile to start tracking metrics, checking inventory stock limits, and chatting with our recursive Gemini tools agent.
            </p>
          </div>

          {/* Feature highlights list */}
          <div className="grid grid-cols-1 gap-4 mt-6">
            
            {/* Feature 1 */}
            <div className="p-4 rounded-xl glass-card border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Autonomic Roles Rules</span>
                  <span className="text-[10px] text-zinc-500">Secure JWT RBAC access control parameters</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-4 rounded-xl glass-card border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Real-time Socket Telemetry</span>
                  <span className="text-[10px] text-zinc-500">Live system status updates</span>
                </div>
              </div>
            </div>

          </div>

          {/* Quote footer */}
          <div className="border-t border-white/5 pt-6 text-[10px] text-zinc-500 flex justify-between items-center">
            <span>SmartOps AI © 2026</span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Technical Help
            </span>
          </div>

        </motion.div>
      </div>

    </div>
  );
};

export default Register;
