import React, { useState } from 'react';

export default function PaymentModal({ property, buyerId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currency = 'TZS';

  // Displayed amount comes from the property record for the UI preview only.
  // The server will independently verify this against the real listing price —
  // this client-side number is never trusted for the actual transaction.
  const displayAmount = parseFloat(property?.price || 0);
  const platformCommission = displayAmount * 0.02;
  const sellerPayout = displayAmount * 0.98;

  const handleInitiatePayment = async () => {
    if (!property || !buyerId) {
      setError('Missing session or property information. Please refresh and try again.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          amount: displayAmount,
          paymentMethod: 'bank', // default channel; swap to a real selector once mobile money UI is wired in
          phoneNumber: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed.');
      }

      // Server returns status: "pending" — no payment provider is connected yet,
      // so this is recorded but NOT paid. Don't tell the user it's "successful."
      if (onSuccess) onSuccess(data);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.headerRow}>
          <h3 style={styles.title}>💰 Secure Offer</h3>
          <button type="button" onClick={() => onClose && onClose()} style={styles.closeBtn}>✕</button>
        </div>

        <p style={styles.subtitle}>Review transaction terms and confirm your secure offer before moving to payment.</p>

        <div style={styles.summaryBox}>
          <div style={styles.summaryLabel}>Property</div>
          <div style={styles.summaryValue}>{property?.title || 'Premium Asset'}</div>
          <div style={styles.summarySub}>📍 {property?.location || 'Unknown Location'}</div>
        </div>

        <div style={styles.ledgerContainer}>
          <div style={styles.ledgerRow}>
            <span>Offer Amount</span>
            <span style={styles.boldText}>{currency} {displayAmount.toLocaleString()}</span>
          </div>

          <div style={styles.ledgerRow}>
            <span style={styles.goldText}>Platform Security Fee (2%)</span>
            <span style={styles.goldText}>+ {currency} {platformCommission.toLocaleString()}</span>
          </div>

          <hr style={styles.divider} />

          <div style={styles.ledgerRow}>
            <span style={styles.mutedText}>Seller Receives (98%)</span>
            <span style={styles.mutedText}>{currency} {sellerPayout.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>⚠️ {error}</div>
        )}

        <button 
          type="button"
          onClick={handleInitiatePayment} 
          disabled={loading} 
          style={styles.payBtn}
        >
          {loading ? 'Processing...' : `✓ Confirm Secure Offer - ${currency} ${displayAmount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

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
  errorBox: {
    color: '#ff8585',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    borderLeft: '3px solid #ff6b6b'
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