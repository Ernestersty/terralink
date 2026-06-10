import React from 'react';

export default function AnalyticsChart({ title, data = [] }) {
  // Fallback sample data if none is provided: monthly 2% commission totals
  const chartData = data.length > 0 ? data : [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 65 },
    { label: 'Mar', value: 55 },
    { label: 'Apr', value: 85 },
    { label: 'May', value: 70 },
    { label: 'Jun', value: 95 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title || "Commission Performance Trend"}</h3>
        <span className="text-xs text-gray-400">Values in Millions (TZS)</span>
      </div>

      {/* Responsive SVG Chart Grid */}
      <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-gray-100">
        {chartData.map((item, idx) => {
          // Calculate height percentage smoothly relative to max value
          const heightPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
              {/* Tooltip on hover */}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-1.5 py-0.5 mb-1 absolute transform -translate-y-12 duration-200">
                {item.value}M
              </span>
              
              {/* Bar */}
              <div 
                style={{ height: `${heightPct}%` }}
                className="w-full bg-blue-600 group-hover:bg-green-600 rounded-t-md transition-all duration-500 ease-out min-h-[4px]"
              />
              
              {/* Label */}
              <span className="text-xs text-gray-400 mt-2 font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}