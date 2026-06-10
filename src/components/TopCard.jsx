import React from 'react';

export default function TopCard({ userRole, userName, actionCount }) {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {userName || 'User'}!
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Here is what's happening with your Terralink {userRole === 'seller' ? 'listings' : 'purchases'} today.
          </p>
        </div>
        
        {actionCount > 0 && (
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-sm font-semibold flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            You have {actionCount} pending updates
          </div>
        )}
      </div>
    </div>
  );
}