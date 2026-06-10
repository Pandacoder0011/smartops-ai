import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console or telemetry services
    console.error('⚠️ SmartOps AI Error Boundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden select-none">
          {/* Decorative premium gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-md w-full p-8 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl text-center space-y-6 relative z-10 glass-card">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Something went wrong 🚨</h2>
              <p className="text-xs text-zinc-450 leading-relaxed max-w-sm mx-auto">
                SmartOps AI encountered an unexpected application runtime error. The system sandbox has successfully isolated the crash.
              </p>
            </div>

            {/* Error Message Details Panel */}
            <div className="text-left font-mono text-[10px] p-4 bg-zinc-950/80 border border-zinc-900/60 rounded-xl max-h-40 overflow-y-auto select-text leading-relaxed text-rose-400">
              <p className="font-bold uppercase tracking-wider text-rose-300 mb-1">Error Stack Trace:</p>
              <p className="font-semibold">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <p className="text-zinc-500 mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-650 hover:bg-violet-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-950/30 transition-all cursor-pointer select-none"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Reloading
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer select-none"
              >
                <Home className="w-3.5 h-3.5" /> Go Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
