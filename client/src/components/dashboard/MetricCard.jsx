import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';

const MetricCard = ({ metric }) => {
  const { name, value, change, unit, trend } = metric;
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  const isPositive = change >= 0;

  // Format value
  const formattedValue = unit === '$' 
    ? `$${value.toLocaleString()}` 
    : `${value.toLocaleString()}${unit}`;

  return (
    <div className={`p-6 rounded-xl glass-card transition-all duration-500 relative overflow-hidden ${
      isUpdating ? 'border-violet-500/50 shadow-md shadow-violet-500/10' : ''
    }`}>
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{name}</p>
          <h3 className="text-3xl font-bold mt-2 text-white transition-all duration-300">
            {formattedValue}
          </h3>
        </div>

        {/* Change indicator badge */}
        <div className={`flex items-center space-x-0.5 px-2 py-1 rounded-lg text-xs font-medium ${
          isPositive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>

      {/* Mini sparkline visualization */}
      {trend && trend.length > 0 && (
        <div className="mt-6 h-10 w-full flex items-end space-x-1">
          {trend.map((val, idx) => {
            const min = Math.min(...trend);
            const max = Math.max(...trend);
            const range = max - min || 1;
            const percentage = ((val - min) / range) * 100;
            const height = Math.max(15, percentage);
            return (
              <div 
                key={idx}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-600/40 to-violet-400 transition-all duration-500 hover:opacity-85"
                style={{ height: `${height}%` }}
                title={`Value: ${val}`}
              ></div>
            );
          })}
        </div>
      )}

      {/* Real-time sync blink dot */}
      {isUpdating && (
        <span className="absolute bottom-3 right-3 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
        </span>
      )}
    </div>
  );
};

export default MetricCard;
