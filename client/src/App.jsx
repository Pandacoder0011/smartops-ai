import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layout
import Layout from './components/layout/Layout';

// Lazy Loaded Pages for performance optimizations
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

// Styled loading placeholder for Suspense boundaries
const PageLoader = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-zinc-100">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Loading Dashboard Module...</p>
    </div>
  </div>
);

// Route Guard: Protected/Private views
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Validating session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Route Guard: Public only views (Login/Register)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppContent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Pages */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Workspace Layout Pages */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
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
        <AuthProvider>
          <SocketProvider>
            <Router>
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
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
