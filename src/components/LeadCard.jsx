import React from 'react';

export default function LeadCard({ lead, onContact }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-green-100 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold">
            {lead.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{lead.name}</h4>
            <p className="text-xs text-gray-500">{lead.email}</p>
          </div>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
          {lead.status || 'New'}
        </span>
      </div>

      <div className="border-t border-gray-50 pt-3 mt-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Interested In</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{lead.propertyTitle}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button 
          onClick={() => onContact(lead)}
          className="w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Contact Buyer
        </button>
      </div>
    </div>
  );
}