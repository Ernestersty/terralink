import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { usePwaDownload } from '/src/hooks/usePwaDownload.js';

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSellerId, setCurrentSellerId] = useState(null);
  const { handleDownloadClick, isInstallable } = usePwaDownload();

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        setCurrentSellerId(user.id);
        
        // Fetch seller's properties
        const { data: propsData, error: propsError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (propsError) throw propsError;
        setProperties(propsData || []);

        // Fetch seller's transactions
        const { data: txnData, error: txnError } = await supabase
          .from('transactions')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        
        if (txnError) throw txnError;
        setTransactions(txnData || []);
      }
    } catch (err) {
      console.error('Error fetching seller data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      alert(`Sign Out Exception: ${error.message}`);
    }
  };

  const totalEarnings = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.amount_total) * 0.98), 0);

  const pendingPayments = transactions.filter(t => t.status === 'pending').length;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@200;300;400;500;600;700&display=swap');
          :root {
            --teal: #00C2CB;
            --teal-light: #33d1d8;
            --deep: #0F172A;
            --card: #1E293B;
            --text: #E5E7EB;
            --muted: #9CA3AF;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: var(--deep);
            color: var(--text);
            font-family: 'Inter', sans-serif;
          }
          .seller-dashboard {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
        `
      }} />

      <div className="seller-dashboard">
        {/* HEADER */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(0, 194, 203, 0.2)',
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontFamily: "'Montserrat', sans-serif" }}>🏢 Seller Dashboard</h1>
          </div>
          <button
            onClick={handleDownloadClick}
            style={{
              backgroundColor: 'rgba(0, 194, 203, 0.1)',
              border: '1px dashed var(--teal)',
              color: 'var(--teal-light)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '16px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            📥 Download App
          </button>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            🔒 Log Out
          </button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 194, 203, 0.1)', backgroundColor: 'var(--deep)' }}>
          {['dashboard', 'properties', 'transactions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'rgba(0, 194, 203, 0.15)' : 'transparent',
                color: activeTab === tab ? 'var(--teal)' : 'var(--muted)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '400',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: activeTab === tab ? '2px solid var(--teal)' : 'none',
              }}
            >
              {tab === 'dashboard' && '📊 Overview'}
              {tab === 'properties' && '🏘️ My Properties'}
              {tab === 'transactions' && '💳 Transactions'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(0, 194, 203, 0.2)',
                  borderRadius: '14px',
                  padding: '24px',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Total Earnings</div>
                  <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--teal-light)', fontFamily: "'Montserrat', sans-serif" }}>TZS {totalEarnings.toLocaleString()}</div>
                </div>
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(0, 194, 203, 0.2)',
                  borderRadius: '14px',
                  padding: '24px',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Active Listings</div>
                  <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--teal-light)', fontFamily: "'Montserrat', sans-serif" }}>{properties.length}</div>
                </div>
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(0, 194, 203, 0.2)',
                  borderRadius: '14px',
                  padding: '24px',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Pending Payments</div>
                  <div style={{ fontSize: '28px', fontWeight: '600', color: '#f59e0b', fontFamily: "'Montserrat', sans-serif" }}>{pendingPayments}</div>
                </div>
              </div>
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(0, 194, 203, 0.2)',
                borderRadius: '14px',
                padding: '24px',
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Montserrat', sans-serif" }}>Welcome to Your Seller Account</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}
                >Manage your property listings, track earnings, and monitor transaction status all in one place. Your properties appear in the buyer marketplace and payments are securely held in escrow until property transfer is complete.</p>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <h3 style={{ marginTop: 0, fontFamily: "'Montserrat', sans-serif" }}>Your Listed Properties</h3>
              {loading ? (
                <p>Loading properties...</p>
              ) : properties.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No properties listed yet. Create your first listing!</p>
              ) : (
                <div>
                  {properties.map(prop => (
                    <div key={prop.id} style={{
                      backgroundColor: 'rgba(51, 65, 85, 0.3)',
                      border: '1px solid rgba(0, 194, 203, 0.15)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0' }}>{prop.title}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>📍 {prop.location}</p>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--teal-light)' }}>TZS {Number(prop.price || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 style={{ marginTop: 0, fontFamily: "'Montserrat', sans-serif" }}>Recent Transactions</h3>
              {loading ? (
                <p>Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No transactions yet.</p>
              ) : (
                <div>
                  {transactions.map(txn => (
                    <div key={txn.id} style={{
                      backgroundColor: 'rgba(51, 65, 85, 0.3)',
                      border: '1px solid rgba(0, 194, 203, 0.15)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Ref: {txn.payment_reference}</div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{new Date(txn.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--teal-light)', marginBottom: '4px' }}>TZS {Number(txn.amount_total * 0.98).toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: txn.status === 'completed' ? '#10b981' : '#f59e0b', fontWeight: '600', textTransform: 'capitalize' }}>{txn.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
