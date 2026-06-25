import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { usePwaDownload } from '../hooks/usePwaDownload'; // Referencing the specific shared file here

export default function SellerDashboard() {
  // NAVIGATION SYSTEM
  const [activeTab, setActiveTab] = useState('dashboard'); 

  // CONTROL SETTINGS CORES
  const [theme, setTheme] = useState('midnight');
  const [currency, setCurrency] = useState('TZS');

  // STRATEGIC REAL ESTATE FORMS STATE MANAGEMENT
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Dar es Salaam');

  // NEW: Media and Contact State Tracking variables
  const [photoFile, setPhotoFile] = useState(null);
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');

  // International Region Filters for Global Scale
  const [activeMarketGroup, setActiveMarketGroup] = useState('Domestic');

  // DATA MANAGEMENT STREAM ARRAYS
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // IMMUTABLE PREMIUM ANALYTICS ENGINE DATA UNITS
  const [viewsCount, setViewsCount] = useState(1420);
  const [leadsCount, setLeadsCount] = useState(12);

  // REFERENCING THE SHARED PWA DOWNLOADING HOOK HERE
  const { showInstallBtn, handleDownloadClick } = usePwaDownload();

  // FINANCIAL HISTOGRAMS MATRIX
  const salesPerformanceData = [
    { target: 'Q1 Launch', closed: '120M' },
    { target: 'Q2 Peak', closed: '450M' },
    { target: 'Q3 Escrow', closed: '310M' },
    { target: 'Q4 Projection', closed: '890M' },
  ];

  // GLOBAL REGIONAL COORDINATE MAP MATRIX
  const globalCitiesMatrix = {
    Domestic: [
      { name: 'Dar es Salaam', label: '🏙️ Dar Zone', lat: '-6.7924', lng: '39.2083' },
      { name: 'Arusha', label: '🌋 Arusha', lat: '-3.3869', lng: '36.6830' },
      { name: 'Mbeya', label: '⛰️ Mbeya', lat: '-8.9004', lng: '33.4862' },
      { name: 'Dodoma', label: '🏛️ Dodoma', lat: '-6.1630', lng: '35.7516' },
      { name: 'Zanzibar', label: '🏖️ Zanzibar', lat: '-6.1659', lng: '39.1923' },
    ],
    Africa: [
      { name: 'Nairobi', label: '🇰🇪 Nairobi', lat: '-1.2921', lng: '36.8219' },
      { name: 'Johannesburg', label: '🇿🇦 Joburg', lat: '-26.2041', lng: '28.0473' },
      { name: 'Cairo', label: '🇪🇬 Cairo', lat: '30.0444', lng: '31.2357' },
      { name: 'Lagos', label: '🇳🇬 Lagos', lat: '6.5244', lng: '3.3792' },
    ],
    Americas: [
      { name: 'New York', label: '🇺🇸 New York', lat: '40.7128', lng: '-74.0060' },
      { name: 'Los Angeles', label: '🇺🇸 Los Angeles', lat: '34.0522', lng: '-118.2437' },
      { name: 'Toronto', label: '🇨🇦 Toronto', lat: '43.6532', lng: '-79.3832' },
      { name: 'São Paulo', label: '🇧🇷 São Paulo', lat: '-23.5505', lng: '-46.6333' },
    ],
    Europe: [
      { name: 'London', label: '🇬🇧 London', lat: '51.5074', lng: '-0.1278' },
      { name: 'Paris', label: '🇫🇷 Paris', lat: '48.8566', lng: '2.3522' },
      { name: 'Frankfurt', label: '🇩🇪 Frankfurt', lat: '50.1109', lng: '8.6821' },
    ],
    AsiaEMEA: [
      { name: 'Dubai', label: '🇦🇪 Dubai', lat: '25.2048', lng: '55.2708' },
      { name: 'Tokyo', label: '🇯🇵 Tokyo', lat: '35.6762', lng: '139.6503' },
      { name: 'Singapore', label: '🇸🇬 Singapore', lat: '1.3521', lng: '103.8198' },
      { name: 'Mumbai', label: '🇮🇳 Mumbai', lat: '19.0760', lng: '72.8777' },
    ]
  };

  const handlePrintReport = () => {
    window.print();
  };

  useEffect(() => {
    fetchSellerMarketplace();
  }, []);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    let googleMapInstance = null;
    let activePlacementMarker = null; 

    const initializeSellerMap = () => {
      const mapContainer = document.getElementById('seller-live-map');
      if (!mapContainer || !window.google || !window.google.maps) return;

      let initialLat = -6.7924;
      let initialLng = 39.2083;

      Object.keys(globalCitiesMatrix).forEach(group => {
        const match = globalCitiesMatrix[group].find(c => c.name === selectedRegion);
        if (match) {
          initialLat = parseFloat(match.lat);
          initialLng = parseFloat(match.lng);
        }
      });

      googleMapInstance = new window.google.maps.Map(mapContainer, {
        center: { lat: initialLat, lng: initialLng }, 
        zoom: selectedRegion === 'Dar es Salaam' || selectedRegion === 'Arusha' || selectedRegion === 'Mbeya' ? 6 : 10,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false, 
        zoomControl: true,
        fullscreenControl: true, 
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT
        }
      });

      googleMapInstance.addListener('click', (event) => {
        const clickedLat = event.latLng.lat();
        const clickedLng = event.latLng.lng();

        setLatitude(clickedLat.toFixed(6));
        setLongitude(clickedLng.toFixed(6));

        if (activePlacementMarker) {
          activePlacementMarker.setPosition(event.latLng);
        } else {
          activePlacementMarker = new window.google.maps.Marker({
            position: event.latLng,
            map: googleMapInstance,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', 
            title: 'Selected Listing Position'
          });
        }
      });

      if (myProperties && myProperties.length > 0) {
        myProperties.forEach(item => {
          const latNum = Number(item.lat);
          const lngNum = Number(item.lng);

          if (!isNaN(latNum) && !isNaN(lngNum) && item.lat !== null && item.lng !== null) {
            const marker = new window.google.maps.Marker({
              position: { lat: latNum, lng: lngNum },
              map: googleMapInstance,
              title: item.title || 'Active Listing Portfolio'
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="color:#111; padding:6px; font-family:'Jost',sans-serif; min-width:160px;">
                  <strong style="display:block; margin-bottom:2px;">${item.title}</strong>
                  <span style="display:block; font-size:12px; color:#666; margin-bottom:4px;">📍 ${item.location}</span>
                  <span style="color:#C9A84C; font-weight:600;">${currency} ${Number(item.price || 0).toLocaleString()}</span>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(googleMapInstance, marker);
            });
          }
        });
      }
    };

    if (!window.google || !window.google.maps) {
      let googleScript = document.getElementById('google-maps-inject');
      if (!googleScript) {
        googleScript = document.createElement('script');
        googleScript.id = 'google-maps-inject';
        const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
        googleScript.src = `https://maps.googleapis.com/maps/api/js?v=weekly${apiKey ? `&key=${apiKey}` : ''}`;
        googleScript.async = true;
        googleScript.defer = true;
        googleScript.onload = () => initializeSellerMap();
        document.body.appendChild(googleScript);
      } else {
        googleScript.addEventListener('load', initializeSellerMap);
      }
    } else {
      initializeSellerMap();
    }

  }, [activeTab, myProperties, currency, selectedRegion]);

  const handleRegionQuickSelect = (regionName, lat, lng) => {
    setSelectedRegion(regionName);
    setLatitude(lat);
    setLongitude(lng);
    setLocationName(regionName);
  };

  const fetchSellerMarketplace = async () => {
    try {
      setLoading(true);
      if (!supabase || !supabase.from) return;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMyProperties(data);
    } catch (err) {
      console.error('Exception streaming remote data matrices:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process and upload file stream to Supabase Storage Bucket safely
  const handleCreatePropertyAsset = async (e) => {
    e.preventDefault();
    if (!title || !price || !locationName) {
      alert('Error: Please complete all core property tracking input validation fields.');
      return;
    }

    try {
      setUploading(true);
      let uploadedPhotoUrl = null;

      // 1. Process bucket file upload stream if file data object exists
      if (photoFile) {
        const fileExtension = photoFile.name.split('.').pop();
        const generatedFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const targetFilePath = `${generatedFileName}`;

        const { error: storageError } = await supabase.storage
          .from('property-photos')
          .upload(targetFilePath, photoFile);

        if (storageError) throw storageError;

        // Extracting Public URL String Node
        const { data: publicUrlData } = supabase.storage
          .from('property-photos')
          .getPublicUrl(targetFilePath);

        uploadedPhotoUrl = publicUrlData?.publicUrl || null;
      }

      // 2. Transmit fully integrated record matrix block payload to remote relational tables
      const payload = {
        title,
        price: parseFloat(price),
        location: locationName,
        lat: latitude ? parseFloat(latitude) : null,
        lng: longitude ? parseFloat(longitude) : null,
        description,
        image_url: uploadedPhotoUrl,
        seller_phone: sellerPhone || null,
        seller_email: sellerEmail || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('properties')
        .insert([payload]);

      if (error) throw error;

      // Flush state trees cleanly upon success execution
      setTitle('');
      setPrice('');
      setLocationName('');
      setLatitude('');
      setLongitude('');
      setDescription('');
      setPhotoFile(null);
      setSellerPhone('');
      setSellerEmail('');
      
      // Clear file inputs cleanly inside DOM trees
      const targetInput = document.getElementById('luxury-photo-uploader-element');
      if (targetInput) targetInput.value = '';
      
      alert('Success: Premium asset logged into global tracking manifest database records.');
      fetchSellerMarketplace();
    } catch (err) {
      alert(`Asset Verification Exception: ${err.message}`);
    } finally {
      setUploading(false);
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@200;300;400;500;600&display=swap');

        :root {
          --gold: #C9A84C;
          --gold-light: #E8C87A;
          --gold-pale: #F5E8C0;
          --border: rgba(201,168,76,0.25);
          --text: #E8DFC8;
          --muted: #8A99B8;
          
          --deep: ${theme === 'midnight' ? '#0A0F1E' : '#040406'};
          --card: ${theme === 'midnight' ? '#131C30' : '#0E0E12'};
          --card2: ${theme === 'midnight' ? '#192340' : '#14141A'};
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
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          display: flex;
          width: 100%;
          box-sizing: border-box;
          position: relative;
        }

        .dashboard-container-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 0% 0%, rgba(201,168,76,0.07) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 100% 100%, ${theme === 'midnight' ? 'rgba(30,60,120,0.2)' : 'rgba(201,168,76,0.02)'} 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-sidebar {
          width: 280px;
          min-width: 280px;
          border-right: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(19,28,48,0.85) 0%, rgba(10,15,30,0.95) 100%);
          backdrop-filter: blur(20px);
          padding: 44px 24px;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }

        .sidebar-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.15em;
          background: linear-gradient(135deg, var(--gold-light), var(--gold), #A07830);
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
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
        }

        .sidebar-link-btn:hover {
          color: var(--gold-light);
          background: rgba(201,168,76,0.05);
          border-color: rgba(201,168,76,0.1);
        }

        .sidebar-link-btn.active {
          color: var(--deep);
          background: linear-gradient(135deg, var(--gold-light), var(--gold));
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(201,168,76,0.25);
        }

        .workspace-viewport {
          flex: 1;
          padding: 50px 50px;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          width: calc(100% - 280px);
        }

        .workspace-header-hero-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 44px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .workspace-header-hero {
          margin: 0;
        }

        .workspace-header-hero p {
          font-size: 11px;
          letter-spacing: 0.3em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 8px;
          margin-top: 0;
        }

        .workspace-header-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 46px;
          font-weight: 300;
          color: #fff;
          margin: 0;
        }

        .header-action-control-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-luxury-pwa-download, .btn-luxury-report-print {
          background: transparent;
          border: 1px solid var(--gold);
          color: var(--gold-light);
          padding: 12px 24px;
          border-radius: 12px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-luxury-pwa-download:hover, .btn-luxury-report-print:hover {
          background: linear-gradient(135deg, var(--gold-light), var(--gold));
          color: var(--deep);
          box-shadow: 0 6px 20px rgba(201,168,76,0.2);
          transform: translateY(-1px);
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
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          box-sizing: border-box;
        }

        .metric-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
        }

        .metric-data-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          color: var(--gold-light);
          font-weight: 600;
        }

        .split-grid-configuration-view {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 28px;
          width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 1300px) {
          .split-grid-configuration-view {
            grid-template-columns: 1fr 380px;
          }
        }

        .luxury-card-panel {
          background: linear-gradient(145deg, var(--card), #101828);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 40px;
          box-shadow: 0 16px 64px rgba(0,0,0,0.5);
          box-sizing: border-box;
          width: 100%;
          margin-bottom: 28px;
        }

        .panel-headline-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          color: #fff;
          margin-top: 0;
          margin-bottom: 8px;
          letter-spacing: 0.02em;
        }

        .panel-sub-text {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 32px;
        }

        .market-group-nav-container {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .market-group-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          padding: 6px 12px;
          transition: all 0.2s;
        }

        .market-group-btn.active {
          color: var(--gold-light);
          border-bottom: 2px solid var(--gold);
          font-weight: 500;
        }

        .region-tab-row-container {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .region-pill-action {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 18px;
          color: var(--text);
          font-size: 12px;
          font-family: 'Jost', sans-serif;
          cursor: pointer;
          transition: all 0.3s;
        }

        .region-pill-action.active, .region-pill-action:hover {
          background: linear-gradient(135deg, var(--gold-light), var(--gold));
          color: var(--deep);
          font-weight: 500;
        }

        .map-viewport-container {
          width: 100%;
          height: 380px;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          background: #111;
        }

        .form-scaffold-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-composite-cluster label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .luxury-field-input, .luxury-textarea-input {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px 18px;
          color: #fff;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }

        .luxury-field-input:focus, .luxury-textarea-input:focus {
          outline: none;
          border-color: var(--gold-light);
        }

        /* NEW: Custom File Upload Wrapper styles */
        .luxury-file-input-wrapper {
          position: relative;
          border: 1px dashed var(--gold);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          background: rgba(201,168,76,0.02);
          transition: all 0.3s;
        }
        .luxury-file-input-wrapper:hover {
          background: rgba(201,168,76,0.05);
          border-color: var(--gold-light);
        }
        .luxury-file-input-hidden {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        .dual-form-row-matrix {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .btn-luxury-submit {
          background: linear-gradient(135deg, var(--gold-light), var(--gold));
          border: none;
          border-radius: 12px;
          padding: 16px 30px;
          color: var(--deep);
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-luxury-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201,168,76,0.3);
        }

        .trend-chart-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trend-node {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: rgba(255,255,255,0.01);
          border-radius: 10px;
          border-left: 3px solid var(--gold);
        }

        .premium-property-row {
          background: rgba(25,35,64,0.2);
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          margin-bottom: 16px;
        }

        .property-financial-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--gold-light);
        }

        .btn-danger-action {
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          border: none;
          border-radius: 12px;
          padding: 14px 36px;
          color: #fff;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          cursor: pointer;
          text-transform: uppercase;
        }

        .theme-selection-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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
          border-color: var(--gold);
          background: rgba(201,168,76,0.08);
        }

        @media(max-width: 900px) {
          .dashboard-container-root { flex-direction: column; }
          .dashboard-sidebar { width: 100%; min-width: 100%; }
          .workspace-viewport { width: 100%; padding: 30px 20px; }
          .workspace-header-hero-container { gap: 12px; }
        }
      `}} />

      <div className="dashboard-container-root">
        
        {/* SIDEBAR NAVIGATION MATRIX */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">Terra Link</div>
          
          <ul className="sidebar-nav-list">
            <li>
              <button 
                type="button"
                className={`sidebar-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span>📊</span> Dashboard Core
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link-btn ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <span>➕</span> List New Asset
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link-btn ${activeTab === 'listings' ? 'active' : ''}`}
                onClick={() => setActiveTab('listings')}
              >
                <span>🏘️</span> Managed Portfolio
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <span>⚙️</span> Settings Panel
              </button>
            </li>
          </ul>
        </aside>

        {/* MAIN WORKSPACE ENGINE VIEWPORT */}
        <main className="workspace-viewport">
          
          {/* HEADER HERO ROW WITH ACTIONS IN TOP RIGHT */}
          <div className="workspace-header-hero-container">
            <div className="workspace-header-hero">
              <p>System Management Console</p>
              <h1>Sovereign Seller Account</h1>
            </div>
            
            <div className="header-action-control-row">
              <button 
                type="button"
                className="btn-luxury-report-print"
                onClick={handlePrintReport}
              >
                🖨️ Print Report
              </button>

              {showInstallBtn && (
                <button 
                  type="button"
                  className="btn-luxury-pwa-download"
                  onClick={handleDownloadClick}
                >
                  📥 Download App
                </button>
              )}
            </div>
          </div>

          {/* TAB OPTION 1: CORE REAL TIME METRICS & FULL GEOMAP OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="metrics-panel-row">
                <div className="metric-luxury-card">
                  <div className="metric-label">Total Listing Views</div>
                  <div className="metric-data-val">{viewsCount}</div>
                </div>
                <div className="metric-luxury-card">
                  <div className="metric-label">Active Buyer Leads</div>
                  <div className="metric-data-val">{leadsCount}</div>
                </div>
                <div className="metric-luxury-card">
                  <div className="metric-label">Platform Verification Seal</div>
                  <div className="metric-data-val" style={{fontSize: '22px', marginTop: '12px', color: '#10b981'}}>Active Verified</div>
                </div>
              </div>

              {/* DYNAMIC SPLIT GRID LAYOUT */}
              <div className="split-grid-configuration-view">
                
                {/* GEOSPATIAL MAP SEGMENT PANEL */}
                <div className="left-map-column-stack">
                  <div className="luxury-card-panel">
                    <h3 className="panel-headline-text">Geospatial Listing Map Portfolio</h3>
                    <div className="panel-sub-text">Monitor your active real estate coordinates on the live interactive grid tracker.</div>
                    
                    {/* Global Continent Filter Navigation Strip */}
                    <div className="market-group-nav-container">
                      {Object.keys(globalCitiesMatrix).map((group) => (
                        <button
                          key={group}
                          type="button"
                          className={`market-group-btn ${activeMarketGroup === group ? 'active' : ''}`}
                          onClick={() => setActiveMarketGroup(group)}
                        >
                          {group}
                        </button>
                      ))}
                    </div>

                    {/* QUICK SELECT NAVIGATION PILLS CONTROLS */}
                    <div className="region-tab-row-container">
                      {globalCitiesMatrix[activeMarketGroup].map((city) => (
                        <button 
                          key={city.name}
                          type="button" 
                          className={`region-pill-action ${selectedRegion === city.name ? 'active' : ''}`} 
                          onClick={() => handleRegionQuickSelect(city.name, city.lat, city.lng)}
                        >
                          {city.label}
                        </button>
                      ))}
                    </div>

                    {/* TRUE GOOGLE MAP INSTANCE FRAME */}
                    <div className="map-viewport-container" id="seller-live-map" />
                  </div>
                </div>

                {/* HISTORICAL ESCROW PERFORMANCE SCORING MATRIX */}
                <div className="luxury-card-panel">
                  <h4 className="panel-headline-text" style={{fontSize: '20px'}}>Marketplace Traffic Trends</h4>
                  <p className="panel-sub-text" style={{fontSize: '11px', marginBottom: '20px'}}>Historical closing benchmarks across quarters.</p>
                  
                  <div className="trend-chart-list">
                    {salesPerformanceData.map((data, idx) => (
                      <div key={idx} className="trend-node">
                        <span style={{fontSize: '13px', color: 'var(--muted)'}}>{data.target}</span>
                        <span style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: '600', color: 'var(--gold-light)'}}>{data.closed}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB OPTION 2: COMPREHENSIVE PROPERTY CREATION FORM SCHEMAS */}
          {activeTab === 'create' && (
            <div className="luxury-card-panel">
              <h3 className="panel-headline-text">Register Premium Real Estate Asset</h3>
              <div className="panel-sub-text">Inject new property coordinate profiles directly into the network tracking matrices.</div>
              
              <form onSubmit={handleCreatePropertyAsset} className="form-scaffold-stack">
                
                {/* NEW FEATURE: Real Estate Architectural Image Stream Upload Node */}
                <div className="input-composite-cluster">
                  <label>Property Visual Showcase Media (Image Upload)</label>
                  <div className="luxury-file-input-wrapper">
                    <span style={{fontSize: '14px', color: photoFile ? 'var(--gold-light)' : 'var(--muted)'}}>
                      {photoFile ? `📸 Selected: ${photoFile.name}` : '✨ Drop architectural files here or tap to explore files'}
                    </span>
                    <input 
                      id="luxury-photo-uploader-element"
                      type="file" 
                      accept="image/*"
                      className="luxury-file-input-hidden"
                      onChange={(e) => setPhotoFile(e.target.files[0] || null)}
                    />
                  </div>
                </div>

                <div className="input-composite-cluster">
                  <label>Property Architectural Designation Name</label>
                  <input type="text" className="luxury-field-input" placeholder="e.g., The Grand Oasis Villa Complex" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* NEW FEATURE: Integrated Broker & Seller Direct Contact Matrix Layer */}
                <div className="dual-form-row-matrix">
                  <div className="input-composite-cluster">
                    <label>Direct Telephone Hot-line Connection</label>
                    <input type="tel" className="luxury-field-input" placeholder="e.g., +255 712 345 678" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} />
                  </div>
                  <div className="input-composite-cluster">
                    <label>Official Concierge Email Account</label>
                    <input type="email" className="luxury-field-input" placeholder="e.g., concierge@luxuryvillas.com" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} />
                  </div>
                </div>

                <div className="dual-form-row-matrix">
                  <div className="input-composite-cluster">
                    <label>Valuation Amount ({currency})</label>
                    <input type="number" className="luxury-field-input" placeholder="e.g., 450000000" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="input-composite-cluster">
                    <label>Geographic Location Context Context</label>
                    <input type="text" className="luxury-field-input" placeholder="e.g., Masaki, Dar es Salaam" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
                  </div>
                </div>

                <div className="dual-form-row-matrix">
                  <div className="input-composite-cluster">
                    <label>Latitude Coordinate Point</label>
                    <input type="text" className="luxury-field-input" placeholder="e.g., -6.7512" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                  </div>
                  <div className="input-composite-cluster">
                    <label>Longitude Coordinate Point</label>
                    <input type="text" className="luxury-field-input" placeholder="e.g., 39.2741" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                  </div>
                </div>

                <div className="input-composite-cluster">
                  <label>Structural Narrative Description Portfolio</label>
                  <textarea rows="4" className="luxury-textarea-input" placeholder="Outline premium architectural insights, structural metrics, escrow policies..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <button type="submit" className="btn-luxury-submit" disabled={uploading}>
                  {uploading ? 'Synching Media & Matrix Nodes...' : '⚡ Publish Asset Configuration'}
                </button>
              </form>
            </div>
          )}

          {/* TAB OPTION 3: REAL TIME ASSETS INVENTORY MATRIX LIST */}
          {activeTab === 'listings' && (
            <div className="luxury-card-panel">
              <h3 className="panel-headline-text">Active Market Manifest Inventory</h3>
              <div className="panel-sub-text">Unified real-time log records mapping to your linked Supabase account profile files.</div>
              
              {loading ? (
                <p>Streaming inventory files...</p>
              ) : myProperties.length === 0 ? (
                <p style={{color: 'var(--muted)', fontSize: '14px'}}>No active listings tracked on your portfolio record tree yet.</p>
              ) : (
                <div>
                  {myProperties.map((item) => (
                    <div key={item.id} className="premium-property-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--gold)' }} 
                          />
                        )}
                        <div>
                          <h4 style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#fff', margin: '0 0 4px 0'}}>{item.title}</h4>
                          <p style={{margin: '0 0 4px 0', fontSize: '13px', color: 'var(--muted)'}}>📍 {item.location} {item.lat && `(${item.lat}, ${item.lng})`}</p>
                          {(item.seller_phone || item.seller_email) && (
                            <p style={{margin: '0', fontSize: '11px', color: 'var(--gold-light)'}}>
                              {item.seller_phone && `📞 ${item.seller_phone}`} {item.seller_email && ` ✉️ ${item.seller_email}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="property-financial-value">
                        {currency} {Number(item.price || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB OPTION 4: SYSTEM BACKEND PREFERENCES CONFIGURATION PANEL */}
          {activeTab === 'settings' && (
            <div className="luxury-card-panel">
              <h3 className="panel-headline-text">Console Preferences & Configurations</h3>
              <div className="panel-sub-text">Adjust runtime settings or safely flush runtime credentials.</div>
              
              <hr style={{border: 'none', borderTop: '1px solid rgba(201,168,76,0.1)', margin: '24px 0'}} />
              
              <h4 style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#fff', marginBottom: '16px'}}>Interface Visual Backdrops</h4>
              <div className="theme-selection-row" style={{marginBottom: '32px'}}>
                <div className={`theme-card-node ${theme === 'midnight' ? 'active' : ''}`} onClick={() => setTheme('midnight')}>Midnight Sapphire</div>
                <div className={`theme-card-node ${theme === 'imperial' ? 'active' : ''}`} onClick={() => setTheme('imperial')}>Imperial Onyx</div>
              </div>

              <hr style={{border: 'none', borderTop: '1px solid rgba(201,168,76,0.1)', margin: '24px 0'}} />

              <h4 style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#fff', marginBottom: '16px'}}>Account Controls</h4>
              <button type="button" className="btn-danger-action" onClick={handleSignOut}>
                🚪 Terminate Identity Session (Logout)
              </button>
            </div>
          )}

        </main>
      </div>
    </>
  );
}