import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import PaymentModal from '../components/PaymentModal.jsx';
// FIXED EXPLICIT FILENAME CAPITALIZATION FOR YOUR HOOK
import usePwaDownload from '/src/hooks/usePwaDownload.js';

export default function BuyerDashboard() {
  // NAVIGATION SYSTEM
  const [activeTab, setActiveTab] = useState('dashboard'); 

  // CONTROL SETTINGS CORES - Updated to fit the smartcity configuration environment
  const [theme, setTheme] = useState('smartcity');
  const [currency, setCurrency] = useState('TZS');

  // MARKET DISCOVERY DATA STREAMS
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // ESCROW PAYMENT SYSTEM HOOKS
  const [selectedPropertyForPayment, setSelectedPropertyForPayment] = useState(null);
  const [currentBuyerId, setCurrentBuyerId] = useState(null);

  // MOCK COUNTERS PRESERVING PREVIOUS SCREEN INSIGHTS
  const [savedCount, setSavedCount] = useState(2);
  const [inquiriesCount, setInquiriesCount] = useState(1);

  // EXECUTE INITIALIZATION FROM THE CORRECTLY IMPORTED HOOK FILE
  const { handleDownloadClick, isInstallable } = usePwaDownload();

  // Financial Analysis Matrix
  const marketTrends = [
    { month: 'Jan', value: '45M' },
    { month: 'Feb', value: '65M' },
    { month: 'Mar', value: '55M' },
    { month: 'Apr', value: '85M' },
    { month: 'May', value: '70M' },
    { month: 'Jun', value: '95M' },
  ];

  useEffect(() => {
    fetchGlobalMarketplace();
    fetchAuthenticatedUserSession();
  }, []);

  // Fetch current user id dynamically for the escrow payload mappings
  const fetchAuthenticatedUserSession = async () => {
    try {
      if (!supabase || !supabase.auth) return;
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) setCurrentBuyerId(user.id);
    } catch (err) {
      console.error('Session retrieval exception:', err.message);
    }
  };

  // TRUE GOOGLE MAPS ENGINE MOUNT
  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    let googleMapInstance = null;

    const initializeGoogleMap = () => {
      const mapContainer = document.getElementById('marketplace-live-map');
      // Ensure container exists and Google Maps core is fully loaded in window object
      if (!mapContainer || !window.google || !window.google.maps) return;

      // Render standard Google Map centered over the East African main property grid
      googleMapInstance = new window.google.maps.Map(mapContainer, {
        center: { lat: -6.7924, lng: 39.2083 }, // Centered gracefully near Dar es Salaam / Mbeya zones
        zoom: 6,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP, // Standard clean Google style
        disableDefaultUI: false,
        zoomControl: true,
      });

      // Loop and pin properties fetched from Supabase
      if (properties && properties.length > 0) {
        properties.forEach(item => {
          const latNum = Number(item.lat);
          const lngNum = Number(item.lng);

          if (!isNaN(latNum) && !isNaN(lngNum) && item.lat !== null && item.lng !== null) {
            const marker = new window.google.maps.Marker({
              position: { lat: latNum, lng: lngNum },
              map: googleMapInstance,
              title: item.title || 'Verified Asset'
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="color:#111; padding:6px; font-family:'Inter',sans-serif; min-width:150px;">
                  <strong style="display:block; margin-bottom:2px;">${item.title || 'Sovereign Asset'}</strong>
                  <span style="display:block; font-size:12px; color:#555; margin-bottom:4px;">📍 ${item.location || 'Verified Site'}</span>
                  <span style="color:#00C2CB; font-weight:600;">${currency} ${Number(item.price || 0).toLocaleString()}</span>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(googleMapInstance, marker);
            });
          }
        });
      } else {
        // Fallback placeholders matching your precise Mbeya / Dar / Arusha setup
        const defaultLocations = [
          { name: "The Grand Oasis Villa Complex (Masaki)", lat: -6.7512, lng: 39.2741 },
          { name: "Luxury Tourism Villa Estate (Arusha)", lat: -3.3869, lng: 36.6830 },
          { name: "Sovereign Highlands Complex (Uyole, Mbeya)", lat: -8.9004, lng: 33.4862 }
        ];

        defaultLocations.forEach(loc => {
          const marker = new window.google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map: googleMapInstance,
            title: loc.name
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="color:#111; padding:4px; font-family:'Inter',sans-serif;">
                <strong>${loc.name}</strong>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapInstance, marker);
          });
        });
      }
    };

    // Make initializeGoogleMap available on window for the API script callback fallback
    window.initializeGoogleMap = initializeGoogleMap;

    // Dynamically inject script tag if window.google doesn't exist yet
    if (!window.google || !window.google.maps) {
      let googleScript = document.getElementById('google-maps-inject');
      if (!googleScript) {
        googleScript = document.createElement('script');
        googleScript.id = 'google-maps-inject';
        googleScript.src = `https://maps.googleapis.com/maps/api/js?v=weekly&callback=initializeGoogleMap`; 
        googleScript.async = true;
        googleScript.defer = true;
        document.body.appendChild(googleScript);
      } else {
        googleScript.addEventListener('load', initializeGoogleMap);
      }
    } else {
      setTimeout(initializeGoogleMap, 50);
    }

  }, [activeTab, properties, currency]);

  // DATA HOOK: STREAM LIVE ENTRIES DIRECTLY FROM SUPABASE
  const fetchGlobalMarketplace = async () => {
    try {
      setLoading(true);
      if (!supabase || !supabase.from) return;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProperties(data);
    } catch (err) {
      console.error('Exception streaming marketplace array:', err.message);
    } finally {
      loading && setLoading(false);
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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@200;300;400;500;600;700&display=swap');

        :root {
          --teal: #00C2CB;
          --teal-light: #33d1d8;
          --teal-pale: #b3f2f5;
          --border: rgba(0, 194, 203, 0.2);
          --text: #E5E7EB;
          --muted: #9CA3AF;
          
          --deep: #0F172A;
          --card: #1E293B;
          --card2: #334155;
          --navy: #1A2238;
        }

        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: var(--deep);
          width: 100%;
        }

        .dashboard-container-root {
          background: var(--deep);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          display: flex;
          width: 100%;
          box-sizing: border-box;
          position: relative;
        }

        .dashboard-sidebar {
          width: 280px;
          min-width: 280px;
          border-right: 1px solid var(--border);
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          backdrop-filter: blur(20px);
          padding: 44px 24px;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }

        .sidebar-brand {
          font-family: 'Montserrat', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, var(--teal-light), var(--teal), #008B94);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          margin-bottom: 54px;
          text-align: center;
        }

        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-link-btn {
          width: 100%;
          background: transparent;
          border: 1px solid transparent;
          color: var(--muted);
          padding: 14px 20px;
          border-radius: 12px;
          text-align: left;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
        }

        .sidebar-link-btn.active {
          color: #0f172a;
          background: linear-gradient(135deg, var(--teal-light), var(--teal));
          font-weight: 600;
        }

        .sidebar-download-btn {
          margin-top: auto;
          background: rgba(0, 194, 203, 0.08);
          border: 1px dashed var(--teal);
          color: var(--teal-light);
          padding: 14px 20px;
          border-radius: 12px;
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-sizing: border-box;
        }

        .sidebar-download-btn:hover {
          background: linear-gradient(135deg, var(--teal-light), var(--teal));
          color: #0f172a;
          border-style: solid;
        }

        .workspace-viewport {
          flex: 1;
          padding: 50px 50px;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          width: calc(100% - 280px);
        }

        .workspace-header-hero {
          margin-bottom: 44px;
        }

        .workspace-header-hero h1 {
          font-family: 'Montserrat', sans-serif;
          font-size: 40px;
          font-weight: 400;
          color: #fff;
          margin: 0;
        }

        .metrics-panel-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 44px;
          width: 100%;
        }

        .metric-luxury-card {
          background: linear-gradient(145deg, var(--card), var(--card2));
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 30px 24px;
          box-sizing: border-box;
        }

        .metric-data-val {
          font-family: 'Montserrat', sans-serif;
          font-size: 34px;
          color: var(--teal-light);
          font-weight: 600;
        }

        .buyer-split-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 28px;
          width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 1300px) {
          .buyer-split-grid {
            grid-template-columns: 1fr 380px;
          }
        }

        .luxury-card-panel {
          background: linear-gradient(145deg, var(--card), var(--navy));
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 40px;
          box-shadow: 0 16px 64px rgba(0,0,0,0.4);
          box-sizing: border-box;
          width: 100%;
        }

        .panel-headline-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          color: #fff;
          margin-top: 0;
          margin-bottom: 8px;
        }

        .panel-sub-text {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 32px;
        }

        /* GOOGLE MAP CANVAS VIEWPORT container */
        .map-viewport-container {
          width: 100%;
          height: 380px;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          background: #1e293b;
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }

        .trend-chart-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }

        .trend-node {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
          border-left: 3px solid var(--teal);
        }

        .premium-property-row {
          background: rgba(51, 65, 85, 0.3);
          border: 1px solid rgba(0, 194, 203, 0.15);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          width: 100%;
          margin-bottom: 16px;
        }

        .property-financial-value {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--teal-light);
        }

        .btn-luxury-checkout {
          background: linear-gradient(135deg, var(--teal-light), var(--teal));
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-luxury-checkout:hover {
          transform: translateY(-2px);
        }

        .btn-danger-action {
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          border: none;
          border-radius: 12px;
          padding: 14px 36px;
          color: #fff;
          cursor: pointer;
        }

        .theme-selection-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .theme-card-node {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          cursor: pointer;
          background: rgba(255,255,255,0.02);
          text-align: center;
        }

        .theme-card-node.active {
          border-color: var(--teal);
          background: rgba(0, 194, 203, 0.08);
        }
      `}} />

      <div className="dashboard-container-root">
        
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">Terralink</div>
          <ul className="sidebar-nav-list" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <li>
              <button type="button" className={`sidebar-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                📊 Core Overview
              </button>
            </li>
            <li>
              <button type="button" className={`sidebar-link-btn ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
                🏘️ Properties Matrix
              </button>
            </li>
            <li>
              <button type="button" className={`sidebar-link-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
                ✉️ Offers & Inquiries ({savedCount})
              </button>
            </li>
            <li>
              <button type="button" className={`sidebar-link-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                ⚙️ Settings Panel
              </button>
            </li>

            {/* SYNCED DOWNLOAD TRIGGER AREA */}
            <li style={{ marginTop: 'auto' }}>
              <button type="button" className="sidebar-download-btn" onClick={handleDownloadClick}>
                📥 Download App
              </button>
            </li>
          </ul>
        </aside>

        <main className="workspace-viewport">
          <div className="workspace-header-hero">
            <h1>Smart Buyer Account</h1>
          </div>

          {activeTab === 'dashboard' && (
            <div>
              <div className="metrics-panel-row">
                <div className="metric-luxury-card">
                  <div>Saved Real Estate Listings</div>
                  <div className="metric-data-val">{savedCount}</div>
                </div>
                <div className="metric-luxury-card">
                  <div>Active Global Inquiries</div>
                  <div className="metric-data-val">{inquiriesCount}</div>
                </div>
                <div className="metric-luxury-card">
                  <div>Ledger Validation Status</div>
                  <div className="metric-data-val" style={{fontSize: '22px', marginTop: '12px'}}>Active Sync</div>
                </div>
              </div>

              <div className="buyer-split-grid">
                <div className="left-column-stack">
                  <div className="luxury-card-panel">
                    <h3 className="panel-headline-text">Explore Global Marketplace Matrix</h3>
                    <div className="panel-sub-text">Interact with real-time geospatial coordinate points pinpointing sovereign asset listings pinned across borders.</div>
                    
                    {/* TRUE GOOGLE MAP ENGINE CONTAINER ID */}
                    <div className="map-viewport-container" id="marketplace-live-map" />
                  </div>
                </div>

                <div className="luxury-card-panel">
                  <h4 className="panel-headline-text" style={{fontSize: '20px'}}>Market Pricing Analysis Trends</h4>
                  <div className="trend-chart-list">
                    {marketTrends.map((trend, i) => (
                      <div key={i} className="trend-node">
                        <span>{trend.month}</span>
                        <span style={{fontFamily: 'Montserrat, sans-serif', color: 'var(--teal-light)'}}>{trend.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="luxury-card-panel">
              <h3 className="panel-headline-text">Registered Asset Global Manifest</h3>
              {loading ? <p>Streaming remote assets...</p> : (
                <div>
                  {properties.map((item) => (
                    <div key={item.id} className="premium-property-row">
                      <div>
                        <h4 style={{margin: '0 0 4px 0', fontFamily: 'Montserrat, sans-serif'}}>{item.title}</h4>
                        <p style={{margin: 0, color: 'var(--muted)'}}>📍 {item.location}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div className="property-financial-value">
                          {currency} {Number(item.price || 0).toLocaleString()}
                        </div>
                        <button 
                          type="button" 
                          className="btn-luxury-checkout"
                          onClick={() => setSelectedPropertyForPayment(item)}
                        >
                          🔒 Secure Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="luxury-card-panel">
              <h3 className="panel-headline-text">Active Inquiries</h3>
              <div className="premium-property-row">
                <div><h4 style={{margin: 0, fontFamily: 'Montserrat, sans-serif'}}>Villa Reserve, Dodoma Zone</h4></div>
                <div className="property-financial-value">TZS 400,000,000</div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="luxury-card-panel">
              <h3 className="panel-headline-text">Console Preferences</h3>
              <div className="theme-selection-row">
                <div className="theme-card-node active">Smart City Future</div>
              </div>
              <button type="button" className="btn-danger-action" onClick={handleSignOut}>🔒 Log Out</button>
            </div>
          )}
        </main>
      </div>

      {/* VETTED FINANCIAL INTERACTION ESCROW OVERLAY */}
      {selectedPropertyForPayment && currentBuyerId && (
        <PaymentModal 
          property={selectedPropertyForPayment}
          buyerId={currentBuyerId}
          onClose={() => setSelectedPropertyForPayment(null)}
          onSuccess={(transactionData) => {
            setSelectedPropertyForPayment(null);
          }}
        />
      )}
    </>
  );
}