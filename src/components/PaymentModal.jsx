import React, { useState } from 'react';

export default function PaymentModal({ property, buyerId, onClose, onSuccess }) {
  const [step, setStep] = useState('review');   // 'review' | 'payment' | 'pending'
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currency = 'TZS';

  const displayAmount = parseFloat(property?.price || 0);
  const platformCommission = displayAmount * 0.02;
  const sellerPayout = displayAmount * 0.98;

  const isMobileMoney = ['mpesa', 'airtel', 'tigo'].includes(paymentMethod);

  const paymentMethods = [
    { value: 'mpesa',  label: 'M-Pesa',       sub: 'Mobile Money', icon: '📱' },
    { value: 'airtel', label: 'Airtel Money',  sub: 'Mobile Money', icon: '📱' },
    { value: 'tigo',   label: 'Tigo Pesa',     sub: 'Mobile Money', icon: '📱' },
    { value: 'card',   label: 'Card',          sub: 'Visa / Mastercard', icon: '💳' },
    { value: 'bank',   label: 'Bank Transfer', sub: 'Escrow Account', icon: '🏦' },
  ];

  const validatePhone = (value) => {
    const digits = value.replace(/^\+/, '');
    return /^255\d{9}$/.test(digits) || /^0\d{9}$/.test(digits);
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value.replace(/[^\d+]/g, ''));
    if (error) setError(null);
  };

  const handleMethodChange = (value) => {
    setPaymentMethod(value);
    setError(null);
  };

  const handleSubmitPayment = async () => {
    if (!property || !buyerId) {
      setError('Missing session or property information. Please refresh and try again.');
      return;
    }

    if (isMobileMoney) {
      if (!phoneNumber) {
        setError('Please enter your mobile money phone number.');
        return;
      }
      if (!validatePhone(phoneNumber)) {
        setError('Enter a valid Tanzanian number — e.g. 255712345678 or 0712345678.');
        return;
      }
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
          paymentMethod,
          phoneNumber: isMobileMoney ? phoneNumber : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed.');
      }

      setStep('pending');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step: Pending confirmation screen ──────────────────────────────
  if (step === 'pending') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modalCard}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🕐</div>
            <h3 style={{ ...styles.title, fontSize: '22px', marginBottom: '12px' }}>
              Offer Recorded
            </h3>
            <p style={{ ...styles.subtitle, marginBottom: '24px' }}>
              Your offer has been logged and is awaiting payment confirmation.
              {isMobileMoney && ' Check your handset for a PIN prompt once the payment provider is connected.'}
            </p>
            <div style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '12px',
              color: '#C9A84C',
              marginBottom: '28px',
              textAlign: 'left',
              lineHeight: '1.6'
            }}>
              ⚠️ No funds have been moved yet. Payment processing will be enabled once the Selcom merchant integration is live.
            </div>
            <button
              type="button"
              onClick={() => { if (onClose) onClose(); }}
              style={styles.payBtn}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Payment method + phone input ────────────────────────────
  if (step === 'payment') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modalCard}>
          <div style={styles.headerRow}>
            <h3 style={styles.title}>💳 Payment Method</h3>
            <button type="button" onClick={() => onClose && onClose()} style={styles.closeBtn}>✕</button>
          </div>

          <p style={styles.subtitle}>
            Choose how you'd like to complete this transaction.
          </p>

          {/* Amount reminder */}
          <div style={{ ...styles.summaryBox, marginBottom: '20px' }}>
            <div style={styles.summaryLabel}>Amount Due</div>
            <div style={{ ...styles.summaryValue, color: '#E8C87A', fontSize: '20px' }}>
              {currency} {displayAmount.toLocaleString()}
            </div>
          </div>

          {/* Payment method cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '8px',
            marginBottom: '20px'
          }}>
            {paymentMethods.map((m) => (
              <button
                type="button"
                key={m.value}
                onClick={() => handleMethodChange(m.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '12px 8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === m.value ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${paymentMethod === m.value ? '#C9A84C' : 'rgba(201,168,76,0.1)'}`,
                  color: paymentMethod === m.value ? '#E8C87A' : '#8A99B8',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Jost', sans-serif",
                }}
              >
                <span style={{ fontSize: '20px' }}>{m.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>{m.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.75, textAlign: 'center' }}>{m.sub}</span>
              </button>
            ))}
          </div>

          {/* Phone number input for mobile money */}
          {isMobileMoney && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#C9A84C',
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Mobile Wallet Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 255712345678"
                value={phoneNumber}
                onChange={handlePhoneChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  border: '1px solid rgba(201,168,76,0.15)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: "'Jost', sans-serif",
                }}
              />
              <p style={{ fontSize: '11px', color: '#8A99B8', margin: '6px 0 0 0' }}>
                Format: 255XXXXXXXXX or 0XXXXXXXXX
              </p>
            </div>
          )}

          {/* Card / Bank info note */}
          {(paymentMethod === 'card' || paymentMethod === 'bank') && (
            <p style={{
              fontSize: '12px',
              color: '#8A99B8',
              background: 'rgba(0,0,0,0.2)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(201,168,76,0.1)',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              {paymentMethod === 'card'
                ? '💳 You will be redirected to a secure card clearing gateway upon confirmation.'
                : '🏦 Escrow bank account details will be provided upon confirmation.'}
            </p>
          )}

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => { setStep('review'); setError(null); }}
              style={{
                flex: '0 0 auto',
                padding: '14px 20px',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '12px',
                color: '#8A99B8',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: "'Jost', sans-serif",
              }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmitPayment}
              disabled={loading}
              style={{
                ...styles.payBtn,
                flex: 1,
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading && (
                <span style={{
                  width: '13px',
                  height: '13px',
                  border: '2px solid #0A0F1E',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
              {loading ? 'Authorizing...' : 'Authorize Payment'}
            </button>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  // ── Step: Review (default) ─────────────────────────────────────────
  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.headerRow}>
          <h3 style={styles.title}>💰 Secure Offer</h3>
          <button type="button" onClick={() => onClose && onClose()} style={styles.closeBtn}>✕</button>
        </div>

        <p style={styles.subtitle}>
          Review transaction terms and confirm your secure offer before moving to payment.
        </p>

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

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <button
          type="button"
          onClick={() => setStep('payment')}
          style={styles.payBtn}
        >
          Continue to Payment →
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
  boldText: { fontWeight: '600', color: '#fff' },
  goldText: { color: '#E8C87A', fontWeight: '500' },
  mutedText: { color: '#8A99B8' },
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