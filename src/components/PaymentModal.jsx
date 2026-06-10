import React, { useState } from 'react';
import { supabase } from '/src/supabaseClient.js';

export default function PaymentModal({ property, buyerId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const currency = 'TZS';

  // Strict local calculation mapping to the database logic
  const totalAmount = parseFloat(property?.price || 0);
  const platformCommission = totalAmount * 0.02;
  const sellerPayout = totalAmount * 0.98;

  const handleInitiatePayment = async () => {
    // Edge case safety check
    if (!property || !buyerId) {
      alert('Error: Missing structural session configuration or property variables.');
      return;
    }

    try {
      setLoading(true);

      // Generate a mock reference token for the payment gateway handshake
      const trackingReference = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

      // NOTE: Verify if your properties table uses property.seller_id or property.user_id
      const sellerIdentifier = property.seller_id || property.user_id;

      if (!sellerIdentifier) {
        throw new Error('Could not resolve the seller identification token from this listing record.');
      }

      const payload = {
        property_id: Number(property.id),  // Explicitly casting to Number to match your BIGINT constraint fixed earlier
        buyer_id: buyerId,                  // Authenticated Buyer UUID
        seller_id: sellerIdentifier,        // Resolved Seller UUID
        amount_total: totalAmount,          // Raw entry price (trigger handles 2% and 98% split automatically)
        status: 'pending',                  
        payment_reference: trackingReference
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      alert(`Transaction Initiated Successfully!\nReference: ${trackingReference}\n\nRedirecting to secure gateway checkout...`);
      
      if (onSuccess) onSuccess(data);
      
    } catch (err) {
      alert(`Payment Processing System Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.headerRow}>
          <h3 style={styles.title}>Secure Real Estate Escrow</h3>
          <button type="button" onClick={() => onClose && onClose()} style={styles.closeBtn}>✕</button>
        </div>

        <p style={styles.subtitle}>Review transaction terms and platform distribution cuts before moving to the financial network pipelines.</p>

        {/* PROPERTY RECAP */}
        <div style={styles.summaryBox}>
          <div style={styles.summaryLabel}>Property Listing</div>
          <div style={styles.summaryValue}>{property?.title || 'Premium Asset Asset'}</div>
          <div style={styles.summarySub}>📍 {property?.location || 'Unknown Coordinates'}</div>
        </div>

        {/* MATH CALCULATION SPLIT LEDGER */}
        <div style={styles.ledgerContainer}>
          <div style={styles.ledgerRow}>
            <span>Asset Valuation Total</span>
            <span style={styles.boldText}>{currency} {totalAmount.toLocaleString()}</span>
          </div>
          
          <div style={styles.ledgerRow}>
            <span style={styles.goldText}>Platform Commission Fee (2%)</span>
            <span style={styles.goldText}>+ {currency} {platformCommission.toLocaleString()}</span>
          </div>

          <hr style={styles.divider} />

          <div style={styles.ledgerRow}>
            <span style={styles.mutedText}>Net Remittance to Seller (98%)</span>
            <span style={styles.mutedText}>{currency} {sellerPayout.toLocaleString()}</span>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button 
          type="button"
          onClick={handleInitiatePayment} 
          disabled={loading} 
          style={styles.payBtn}
        >
          {loading ? 'Processing Ledger Hold...' : `🔒 Authorize Checkout ${currency} ${totalAmount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

// PREMIUM STYLES MATRIX (Preserving theme and structure perfectly)
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(4, 4, 6, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalCard: {
    background: 'linear-gradient(145deg, #131C30, #0E0E12)',
    border: '1px solid rgba(201, 168, 76, 0.3)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '480px',
    padding: '36px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
    fontFamily: "'Jost', sans-serif",
    color: '#E8DFC8',
    boxSizing: 'border-box'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '26px',
    fontWeight: '600',
    color: '#fff',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8A99B8',
    fontSize: '18px',
    cursor: 'pointer'
  },
  subtitle: {
    fontSize: '12px',
    color: '#8A99B8',
    lineHeight: '1.5',
    margin: '0 0 28px 0'
  },
  summaryBox: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(201, 168, 76, 0.1)',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '24px'
  },
  summaryLabel: {
    fontSize: '10px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#C9A84C',
    marginBottom: '4px'
  },
  summaryValue: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: '500'
  },
  summarySub: {
    fontSize: '12px',
    color: '#8A99B8',
    marginTop: '2px'
  },
  ledgerContainer: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(201, 168, 76, 0.15)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '32px'
  },
  ledgerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    margin: '10px 0'
  },
  boldText: {
    fontWeight: '600',
    color: '#fff'
  },
  goldText: {
    color: '#E8C87A',
    fontWeight: '500'
  },
  mutedText: {
    color: '#8A99B8'
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(201, 168, 76, 0.15)',
    margin: '14px 0'
  },
  payBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #E8C87A, #C9A84C)',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    color: '#0A0F1E',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
