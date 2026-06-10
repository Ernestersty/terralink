import React from 'react';

export default function Property({ item, userRole, onAction }) {
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

        {/* Dynamic Controls based on User Role */}
        <div className="flex gap-2 mt-5">
          {userRole === 'buyer' ? (
            <>
              <button 
                onClick={() => onAction('view', item.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                View Details
              </button>
              <button 
                onClick={() => onAction('offer', item.id)}
                className="border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Make Offer
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
      </div>
    </div>
  );
}