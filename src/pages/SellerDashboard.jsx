import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { usePwaDownload } from '/src/hooks/usePwaDownload.js';

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSellerId, setCurrentSellerId] = useState(null);
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [newProperty, setNewProperty] = useState({
    title: '', location: '', price: '', description: '', image: null, lat: null, lng: null
  });

  // ── Map location state ───────────────────────────────────────────
  const [pendingLat, setPendingLat] = useState(null);   // clicked but not yet saved
  const [pendingLng, setPendingLng] = useState(null);
  const [locationSaved, setLocationSaved] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMsg, setLocationMsg] = useState(null); // { type: 'success'|'error'|'info', text }

  // ── Payout method state ──────────────────────────────────────────
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(null);
  const [payoutError, setPayoutError] = useState(null);
  const [payoutType, setPayoutType] = useState('mpesa');
  const [payoutForm, setPayoutForm] = useState({
    phone: '', bankName: '', accountName: '', accountNumber: '', swiftCode: '',
  });

  const { handleDownloadClick } = usePwaDownload();
  const isMobileMoney = ['mpesa', 'airtel', 'tigo'].includes(payoutType);

  const payoutOptions = [
    { value: 'mpesa',  label: 'M-Pesa',      sub: 'Vodacom',       badgeBg: '#CC0000', badgeColor: '#fff',    badgeText: 'M-PESA' },
    { value: 'airtel', label: 'Airtel Money', sub: 'Airtel',        badgeBg: '#E40000', badgeColor: '#fff',    badgeText: 'AIRTEL' },
    { value: 'tigo',   label: 'Tigo Pesa',    sub: 'Mixx/Yas',      badgeBg: '#FFD700', badgeColor: '#003087', badgeText: 'MIXX'   },
    { value: 'bank',   label: 'Bank Account', sub: 'Wire / Escrow', badgeBg: null,      badgeColor: null,      badgeText: 'BANK'   },
  ];

  useEffect(() => {
    fetchSellerData();
    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (activeTab === 'payout' && currentSellerId) fetchPayoutMethods();
  }, [activeTab, currentSellerId]);

  function loadGoogleMapsScript() {
    if (window.google && window.google.maps) { setMapLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?v=weekly&libraries=geocoding&key=';
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
  }

  // ── Drop a marker on the map at given coords (pending state) ────
  function dropPendingMarker(lat, lng) {
    if (!window.sellerMapInstance) return;
    if (window.sellerMarker) window.sellerMarker.setMap(null);
    window.sellerMarker = new window.google.maps.Marker({
      position: { lat, lng },
      map: window.sellerMapInstance,
      title: 'Property Location',
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      animation: window.google.maps.Animation.DROP,
    });
    window.sellerMapInstance.panTo({ lat, lng });
    setPendingLat(lat);
    setPendingLng(lng);
    setLocationSaved(false);
    setLocationMsg({ type: 'info', text: 'Pin placed. Click "Save Location" to confirm.' });
  }

  useEffect(() => {
    if (showCreateProperty && mapLoaded) {
      setTimeout(() => {
        const mapContainer = document.getElementById('property-location-map');
        if (mapContainer && window.google?.maps && !window.sellerMapInstance) {
          window.sellerMapInstance = new window.google.maps.Map(mapContainer, {
            center: { lat: -6.7924, lng: 39.2083 },
            zoom: 12,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          });
          window.sellerMapInstance.addListener('click', (e) => {
            dropPendingMarker(e.latLng.lat(), e.latLng.lng());
          });
        }
      }, 100);
    }
  }, [showCreateProperty, mapLoaded]);

  // ── Save Location button handler ─────────────────────────────────
  function handleSaveLocation() {
    if (pendingLat === null || pendingLng === null) return;
    setNewProperty(prev => ({ ...prev, lat: pendingLat, lng: pendingLng }));
    setLocationSaved(true);
    setLocationMsg({ type: 'success', text: `Location saved — Lat ${pendingLat.toFixed(5)}, Lng ${pendingLng.toFixed(5)}` });

    // Change marker to green to confirm saved state
    if (window.sellerMarker) {
      window.sellerMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
    }
  }

  // ── Auto-detect location (GPS → geocoding fallback) ──────────────
  async function handleDetectLocation() {
    setDetectingLocation(true);
    setLocationMsg({ type: 'info', text: 'Detecting your location...' });

    // Step 1: Try GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDetectingLocation(false);
          dropPendingMarker(lat, lng);
          setLocationMsg({ type: 'info', text: '📍 GPS location detected. Click "Save Location" to confirm.' });
        },
        async () => {
          // GPS denied or failed — fall back to geocoding
          setLocationMsg({ type: 'info', text: 'GPS unavailable. Trying location name...' });
          await geocodeFromName();
        },
        { timeout: 8000 }
      );
    } else {
      // Browser doesn't support geolocation — go straight to geocoding
      await geocodeFromName();
    }
  }

  // ── Geocode the typed location name using Google Maps Geocoding ──
  async function geocodeFromName() {
    const locationName = newProperty.location?.trim();
    if (!locationName) {
      setDetectingLocation(false);
      setLocationMsg({ type: 'error', text: 'Please type a location name first so we can find it on the map.' });
      return;
    }

    try {
      if (!window.google?.maps) throw new Error('Maps not loaded');
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address: `${locationName}, Tanzania` },
        (results, status) => {
          setDetectingLocation(false);
          if (status === 'OK' && results[0]) {
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            dropPendingMarker(lat, lng);
            setLocationMsg({ type: 'info', text: `📍 Found "${results[0].formatted_address}". Click "Save Location" to confirm.` });
          } else {
            setLocationMsg({ type: 'error', text: `Could not find "${locationName}" on the map. Try a more specific name or click manually.` });
          }
        }
      );
    } catch {
      setDetectingLocation(false);
      setLocationMsg({ type: 'error', text: 'Location detection failed. Please click on the map manually.' });
    }
  }

  async function fetchSellerData() {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        setCurrentSellerId(user.id);
        const { data: propsData, error: propsError } = await supabase
          .from('properties').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (propsError) throw propsError;
        setProperties(propsData || []);
        const { data: txnData, error: txnError } = await supabase
          .from('transactions').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
        if (txnError) throw txnError;
        setTransactions(txnData || []);
      }
    } catch (err) {
      console.error('Error fetching seller data:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayoutMethods() {
    try {
      setPayoutLoading(true);
      const { data, error } = await supabase
        .from('seller_payout_methods').select('*').eq('seller_id', currentSellerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayoutMethods(data || []);
    } catch (err) {
      console.error('Error fetching payout methods:', err.message);
    } finally {
      setPayoutLoading(false);
    }
  }

  async function handleSavePayoutMethod() {
    setPayoutError(null);
    setPayoutSuccess(null);
    if (isMobileMoney && !payoutForm.phone) { setPayoutError('Please enter your mobile wallet phone number.'); return; }
    const digits = payoutForm.phone.replace(/^\+/, '');
    if (isMobileMoney && !/^255\d{9}$/.test(digits) && !/^0\d{9}$/.test(digits)) {
      setPayoutError('Enter a valid Tanzanian number — e.g. 255712345678 or 0712345678.'); return;
    }
    if (!isMobileMoney && (!payoutForm.bankName || !payoutForm.accountName || !payoutForm.accountNumber)) {
      setPayoutError('Please fill in all bank account fields.'); return;
    }
    try {
      setPayoutLoading(true);
      const { error } = await supabase.from('seller_payout_methods').insert([{
        seller_id: currentSellerId, method_type: payoutType,
        phone_number: isMobileMoney ? payoutForm.phone : null,
        bank_name: !isMobileMoney ? payoutForm.bankName : null,
        account_name: !isMobileMoney ? payoutForm.accountName : null,
        account_number: !isMobileMoney ? payoutForm.accountNumber : null,
        swift_code: !isMobileMoney ? payoutForm.swiftCode : null,
        is_primary: payoutMethods.length === 0,
      }]);
      if (error) throw error;
      setPayoutSuccess('Payout method saved successfully.');
      setPayoutForm({ phone: '', bankName: '', accountName: '', accountNumber: '', swiftCode: '' });
      fetchPayoutMethods();
    } catch (err) {
      setPayoutError(err.message || 'Failed to save payout method.');
    } finally {
      setPayoutLoading(false);
    }
  }

  async function handleDeletePayoutMethod(id) {
    try {
      const { error } = await supabase.from('seller_payout_methods').delete().eq('id', id);
      if (error) throw error;
      fetchPayoutMethods();
    } catch (err) { alert('Error deleting payout method: ' + err.message); }
  }

  async function handleSetPrimary(id) {
    try {
      await supabase.from('seller_payout_methods').update({ is_primary: false }).eq('seller_id', currentSellerId);
      await supabase.from('seller_payout_methods').update({ is_primary: true }).eq('id', id);
      fetchPayoutMethods();
    } catch (err) { alert('Error updating primary method: ' + err.message); }
  }

  const handleImageUpload = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('property_images').upload(`${currentSellerId}/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('property_images').getPublicUrl(`${currentSellerId}/${fileName}`);
      return publicUrl;
    } catch (err) { alert('Error uploading image: ' + err.message); return null; }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    if (!newProperty.title || !newProperty.location || !newProperty.price) {
      alert('Please fill in all required fields.'); return;
    }
    if (!newProperty.lat || !newProperty.lng) {
      alert('Please set and save the property location on the map before listing.'); return;
    }
    if (!locationSaved) {
      alert('You placed a pin but haven\'t saved it yet. Click "Save Location" first.'); return;
    }
    try {
      let imageUrl = null;
      if (newProperty.image) imageUrl = await handleImageUpload(newProperty.image);
      const { error } = await supabase.from('properties').insert([{
        title: newProperty.title, location: newProperty.location,
        price: parseFloat(newProperty.price), description: newProperty.description || '',
        image_url: imageUrl, user_id: currentSellerId, lat: newProperty.lat, lng: newProperty.lng
      }]);
      if (error) throw error;
      alert('✓ Property listed with location marker!');
      setNewProperty({ title: '', location: '', price: '', description: '', image: null, lat: null, lng: null });
      setPendingLat(null); setPendingLng(null);
      setLocationSaved(false); setLocationMsg(null);
      setShowCreateProperty(false);
      window.sellerMapInstance = null;
      if (window.sellerMarker) window.sellerMarker.setMap(null);
      fetchSellerData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) { alert(`Sign Out Exception: ${error.message}`); }
  };

  const totalEarnings = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + (Number(t.amount_total) * 0.98), 0);
  const pendingPayments = transactions.filter(t => t.status === 'pending').length;

  const navTabs = [
    { key: 'dashboard',    icon: '📊', label: 'Overview' },
    { key: 'properties',   icon: '🏠', label: 'Properties' },
    { key: 'transactions', icon: '💳', label: 'Transactions' },
    { key: 'payout',       icon: '🏦', label: 'Payout' },
  ];

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(201,168,76,0.2)', backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#E8DFC8', boxSizing: 'border-box', outline: 'none',
    fontSize: '14px', fontFamily: "'Jost', sans-serif",
  };

  const labelStyle = {
    display: 'block', marginBottom: '8px', color: '#C9A84C',
    fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
  };

  const msgColors = {
    success: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#10b981' },
    error:   { color: '#ff8585', bg: 'rgba(255,107,107,0.1)', border: '#ff6b6b' },
    info:    { color: '#E8C87A', bg: 'rgba(201,168,76,0.08)', border: '#C9A84C' },
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        :root {
          --gold: #C9A84C; --gold-light: #E8C87A; --gold-pale: #F5E8C0;
          --deep: #0A0F1E; --navy: #111827; --card: #131C30; --card2: #192340;
          --border: rgba(201,168,76,0.22); --text: #E8DFC8; --muted: #8A99B8;
        }
        html, body { margin: 0; padding: 0; background: var(--deep); color: var(--text); font-family: 'Jost', sans-serif; }
        .seller-root { min-height: 100vh; display: flex; }
        .seller-sidebar {
          width: 72px; min-width: 72px; background: linear-gradient(180deg, #131C30 0%, #0A0F1E 100%);
          border-right: 1px solid var(--border); display: flex; flex-direction: column;
          align-items: center; padding: 24px 0; position: sticky; top: 0; height: 100vh; box-sizing: border-box;
        }
        .seller-brand {
          font-family: 'Cormorant Garamond', serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.15em; color: var(--gold-light); text-transform: uppercase;
          writing-mode: vertical-rl; transform: rotate(180deg); margin-bottom: 32px;
        }
        .seller-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; align-items: center; width: 100%; }
        .seller-nav-btn {
          width: 48px; height: 48px; border-radius: 12px; border: 1px solid transparent;
          background: transparent; color: var(--muted); cursor: pointer;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; transition: all 0.25s ease; padding: 0;
        }
        .seller-nav-btn .nav-icon { font-size: 18px; line-height: 1; }
        .seller-nav-btn .nav-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
        .seller-nav-btn.active { background: linear-gradient(135deg, #E8C87A, #C9A84C); color: #0A0F1E; }
        .seller-nav-btn.active .nav-label { color: #0A0F1E; }
        .seller-nav-btn:not(.active):hover { border-color: var(--border); background: rgba(201,168,76,0.08); }
        .seller-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .seller-topbar {
          background: rgba(19,28,48,0.95); border-bottom: 1px solid var(--border);
          padding: 20px 40px; display: flex; justify-content: space-between; align-items: center;
        }
        .seller-content { flex: 1; padding: 40px; overflow-y: auto; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 36px; }
        .stat-card { background: linear-gradient(145deg, #131C30, #192340); border: 1px solid var(--border); border-radius: 14px; padding: 22px 20px; }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 10px; }
        .stat-value { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: var(--gold-light); }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: 30px; color: var(--gold-light); margin: 0 0 28px 0; }
        .payout-method-card {
          background: linear-gradient(145deg, #131C30, #192340); border: 1px solid var(--border);
          border-radius: 14px; padding: 18px 22px; display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 12px;
        }
        .payout-badge { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em; margin-right: 12px; }
        .btn-primary {
          background: linear-gradient(135deg, #E8C87A, #C9A84C); border: none; border-radius: 10px;
          padding: 13px 20px; color: #0A0F1E; font-weight: 700; font-size: 14px;
          text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer;
          transition: all 0.2s; font-family: 'Jost', sans-serif;
        }
        .btn-ghost {
          background: transparent; border: 1px solid var(--border); border-radius: 8px;
          padding: 8px 14px; color: var(--muted); font-size: 12px; cursor: pointer;
          font-family: 'Jost', sans-serif; transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
        .btn-danger {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px; padding: 8px 14px; color: #ef4444;
          font-size: 12px; cursor: pointer; font-family: 'Jost', sans-serif;
        }
        .map-toolbar {
          display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;
        }
        .btn-detect {
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3);
          border-radius: 8px; padding: 10px 16px; color: var(--gold-light);
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Jost', sans-serif;
          display: flex; align-items: center; gap: 8px; transition: all 0.2s;
        }
        .btn-detect:hover { background: rgba(201,168,76,0.18); border-color: var(--gold); }
        .btn-detect:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-save-location {
          background: linear-gradient(135deg, #10b981, #059669); border: none;
          border-radius: 8px; padding: 10px 16px; color: #fff;
          font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Jost', sans-serif;
          display: flex; align-items: center; gap: 8px; transition: all 0.2s;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .btn-save-location:disabled { opacity: 0.4; cursor: not-allowed; background: #374151; }
        .btn-save-location.saved { background: linear-gradient(135deg, #059669, #047857); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}} />

      <div className="seller-root">

        {/* ── Slim sidebar ── */}
        <aside className="seller-sidebar">
          <div className="seller-brand">Terra</div>
          <nav className="seller-nav">
            {navTabs.map(({ key, icon, label }) => (
              <button key={key} type="button"
                className={`seller-nav-btn ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)} title={label}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </button>
            ))}
          </nav>
          <button type="button" onClick={handleDownloadClick} className="seller-nav-btn" title="Download App"
            style={{ marginTop: 'auto', border: '1px dashed var(--gold)', color: 'var(--gold)' }}>
            <span className="nav-icon">📥</span>
            <span className="nav-label" style={{ color: 'var(--gold)' }}>App</span>
          </button>
        </aside>

        <div className="seller-main">
          <header className="seller-topbar">
            <h1 style={{ margin: 0, fontSize: '22px', fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold-light)', letterSpacing: '0.08em' }}>
              {navTabs.find(t => t.key === activeTab)?.icon} {navTabs.find(t => t.key === activeTab)?.label}
            </h1>
            <button type="button" onClick={handleSignOut} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
              color: '#ef4444', padding: '10px 18px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: "'Jost', sans-serif",
            }}>🔒 Log Out</button>
          </header>

          <div className="seller-content">

            {/* ── Overview ── */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="stat-grid">
                  <div className="stat-card"><div className="stat-label">Total Earnings</div><div className="stat-value">TZS {totalEarnings.toLocaleString()}</div></div>
                  <div className="stat-card"><div className="stat-label">Active Listings</div><div className="stat-value">{properties.length}</div></div>
                  <div className="stat-card"><div className="stat-label">Pending Payments</div><div className="stat-value" style={{ color: 'var(--gold)' }}>{pendingPayments}</div></div>
                  <div className="stat-card"><div className="stat-label">Total Transactions</div><div className="stat-value">{transactions.length}</div></div>
                </div>
                <h2 className="section-title" style={{ fontSize: '20px' }}>Recent Activity</h2>
                {transactions.slice(0, 3).map(txn => (
                  <div key={txn.id} className="payout-method-card">
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--gold-light)', marginBottom: '4px' }}>Ref: {txn.payment_reference}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(txn.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: 'var(--gold-light)' }}>TZS {Number(txn.amount_total * 0.98).toLocaleString()}</div>
                      <div style={{ fontSize: '12px', color: txn.status === 'completed' ? '#10b981' : '#f59e0b', fontWeight: '600', textTransform: 'capitalize' }}>{txn.status}</div>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <p style={{ color: 'var(--muted)' }}>No transactions yet.</p>}
              </div>
            )}

            {/* ── Properties ── */}
            {activeTab === 'properties' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Your Listed Properties</h2>
                  <button type="button" className="btn-primary" onClick={() => {
                    setShowCreateProperty(!showCreateProperty);
                    setPendingLat(null); setPendingLng(null);
                    setLocationSaved(false); setLocationMsg(null);
                    window.sellerMapInstance = null;
                    if (window.sellerMarker) { window.sellerMarker.setMap(null); window.sellerMarker = null; }
                  }}>
                    {showCreateProperty ? '✕ Cancel' : '+ Add Property'}
                  </button>
                </div>

                {showCreateProperty && (
                  <form onSubmit={handleCreateProperty} style={{
                    background: 'linear-gradient(145deg, #131C30, #192340)',
                    border: '1px solid var(--border)', borderRadius: '16px',
                    padding: '28px', marginBottom: '32px',
                  }}>
                    {[
                      { label: 'Property Title', key: 'title', type: 'text', placeholder: 'e.g., Luxury Villa in Masaki' },
                      { label: 'Location Name', key: 'location', type: 'text', placeholder: 'e.g., Masaki, Dar es Salaam' },
                      { label: 'Price (TZS)', key: 'price', type: 'number', placeholder: '500000000' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type={f.type} value={newProperty[f.key]}
                          onChange={(e) => setNewProperty({ ...newProperty, [f.key]: e.target.value })}
                          style={inputStyle} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Description</label>
                      <textarea value={newProperty.description}
                        onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                        placeholder="Describe your property..." />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Property Image</label>
                      <input type="file" accept="image/*"
                        onChange={(e) => setNewProperty({ ...newProperty, image: e.target.files?.[0] })}
                        style={{ ...inputStyle, cursor: 'pointer' }} />
                    </div>

                    {/* ── Map section ── */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>🗺️ Property Location</label>

                      {/* Toolbar */}
                      <div className="map-toolbar">
                        <button
                          type="button"
                          className="btn-detect"
                          onClick={handleDetectLocation}
                          disabled={detectingLocation}
                        >
                          {detectingLocation ? (
                            <>
                              <span style={{ width: '12px', height: '12px', border: '2px solid #E8C87A', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                              Detecting...
                            </>
                          ) : '📡 Auto-Detect Location'}
                        </button>

                        <button
                          type="button"
                          className={`btn-save-location ${locationSaved ? 'saved' : ''}`}
                          onClick={handleSaveLocation}
                          disabled={pendingLat === null || locationSaved}
                        >
                          {locationSaved ? '✓ Location Saved' : '📌 Save Location'}
                        </button>
                      </div>

                      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 10px 0' }}>
                        Click anywhere on the map to place a pin, or use Auto-Detect. Then click "Save Location" to confirm.
                      </p>

                      {/* Map */}
                      <div id="property-location-map" style={{
                        width: '100%', height: '380px', borderRadius: '10px',
                        border: `1px solid ${locationSaved ? '#10b981' : 'var(--border)'}`,
                        marginBottom: '10px', transition: 'border-color 0.3s',
                      }} />

                      {/* Status message */}
                      {locationMsg && (
                        <div style={{
                          background: msgColors[locationMsg.type].bg,
                          border: `1px solid ${msgColors[locationMsg.type].border}`,
                          borderLeft: `3px solid ${msgColors[locationMsg.type].border}`,
                          color: msgColors[locationMsg.type].color,
                          borderRadius: '8px', padding: '10px 14px',
                          fontSize: '13px', lineHeight: '1.5',
                        }}>
                          {locationMsg.text}
                        </div>
                      )}
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '15px' }}>
                      🚀 List Property
                    </button>
                  </form>
                )}

                {loading ? <p style={{ color: 'var(--muted)' }}>Loading...</p> : properties.length === 0 ? (
                  <p style={{ color: 'var(--muted)' }}>No properties listed yet. Add your first listing!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {properties.map(prop => (
                      <div key={prop.id} style={{
                        background: 'linear-gradient(145deg, #131C30, #192340)',
                        border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden',
                      }}>
                        {prop.image_url && <img src={prop.image_url} alt={prop.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}
                        <div style={{ padding: '16px' }}>
                          <h4 style={{ margin: '0 0 6px 0', color: 'var(--gold-light)', fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}>{prop.title}</h4>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--muted)' }}>📍 {prop.location}</p>
                          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--gold)' }}>📌 {prop.lat?.toFixed(4)}, {prop.lng?.toFixed(4)}</p>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gold-light)' }}>TZS {Number(prop.price || 0).toLocaleString()}</div>
                          {prop.description && (
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text)', fontStyle: 'italic' }}>
                              {prop.description.length > 60 ? prop.description.substring(0, 60) + '...' : prop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Transactions ── */}
            {activeTab === 'transactions' && (
              <div>
                <h2 className="section-title">Recent Transactions</h2>
                {loading ? <p style={{ color: 'var(--muted)' }}>Loading...</p> : transactions.length === 0 ? (
                  <p style={{ color: 'var(--muted)' }}>No transactions yet.</p>
                ) : transactions.map(txn => (
                  <div key={txn.id} className="payout-method-card">
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--gold-light)', marginBottom: '4px' }}>Ref: {txn.payment_reference}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(txn.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: 'var(--gold-light)' }}>TZS {Number(txn.amount_total * 0.98).toLocaleString()}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', color: txn.status === 'completed' ? '#10b981' : '#f59e0b' }}>{txn.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Payout Methods ── */}
            {activeTab === 'payout' && (
              <div>
                <h2 className="section-title">Payout Methods</h2>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '-16px', marginBottom: '28px' }}>
                  Add where you'd like to receive your property sale proceeds (98% of each transaction).
                </p>

                {payoutLoading ? <p style={{ color: 'var(--muted)' }}>Loading...</p> : payoutMethods.length > 0 && (
                  <div style={{ marginBottom: '36px' }}>
                    <h3 style={{ color: 'var(--gold)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Saved Methods</h3>
                    {payoutMethods.map(m => {
                      const opt = payoutOptions.find(o => o.value === m.method_type);
                      return (
                        <div key={m.id} className="payout-method-card">
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="payout-badge" style={{ background: opt?.badgeBg || 'rgba(201,168,76,0.15)', color: opt?.badgeColor || '#C9A84C' }}>
                              {opt?.badgeText || m.method_type.toUpperCase()}
                            </span>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--gold-light)', fontSize: '14px' }}>
                                {opt?.label}
                                {m.is_primary && (
                                  <span style={{ marginLeft: '8px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>PRIMARY</span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                                {m.phone_number || `${m.bank_name} — ${m.account_number}`}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!m.is_primary && <button type="button" className="btn-ghost" onClick={() => handleSetPrimary(m.id)}>Set Primary</button>}
                            <button type="button" className="btn-danger" onClick={() => handleDeletePayoutMethod(m.id)}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ background: 'linear-gradient(145deg, #131C30, #192340)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                  <h3 style={{ color: 'var(--gold)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px 0' }}>Add New Payout Method</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                    {payoutOptions.map(opt => {
                      const isActive = payoutType === opt.value;
                      return (
                        <button type="button" key={opt.value}
                          onClick={() => { setPayoutType(opt.value); setPayoutError(null); setPayoutSuccess(null); }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            padding: '14px 8px', borderRadius: '10px', cursor: 'pointer',
                            background: isActive ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.2)',
                            border: `1px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.1)'}`,
                            transition: 'all 0.2s', fontFamily: "'Jost', sans-serif",
                          }}
                        >
                          <span style={{
                            fontSize: '10px', fontWeight: '800', padding: '3px 7px', borderRadius: '4px', letterSpacing: '0.05em',
                            background: opt.badgeBg || (isActive ? '#C9A84C' : 'rgba(201,168,76,0.15)'),
                            color: opt.badgeColor || (isActive ? '#0A0F1E' : '#C9A84C'),
                            boxShadow: isActive && opt.badgeBg ? '0 0 0 2px #C9A84C' : 'none',
                          }}>{opt.badgeText}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: isActive ? '#E8C87A' : '#8A99B8' }}>{opt.label}</span>
                          <span style={{ fontSize: '10px', color: '#8A99B8', opacity: 0.75 }}>{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isMobileMoney && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>Mobile Wallet Number</label>
                      <input type="tel" placeholder="e.g. 255712345678" value={payoutForm.phone}
                        onChange={(e) => setPayoutForm({ ...payoutForm, phone: e.target.value.replace(/[^\d+]/g, '') })}
                        style={inputStyle} />
                      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '6px 0 0 0' }}>Format: 255XXXXXXXXX or 0XXXXXXXXX</p>
                    </div>
                  )}

                  {!isMobileMoney && (
                    <div>
                      {[
                        { label: 'Bank Name', key: 'bankName', placeholder: 'e.g. CRDB Bank, NMB Bank' },
                        { label: 'Account Holder Name', key: 'accountName', placeholder: 'Full legal name on account' },
                        { label: 'Account Number', key: 'accountNumber', placeholder: 'Your bank account number' },
                        { label: 'SWIFT / BIC Code (optional)', key: 'swiftCode', placeholder: 'e.g. CRDBTZTX' },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: '16px' }}>
                          <label style={labelStyle}>{f.label}</label>
                          <input type="text" placeholder={f.placeholder} value={payoutForm[f.key]}
                            onChange={(e) => setPayoutForm({ ...payoutForm, [f.key]: e.target.value })}
                            style={inputStyle} />
                        </div>
                      ))}
                    </div>
                  )}

                  {payoutError && <div style={{ color: '#ff8585', background: 'rgba(255,107,107,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', borderLeft: '3px solid #ff6b6b' }}>⚠️ {payoutError}</div>}
                  {payoutSuccess && <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', borderLeft: '3px solid #10b981' }}>✓ {payoutSuccess}</div>}

                  <button type="button" className="btn-primary" onClick={handleSavePayoutMethod} disabled={payoutLoading}
                    style={{ width: '100%', padding: '15px', opacity: payoutLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {payoutLoading && <span style={{ width: '13px', height: '13px', border: '2px solid #0A0F1E', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                    {payoutLoading ? 'Saving...' : 'Save Payout Method'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}