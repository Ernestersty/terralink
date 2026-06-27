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
    title: '',
    location: '',
    price: '',
    description: '',
    image: null,
    lat: null,
    lng: null
  });
  const { handleDownloadClick } = usePwaDownload();

  useEffect(() => {
    fetchSellerData();
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?v=weekly&key=';
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
  };

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
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            if (window.sellerMarker) window.sellerMarker.setMap(null);

            window.sellerMarker = new window.google.maps.Marker({
              position: { lat, lng },
              map: window.sellerMapInstance,
              title: 'Property Location',
              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            });

            setNewProperty(prev => ({ ...prev, lat, lng }));
          });
        }
      }, 100);
    }
  }, [showCreateProperty, mapLoaded]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        setCurrentSellerId(user.id);
        const { data: propsData, error: propsError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (propsError) throw propsError;
        setProperties(propsData || []);
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

  const handleImageUpload = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('property_images')
        .upload(`${currentSellerId}/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('property_images')
        .getPublicUrl(`${currentSellerId}/${fileName}`);
      return publicUrl;
    } catch (err) {
      alert('Error uploading image: ' + err.message);
      return null;
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      if (!newProperty.title || !newProperty.location || !newProperty.price) {
        alert('Please fill in all fields');
        return;
      }
      if (!newProperty.lat || !newProperty.lng) {
        alert('Please click on the map to set the property location');
        return;
      }
      let imageUrl = null;
      if (newProperty.image) {
        imageUrl = await handleImageUpload(newProperty.image);
      }
      const { error } = await supabase
        .from('properties')
        .insert([{
          title: newProperty.title,
          location: newProperty.location,
          price: parseFloat(newProperty.price),
          description: newProperty.description,
          image_url: imageUrl,
          user_id: currentSellerId,
          lat: newProperty.lat,
          lng: newProperty.lng
        }]);
      if (error) throw error;
      alert('✓ Property listed with location marker!');
      setNewProperty({ title: '', location: '', price: '', description: '', image: null, lat: null, lng: null });
      setShowCreateProperty(false);
      window.sellerMapInstance = null;
      if (window.sellerMarker) window.sellerMarker.setMap(null);
      fetchSellerData();
    } catch (err) {
      alert('Error: ' + err.message);
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
          html, body { margin: 0; padding: 0; background: var(--deep); color: var(--text); font-family: 'Inter', sans-serif; }
          .seller-dashboard { min-height: 100vh; display: flex; flex-direction: column; }
        `
      }} />

      <div className="seller-dashboard">
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(0, 194, 203, 0.2)',
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontFamily: "'Montserrat', sans-serif" }}>🏢 Seller Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleDownloadClick} style={{
              backgroundColor: 'rgba(0, 194, 203, 0.1)', border: '1px dashed var(--teal)', color: 'var(--teal-light)',
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            }}>📥 Download App</button>
            <button onClick={handleSignOut} style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444',
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            }}>🔒 Log Out</button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 194, 203, 0.1)', backgroundColor: 'var(--deep)' }}>
          {['dashboard', 'properties', 'transactions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '16px', border: 'none',
              backgroundColor: activeTab === tab ? 'rgba(0, 194, 203, 0.15)' : 'transparent',
              color: activeTab === tab ? 'var(--teal)' : 'var(--muted)',
              cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: activeTab === tab ? '2px solid var(--teal)' : 'none',
            }}>
              {tab === 'dashboard' && '📊 Overview'}
              {tab === 'properties' && '🗺️ My Properties'}
              {tab === 'transactions' && '💳 Transactions'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(0, 194, 203, 0.2)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Total Earnings</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--teal-light)', fontFamily: "'Montserrat', sans-serif" }}>TZS {totalEarnings.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(0, 194, 203, 0.2)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Active Listings</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--teal-light)', fontFamily: "'Montserrat', sans-serif" }}>{properties.length}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(0, 194, 203, 0.2)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Pending Payments</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#f59e0b', fontFamily: "'Montserrat', sans-serif" }}>{pendingPayments}</div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ marginTop: 0, fontFamily: "'Montserrat', sans-serif" }}>Your Listed Properties</h3>
                <button onClick={() => setShowCreateProperty(!showCreateProperty)} style={{
                  backgroundColor: 'var(--teal)', color: 'var(--deep)', border: 'none', padding: '12px 24px',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                }}>{showCreateProperty ? '✕ Cancel' : '+ Add New Property'}</button>
              </div>

              {showCreateProperty && (
                <form onSubmit={handleCreateProperty} style={{
                  backgroundColor: 'rgba(51, 65, 85, 0.3)', border: '1px solid rgba(0, 194, 203, 0.2)',
                  borderRadius: '14px', padding: '24px', marginBottom: '32px',
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Property Title</label>
                    <input type="text" value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 194, 203, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text)', boxSizing: 'border-box',
                    }} placeholder="e.g., Luxury Villa in Masaki" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Location Name</label>
                    <input type="text" value={newProperty.location} onChange={(e) => setNewProperty({...newProperty, location: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 194, 203, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text)', boxSizing: 'border-box',
                    }} placeholder="e.g., Dar es Salaam" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Price (TZS)</label>
                    <input type="number" value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 194, 203, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text)', boxSizing: 'border-box',
                    }} placeholder="500000000" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
                    <textarea value={newProperty.description} onChange={(e) => setNewProperty({...newProperty, description: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 194, 203, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text)', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit',
                    }} placeholder="Describe your property..." />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Property Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setNewProperty({...newProperty, image: e.target.files?.[0]})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 194, 203, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text)', boxSizing: 'border-box', cursor: 'pointer',
                    }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>🗺️ Set Location on Map (Click to place marker)</label>
                    <div id="property-location-map" style={{
                      width: '100%', height: '400px', borderRadius: '8px', border: '1px solid rgba(0, 194, 203, 0.2)', marginBottom: '12px',
                    }} />
                    {newProperty.lat && newProperty.lng && (
                      <div style={{
                        backgroundColor: 'rgba(0, 194, 203, 0.1)', padding: '12px', borderRadius: '8px',
                        border: '1px solid rgba(0, 194, 203, 0.3)', fontSize: '13px',
                      }}>✓ Location fixed: <strong>Lat: {newProperty.lat.toFixed(4)}, Lng: {newProperty.lng.toFixed(4)}</strong></div>
                    )}
                  </div>
                  <button type="submit" style={{
                    width: '100%', backgroundColor: 'var(--teal)', color: 'var(--deep)', border: 'none', padding: '14px',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px',
                  }}>🚀 List Property</button>
                </form>
              )}

              {loading ? <p>Loading properties...</p> : properties.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No properties listed yet. Create your first listing!</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {properties.map(prop => (
                    <div key={prop.id} style={{
                      backgroundColor: 'rgba(51, 65, 85, 0.3)', border: '1px solid rgba(0, 194, 203, 0.15)',
                      borderRadius: '12px', overflow: 'hidden',
                    }}>
                      {prop.image_url && <img src={prop.image_url} alt={prop.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>{prop.title}</h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--muted)' }}>📍 {prop.location}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--teal-light)' }}>📌 Lat: {prop.lat?.toFixed(4)}, Lng: {prop.lng?.toFixed(4)}</p>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--teal-light)' }}>TZS {Number(prop.price || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 style={{ marginTop: 0, fontFamily: "'Montserrat', sans-serif" }}>Recent Transactions</h3>
              {loading ? <p>Loading...</p> : transactions.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No transactions yet.</p>
              ) : (
                <div>
                  {transactions.map(txn => (
                    <div key={txn.id} style={{
                      backgroundColor: 'rgba(51, 65, 85, 0.3)', border: '1px solid rgba(0, 194, 203, 0.15)',
                      borderRadius: '12px', padding: '16px', marginBottom: '12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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
