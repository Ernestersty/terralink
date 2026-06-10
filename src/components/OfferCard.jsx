import React from 'react';

export default function OfferCard({ offer, onAccept, onReject }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Incoming Offer
          </span>
          <h4 className="text-lg font-bold text-gray-900 mt-2">{offer.propertyTitle}</h4>
          <p className="text-sm text-gray-500">From: {offer.buyerName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase">Offer Amount</p>
          <p className="text-xl font-extrabold text-green-700">TZS {offer.amount}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
        <p><strong>Notes:</strong> {offer.notes || "No special conditions attached to this offer."}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onAccept(offer.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          Accept Offer
        </button>
        <button
          onClick={() => onReject(offer.id)}
          className="flex-1 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 font-medium py-2 rounded-lg text-sm transition-all"
        >
          Decline
        </button>
      </div>
    </div>
  );
}