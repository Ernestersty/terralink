import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import PaymentModal from '../components/PaymentModal.jsx';
import {usePwaDownload} from '/src/hooks/usePwaDownload.js';

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [currency, setCurrency] = useState('TZS');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPropertyForPayment, setSelectedPropertyForPayment] = useState(null);
  const [currentBuyerId, setCurrentBuyerId] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { handleDownloadClick } = usePwaDownload();

  useEffect(() => {
    fetchGlobalMarketplace();
    fetchAuthenticatedUserSession();
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?v=weekly';
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (activeTab === 'map' && mapLoaded && properties.length > 0 && !window.buyerMapInitialized) {
      window.buyerMapInitialized = true;
      setTimeout(() => {
        const mapContainer = document.getElementById('buyer-properties-map');
        if (mapContainer && window.google?.maps) {
          window.buyerMap = new window.google.maps.Map(mapContainer, {
            center: { lat: -6.7924, lng: 39.2083 },
            zoom: 10,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          });

          properties.forEach(prop => {
            if (prop.lat && prop.lng) {
              const lat = parseFloat(prop.lat);
              const lng = parseFloat(prop.lng);
              
              const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: window.buyerMap,
                title: prop.title,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              });

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="color:#111; padding:12px; font-family:'Inter',sans-serif; min-width:200px;">
                    <strong style="display:block; margin-bottom:8px; font-size:14px;">${prop.title}</strong>
                    <span style="display:block; font-size:12px; color:#555; margin-bottom:6px;">📍 ${prop.location}</span>
                    <span style="color:#00C2CB; font-weight:600; font-size:13px;">TZS ${Number(prop.price || 0).toLocaleString()}</span>
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(window.buyerMap, marker);
              });
            }
          });
        }
      }, 100);
    }
  }, [activeTab, mapLoaded, properties]);

  const fetchAuthenticatedUserSession = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) setCurrentBuyerId(user.id);
    } catch (err) {
      console.error('Session retrieval exception:', err.message);
    }
  };

  const fetchGlobalMarketplace = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProperties(data);
    } catch (err) {
      console.error('Exception streaming marketplace:', err.message);
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

  const navItems = [
    { tab: 'dashboard', icon: '📊', label: 'Overview' },
    { tab: 'listings',  icon: '🏘️', label: 'Browse' },
    { tab: 'map',       icon: '🗺️', label: 'Map' },
    { tab: 'settings',  icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@200;300;400;500;600;700&display=swap');
        :root {
          --teal: #00C2CB;
          --teal-light: #33d1d8;
          --border: rgba(0, 194, 203, 0.2);
          --text: #E5E7EB;
          --muted: #9CA3AF;
          --deep: #0F172A;
          --card: #1E293B;
          --navy: #1A2238;
        }
        html, body { margin: 0; padding: 0; overflow-x: hidden; background: var(--deep); width: 100%; }
        .dashboard-container-root { background: var(--deep); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; width: 100%; box-sizing: border-box; }

        /* ── Slim sidebar ── */
        .dashboard-sidebar {
          width: 72px;
          min-width: 72px;
          border-right: 1px solid var(--border);
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-brand {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          background: linear-gradient(135deg, var(--teal-light), var(--teal), #008B94);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          margin-bottom: 32px;
          text-align: center;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          line-height: 1;
        }
        .sidebar-nav-list { display: flex; flex-direction: column; gap: 6px; list-style: none; padding: 0; margin: 0; width: 100%; align-items: center; flex: 1; }
        .sidebar-link-btn {
          width: 48px;
          height: 48px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--muted);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
          box-sizing: border-box;
          position: relative;
        }
        .sidebar-link-btn .nav-icon { font-size: 18px; line-height: 1; }
        .sidebar-link-btn .nav-label { font-family: 'Inter', sans-serif; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); line-height: 1; }
        .sidebar-link-btn.active { color: #0f172a; background: linear-gradient(135deg, var(--teal-light), var(--teal)); }
        .sidebar-link-btn.active .nav-label { color: #0f172a; }
        .sidebar-link-btn:not(.active):hover { border-color: var(--border); background: rgba(0,194,203,0.08); }
        .sidebar-download-btn {
          width: 48px;
          height: 48px;
          margin-top: auto;
          background: rgba(0, 194, 203, 0.08);
          border: 1px dashed var(--teal);
          color: var(--teal-light);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
          box-sizing: border-box;
        }
        .sidebar-download-btn .nav-icon { font-size: 18px; line-height: 1; }
        .sidebar-download-btn .nav-label { font-family: 'Inter', sans-serif; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--teal-light); line-height: 1; }
        .sidebar-download-btn:hover { background: linear-gradient(135deg, var(--teal-light), var(--teal)); color: #0f172a; border-style: solid; }
        .sidebar-download-btn:hover .nav-label { color: #0f172a; }

        /* ── Main viewport ── */
        .workspace-viewport { flex: 1; padding: 40px 40px; position: relative; z-index: 1; box-sizing: border-box; width: calc(100% - 72px); overflow-y: auto; }
        .workspace-header-hero h1 { font-family: 'Montserrat', sans-serif; font-size: 36px; font-weight: 400; color: #fff; margin: 0 0 28px 0; }

        /* ── Property grid — more columns now that sidebar is slim ── */
        .properties-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; width: 100%; }
        .property-card { background: linear-gradient(145deg, var(--card), var(--navy)); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: all 0.3s ease; display: flex; flex-direction: column; height: 100%; }
        .property-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0, 194, 203, 0.15); }
        .property-image { width: 100%; height: 180px; object-fit: cover; background: rgba(0, 0, 0, 0.3); }
        .property-info { padding: 16px; flex: 1; display: flex; flex-direction: column; }
        .property-title { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 600; margin: 0 0 6px 0; color: #fff; }
        .property-location { font-size: 12px; color: var(--muted); margin: 0 0 10px 0; }
        .property-price { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 600; color: var(--teal-light); margin: auto 0 14px 0; }
        .property-button {
          width: 100%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: none;
          border-radius: 10px;
          padding: 14px;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5);
          animation: pulse-glow 2.5s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .property-button::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .property-button:hover::before { left: 160%; }
        .property-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45);
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          animation: none;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
        }

        /* ── Dashboard overview stat strip ── */
        .overview-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: linear-gradient(145deg, var(--card), var(--navy)); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
        .stat-value { font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 600; color: var(--teal-light); }

        #buyer-properties-map { width: 100%; height: calc(100vh - 160px); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 12px 32px rgba(0, 194, 203, 0.1); }
      `}} />

      <div className="dashboard-container-root">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">Terralink</div>
          <ul className="sidebar-nav-list">
            {navItems.map(({ tab, icon, label }) => (
              <li key={tab}>
                <button
                  type="button"
                  className={`sidebar-link-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  title={label}
                >
                  <span className="nav-icon">{icon}</span>
                  <span className="nav-label">{label}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="sidebar-download-btn" onClick={handleDownloadClick} title="Download App">
            <span className="nav-icon">📥</span>
            <span className="nav-label">App</span>
          </button>
        </aside>

        <main className="workspace-viewport">
          {activeTab === 'dashboard' && (
            <div>
              <div className="workspace-header-hero"><h1>🏠 Buyer Dashboard</h1></div>
              <div className="overview-stats">
                <div className="stat-card">
                  <div className="stat-label">Total Listings</div>
                  <div className="stat-value">{properties.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Featured</div>
                  <div className="stat-value">{Math.min(properties.length, 3)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Currency</div>
                  <div className="stat-value" style={{ fontSize: '18px', paddingTop: '4px' }}>{currency}</div>
                </div>
              </div>
              <div className="properties-grid">
                {properties.slice(0, 3).map((item) => (
                  <div key={item.id} className="property-card">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="property-image" />
                    ) : (
                      <div className="property-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🏠</div>
                    )}
                    <div className="property-info">
                      <h3 className="property-title">{item.title}</h3>
                      <p className="property-location">📍 {item.location}</p>
                      <div className="property-price">{currency} {Number(item.price || 0).toLocaleString()}</div>
                      <button type="button" className="property-button" onClick={() => setSelectedPropertyForPayment(item)}>
                        💰 Secure Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div>
              <div className="workspace-header-hero"><h1>🌍 Explore Properties</h1></div>
              {loading ? <p>Loading properties...</p> : (
                <div className="properties-grid">
                  {properties.map((item) => (
                    <div key={item.id} className="property-card">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="property-image" />
                      ) : (
                        <div className="property-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🏠</div>
                      )}
                      <div className="property-info">
                        <h3 className="property-title">{item.title}</h3>
                        <p className="property-location">📍 {item.location}</p>
                        <div className="property-price">{currency} {Number(item.price || 0).toLocaleString()}</div>
                        <button type="button" className="property-button" onClick={() => setSelectedPropertyForPayment(item)}>
                          💰 Secure Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div>
              <div className="workspace-header-hero"><h1>🗺️ Property Map</h1></div>
              {mapLoaded ? (
                <div id="buyer-properties-map" />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading map...</div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ maxWidth: '600px' }}>
              <div className="workspace-header-hero"><h1>⚙️ Settings</h1></div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(0, 194, 203, 0.2)', borderRadius: '14px', padding: '24px' }}>
                <button type="button" style={{
                  width: '100%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '8px', padding: '14px',
                  color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px', textTransform: 'uppercase',
                }} onClick={handleSignOut}>🔒 Log Out</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedPropertyForPayment && currentBuyerId && (
        <PaymentModal property={selectedPropertyForPayment} buyerId={currentBuyerId} onClose={() => setSelectedPropertyForPayment(null)} onSuccess={() => { setSelectedPropertyForPayment(null); fetchGlobalMarketplace(); }} />
      )}
    </>
  );
}