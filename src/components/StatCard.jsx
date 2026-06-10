import React from 'react';

export default function StatCard({ title, value, icon, change, isPositive }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="flex items-center mt-4 text-sm">
          <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
}