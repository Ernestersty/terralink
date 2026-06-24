import React, { useState } from 'react';

export default function PaymentCheckout({ propertyId, amount, onPaymentInitiated }) {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (['mpesa', 'airtel', 'tigo'].includes(paymentMethod) && !phoneNumber) {
      setError('Please enter your mobile money phone number.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          amount,
          paymentMethod,
          phoneNumber: paymentMethod !== 'card' && paymentMethod !== 'bank' ? phoneNumber : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed.');
      }

      if (onPaymentInitiated) {
        onPaymentInitiated(data);
      }
      
      alert('Secure transaction initiated. Please check your handset for your secure PIN prompt.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Theme Styling Configuration Constants
  const colors = {
    luxuryBlack: '#111111',
    deepObsidian: '#1a1a1a',
    premiumGold: '#D4AF37',
    goldHover: '#AA841B',
    mutedText: '#aaaaaa',
    borderDark: '#2d2d2d',
    cardBackground: '#161616'
  };

  return (
    <div style={{ 
      maxWidth: '460px', 
      margin: '30px auto', 
      padding: '30px', 
      backgroundColor: colors.cardBackground,
      border: `1px solid ${colors.premiumGold}`, 
      borderRadius: '12px', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      color: '#ffffff',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: colors.premiumGold, 
          letterSpacing: '1px', 
          textTransform: 'uppercase',
          fontSize: '22px'
        }}>
          Terra Link Secure Checkout
        </h3>
        <p style={{ color: colors.mutedText, margin: 0, fontSize: '14px' }}>Premium Escrow & Payment Portal</p>
      </div>

      <div style={{ 
        backgroundColor: colors.deepObsidian, 
        padding: '15px', 
        borderRadius: '6px', 
        textAlign: 'center', 
        marginBottom: '25px',
        border: `1px solid ${colors.borderDark}`
      }}>
        <span style={{ fontSize: '13px', textTransform: 'uppercase', color: colors.mutedText, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>Amount Due</span>
        <strong style={{ fontSize: '24px', color: colors.premiumGold }}>{amount} TZS</strong>
      </div>
      
      {error && (
        <div style={{ 
          color: '#ff6b6b', 
          backgroundColor: 'rgba(255,107,107,0.1)', 
          padding: '10px 12px', 
          borderRadius: '4px', 
          marginBottom: '15px', 
          fontSize: '14px',
          borderLeft: '3px solid #ff6b6b'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.premiumGold, fontSize: '14px', fontWeight: '6px', letterSpacing: '0.5px' }}>Select Preferred Payment Chanel</label>
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              backgroundColor: colors.deepObsidian, 
              color: '#ffffff',
              border: `1px solid ${colors.borderDark}`,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="mpesa">M-Pesa (Mobile Money)</option>
            <option value="airtel">Airtel Money (Mobile Money)</option>
            <option value="tigo">Tigo Pesa (Mobile Money)</option>
            <option value="card">Credit / Debit Card (Visa or Mastercard)</option>
            <option value="bank">Bank Wire Transfer / Legal Escrow Account</option>
          </select>
        </div>

        {['mpesa', 'airtel', 'tigo'].includes(paymentMethod) && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: colors.premiumGold, fontSize: '14px', letterSpacing: '0.5px' }}>Mobile Wallet Phone Number</label>
            <input 
              type="tel" 
              placeholder="e.g., 255712345678" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '6px', 
                backgroundColor: colors.deepObsidian, 
                color: '#ffffff',
                border: `1px solid ${colors.borderDark}`,
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
        )}

        {(paymentMethod === 'card' || paymentMethod === 'bank') && (
          <p style={{ 
            fontSize: '13px', 
            color: colors.mutedText, 
            backgroundColor: colors.deepObsidian, 
            padding: '12px', 
            borderRadius: '6px', 
            border: `1px solid ${colors.borderDark}`,
            lineHeight: '1.5',
            marginBottom: '25px'
          }}>
            {paymentMethod === 'card' ? '💳 Secure redirection to encoded clearing services will process upon validation.' : '🏦 Elite legal escrow bank parameters will compile dynamically for routing.'}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            backgroundColor: loading ? '#333' : colors.premiumGold, 
            color: loading ? colors.mutedText : colors.luxuryBlack, 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            fontSize: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => { if(!loading) e.currentTarget.style.backgroundColor = colors.goldHover; }}
          onMouseOut={(e) => { if(!loading) e.currentTarget.style.backgroundColor = colors.premiumGold; }}
        >
          {loading ? 'Authorizing Assets...' : 'Authorize Secured Payment'}
        </button>
      </form>
    </div>
  );
}