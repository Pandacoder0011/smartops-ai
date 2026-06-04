import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const AnalyticsChart = ({ metrics }) => {
  // Map metrics to a format Recharts can parse
  // Each metric has a trend array. We'll map indices to 'Points'
  const dataPointsCount = Math.max(...metrics.map(m => m.trend?.length || 0), 0);
  
  const chartData = Array.from({ length: dataPointsCount }).map((_, index) => {
    const dataObj = { name: `Period ${index + 1}` };
    metrics.forEach(metric => {
      if (metric.trend && metric.trend[index] !== undefined) {
        dataObj[metric.name] = metric.trend[index];
      }
    });
    return dataObj;
  });

  const colors = [
    { stroke: '#8b5cf6', fill: 'url(#colorViolet)' },
    { stroke: '#06b6d4', fill: 'url(#colorCyan)' },
    { stroke: '#10b981', fill: 'url(#colorGreen)' },
    { stroke: '#f59e0b', fill: 'url(#colorAmber)' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-xl bg-zinc-950/95 border border-white/10 backdrop-blur-md shadow-2xl">
          <p className="text-xs font-bold text-zinc-400 mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.stroke }}></div>
                <span className="text-xs text-zinc-300 font-semibold">{item.name}:</span>
                <span className="text-xs font-bold text-white">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-xl glass-card w-full h-[400px] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Metrics Analytics</h4>
          <p className="text-xs text-zinc-400">Aggregated real-time trends of business indicators</p>
        </div>
      </div>

      <div className="flex-1 w-full h-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorViolet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#71717a" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#71717a" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
            />
            {metrics.map((metric, index) => {
              const colorInfo = colors[index % colors.length];
              return (
                <Area
                  key={metric.name}
                  type="monotone"
                  dataKey={metric.name}
                  stroke={colorInfo.stroke}
                  fillOpacity={1}
                  fill={colorInfo.fill}
                  strokeWidth={2}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
