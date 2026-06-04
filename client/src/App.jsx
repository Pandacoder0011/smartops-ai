import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return (
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Detailed Analytics Analytics</h2>
            <p className="text-sm text-zinc-400 max-w-md">Detailed predictive charts, anomaly detectors, and custom report builders are being synced from operational caches.</p>
          </div>
        );
      case 'copilot':
        return (
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Operational Copilot Terminal</h2>
            <p className="text-sm text-zinc-400 max-w-md">Ask questions about your enterprise metrics. Utilize the Chat widget on the main Dashboard page to begin.</p>
          </div>
        );
      case 'upload':
        return (
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Import Datasets</h2>
            <p className="text-sm text-zinc-400 max-w-md">Import operational CSV records to run instant AI-driven reviews. Visit the main Dashboard page to upload your CSV file.</p>
          </div>
        );
      case 'logs':
        return (
          <div className="flex-1 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Audit Log</h2>
            <div className="rounded-xl glass-card overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-white/5 text-zinc-400 font-semibold">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  <tr>
                    <td className="p-4">2026-06-04 20:47:00</td>
                    <td className="p-4">System connection established</td>
                    <td className="p-4 text-emerald-400">Success</td>
                  </tr>
                  <tr>
                    <td className="p-4">2026-06-04 20:49:15</td>
                    <td className="p-4">Git initialized remote repository</td>
                    <td className="p-4 text-emerald-400">Success</td>
                  </tr>
                  <tr>
                    <td className="p-4">2026-06-04 20:53:22</td>
                    <td className="p-4">MERN stack boilerplate files generated</td>
                    <td className="p-4 text-emerald-400">Success</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <SocketProvider>
      <div className="min-h-screen flex flex-col bg-zinc-950 text-foreground antialiased selection:bg-violet-600/30 selection:text-white">
        {/* Glow gradients behind layouts */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/10 to-indigo-600/0 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 to-violet-500/0 rounded-full blur-3xl pointer-events-none"></div>

        {/* Global Toast Alerts */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#0d111c',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '12px'
            }
          }}
        />

        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}

export default App;
