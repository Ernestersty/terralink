import React, { useState } from 'react';
import PaymentCheckout from './PaymentCheckout';

export default function OfferCard({ offer, onAccept, onReject }) {
  // 1. Add state to toggle the payment checkout view safely
  const [showPayment, setShowPayment] = useState(false);

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

      {/* 2. Toggle button display or payment gateway based on showPayment state */}
      {!showPayment ? (
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Fire original function tracking hook
              onAccept(offer.id);
              // Open up our payment flow
              setShowPayment(true);
            }}
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
      ) : (
        // 3. Render payment flow smoothly within the layout card without removing core data structures
        <div className="mt-4 pt-4 border-t border-gray-100">
          <PaymentCheckout 
            propertyId={offer.propertyId || offer.id} 
            amount={offer.amount}
            onPaymentInitiated={(data) => {
              console.log("[Terra Link App] Offer payment synchronized successfully:", data);
            }}
          />
          <button 
            onClick={() => setShowPayment(false)}
            className="mt-3 text-xs font-semibold text-red-500 hover:text-red-700 block text-right w-full transition-colors"
          >
            Cancel Transaction Process
          </button>
        </div>
      )}
    </div>
  );
}