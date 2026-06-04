import React, { useState } from 'react';
import useMetrics from '../hooks/useMetrics';
import MetricCard from '../components/dashboard/MetricCard';
import AnalyticsChart from '../components/charts/AnalyticsChart';
import ChatWidget from '../components/ai-agent/ChatWidget';
import { 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  CloudLightning, 
  Database, 
  FileSpreadsheet, 
  UploadCloud 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardService } from '../services/api';

const Dashboard = () => {
  const { metrics, loading, refetch } = useMetrics();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Handle CSV file selection and submission
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a valid CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const response = await dashboardService.uploadCSV(selectedFile);
      if (response.success) {
        toast.success(response.message || 'Dataset imported successfully!');
        setSelectedFile(null);
        // Refresh metrics
        refetch();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-950/40">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Operational Dashboard
          </h2>
          <p className="text-sm text-zinc-400">Welcome back! Here is your business analysis overview.</p>
        </div>
        
        {/* Quick system check */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300">
          <Database className="w-4 h-4 text-violet-400" />
          <span>MongoDB Status:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            Connected <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-900/40 border border-white/5 animate-pulse"></div>
          ))}
        </div>
      ) : (
        /* Metrics grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.name} metric={metric} />
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Charts & Import */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Analytics Chart */}
          {!loading && metrics.length > 0 && (
            <AnalyticsChart metrics={metrics} />
          )}

          {/* Import Datasets Panel */}
          <div className="p-6 rounded-xl glass-card space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" /> Import New Dataset
              </h4>
              <p className="text-xs text-zinc-400 mt-1">Upload a CSV file containing columns: `name, value, unit, category` to update or create dashboard stats.</p>
            </div>

            <div className="border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-950/20 text-center hover:bg-zinc-900/10 transition-all relative">
              <input 
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <UploadCloud className="w-10 h-10 text-zinc-500 mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-semibold text-violet-400">{selectedFile.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-zinc-300">Click or drag CSV here to upload</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Accepts CSV files up to 5MB</p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-xs font-semibold text-white flex items-center gap-2"
                >
                  {uploading ? 'Processing...' : 'Start Import'}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: AI Chat widget */}
        <div className="lg:col-span-1">
          <ChatWidget />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
