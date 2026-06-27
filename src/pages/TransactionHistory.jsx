import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUserAndTransactions();
  }, []);

  const fetchUserAndTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@200;300;400;500;600;700&display=swap');
        `
      }} />

      <div style={styles.header}>
        <h2 style={styles.title}>💳 Transaction History</h2>
        <p style={styles.subtitle}>View all your payments and financial activities</p>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div style={styles.emptyBox}>
          <p>No transactions found. Start by making a payment on a property listing.</p>
        </div>
      ) : (
        <div style={styles.transactionList}>
          {transactions.map((txn) => (
            <div key={txn.id} style={styles.transactionCard}>
              <div style={styles.txnLeft}>
                <div style={styles.txnIcon}>💰</div>
                <div>
                  <div style={styles.txnRef}>Reference: {txn.payment_reference}</div>
                  <div style={styles.txnAmount}>TZS {Number(txn.amount_total || 0).toLocaleString()}</div>
                  <div style={styles.txnDate}>{new Date(txn.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{
                ...styles.txnStatus,
                backgroundColor: `${getStatusColor(txn.status)}20`,
                borderLeft: `3px solid ${getStatusColor(txn.status)}`
              }}>
                <span style={{ color: getStatusColor(txn.status), fontWeight: '600', textTransform: 'capitalize' }}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: "'Inter', sans-serif",
    color: '#E5E7EB',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    fontFamily: "'Montserrat', sans-serif",
    color: '#fff',
  },
  subtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
    margin: 0,
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px',
    color: '#9CA3AF',
    fontSize: '16px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '60px 40px',
    backgroundColor: 'rgba(0, 194, 203, 0.05)',
    border: '1px solid rgba(0, 194, 203, 0.2)',
    borderRadius: '16px',
    color: '#9CA3AF',
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  transactionCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(0, 194, 203, 0.15)',
    borderRadius: '14px',
    padding: '20px',
    boxSizing: 'border-box',
  },
  txnLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  txnIcon: {
    fontSize: '28px',
    minWidth: '40px',
    textAlign: 'center',
  },
  txnRef: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginBottom: '4px',
  },
  txnAmount: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#00C2CB',
    marginBottom: '4px',
  },
  txnDate: {
    fontSize: '13px',
    color: '#6B7280',
  },
  txnStatus: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
};
