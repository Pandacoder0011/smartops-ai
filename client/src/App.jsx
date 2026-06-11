import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layout
import Layout from './components/layout/Layout';

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Sales = lazy(() => import('./pages/Sales'));
const Customers = lazy(() => import('./pages/Customers'));
const Employees = lazy(() => import('./pages/Employees'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Monitoring = lazy(() => import('./pages/Monitoring'));

// Styled loading placeholder
const PageLoader = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-zinc-100">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Loading Dashboard Module...</p>
    </div>
  </div>
);

// Token Synchronizer Component: gets Clerk token and syncs it to localStorage
function TokenSynchronizer() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const syncToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem('token', token);
          }
        } catch (err) {
          console.error('Clerk token sync failed:', err);
        }
      } else {
        localStorage.removeItem('token');
      }
    };

    syncToken();

    // Set an interval to refresh the token every 50 seconds (Clerk JWTs expire quickly, usually 60s)
    const interval = setInterval(syncToken, 50000);
    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  return null;
}

function AppContent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TokenSynchronizer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login/*" element={<Login />} />
        <Route path="/register/*" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<Sales />} />
          <Route path="customers" element={<Customers />} />
          <Route path="employees" element={<Employees />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="monitoring" element={<Monitoring />} />
        </Route>

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SocketProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'glass-card text-xs border border-white/5',
              style: {
                background: '#09090b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }
            }}
          />
          <AppContent />
        </SocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
