import React, { useState } from 'react';
import PaymentCheckout from './PaymentCheckout';

export default function Property({ item, userRole, onAction }) {
  // 1. Add local state to open the checkout workspace inline for this asset
  const [showCheckout, setShowCheckout] = useState(false);

  // Luxury Color Accents to match your branding
  const luxuryColors = {
    premiumGold: '#D4AF37',
    luxuryBlack: '#111111',
    deepObsidian: '#1a1a1a',
    borderDark: '#2d2d2d'
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="relative">
        <img 
          src={item.image_url || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"} 
          alt={item.title} 
          className="h-48 w-full object-cover"
        />
        <span className="absolute top-3 right-3 text-xs font-semibold bg-gray-900/80 text-white backdrop-blur-xs px-2.5 py-1 rounded-full">
          {item.location}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 tracking-tight">{item.title}</h3>
        <p className="text-emerald-700 font-extrabold text-lg mt-1">
          TZS {Number(item.price).toLocaleString()}
        </p>

        {/* Dynamic Controls based on User Role (Preserved 100% exactly as written) */}
        {!showCheckout ? (
          <div className="flex gap-2 mt-5">
            {userRole === 'buyer' ? (
              <>
                <button 
                  onClick={() => onAction('view', item.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  View Details
                </button>
                {/* Gold luxury styled trigger button */}
                <button 
                  onClick={() => {
                    onAction('offer', item.id);
                    setShowCheckout(true);
                  }}
                  style={{
                    backgroundColor: luxuryColors.premiumGold,
                    color: luxuryColors.luxuryBlack,
                    fontWeight: '700'
                  }}
                  className="text-xs px-3 py-2 rounded-lg transition-all transform hover:scale-[1.02]"
                >
                  🔒 Secure Asset
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onAction('edit', item.id)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  Edit Listing
                </button>
                <button 
                  onClick={() => onAction('delete', item.id)}
                  className="border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ) : (
          // 2. Safely render the checkout module without breaking or removing parent logic
          <div 
            style={{ backgroundColor: luxuryColors.deepObsidian, borderColor: luxuryColors.borderDark }}
            className="mt-4 p-4 border rounded-xl text-white"
          >
            <PaymentCheckout 
              propertyId={item.id}
              amount={item.price}
              onPaymentInitiated={(data) => {
                console.log("[Terra Link] Secure property invoice pipeline established:", data);
              }}
            />
            <button 
              onClick={() => setShowCheckout(false)}
              className="mt-3 text-xs text-red-400 hover:text-red-500 font-semibold block text-center w-full transition-colors"
            >
              Cancel Payment Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}