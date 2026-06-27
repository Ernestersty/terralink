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
          description: newProperty.description || '',
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
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Jost:wght@300;400;500;600&display=swap');
          :root {
            --gold: #C9A84C;
            --gold-light: #E8C87A;
            --gold-pale: #F5E8C0;
            --deep: #0A0F1E;
            --navy: #111827;
            --card: #131C30;
            --card2: #192340;
            --border: rgba(201,168,76,0.22);
            --text: #E8DFC8;
            --muted: #8A99B8;
          }
          html, body { margin: 0; padding: 0; background: var(--deep); color: var(--text); font-family: 'Jost', sans-serif; }
          .seller-dashboard { min-height: 100vh; display: flex; flex-direction: column; }
        `
      }} />

      <div className="seller-dashboard">
        <div style={{
          backgroundColor: 'rgba(19, 28, 48, 0.9)',
          borderBottom: '1px solid var(--border)',
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.1em', color: 'var(--gold-light)' }}>🏢 SELLER DASHBOARD</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleDownloadClick} style={{
              backgroundColor: 'rgba(201, 168, 76, 0.1)', border: '1px dashed var(--gold)', color: 'var(--gold-light)',
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            }}>📥 Download App</button>
            <button onClick={handleSignOut} style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444',
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            }}>🔒 Log Out</button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--deep)' }}>
          {['dashboard', 'properties', 'transactions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '16px', border: 'none',
              backgroundColor: activeTab === tab ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
              color: activeTab === tab ? 'var(--gold)' : 'var(--muted)',
              cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: activeTab === tab ? '2px solid var(--gold)' : 'none',
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
              <div style={{ backgroundColor: 'linear-gradient(145deg, rgba(19, 28, 48, 0.6), rgba(25, 35, 64, 0.5))', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Total Earnings</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--gold-light)', fontFamily: "'Cormorant Garamond', serif" }}>TZS {totalEarnings.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: 'linear-gradient(145deg, rgba(19, 28, 48, 0.6), rgba(25, 35, 64, 0.5))', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Active Listings</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--gold-light)', fontFamily: "'Cormorant Garamond', serif" }}>{properties.length}</div>
              </div>
              <div style={{ backgroundColor: 'linear-gradient(145deg, rgba(19, 28, 48, 0.6), rgba(25, 35, 64, 0.5))', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Pending Payments</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif" }}>{pendingPayments}</div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ marginTop: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: 'var(--gold-light)' }}>Your Listed Properties</h3>
                <button onClick={() => setShowCreateProperty(!showCreateProperty)} style={{
                  backgroundColor: 'var(--gold)', color: 'var(--deep)', border: 'none', padding: '12px 24px',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                }}>
                  {showCreateProperty ? '✕ Cancel' : '+ Add New Property'}
                </button>
              </div>

              {showCreateProperty && (
                <form onSubmit={handleCreateProperty} style={{
                  backgroundColor: 'linear-gradient(145deg, rgba(19, 28, 48, 0.6), rgba(25, 35, 64, 0.5))', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '24px', marginBottom: '32px',
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--gold)' }}>Property Title</label>
                    <input type="text" value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                      backgroundColor: 'rgba(10, 15, 30, 0.6)', color: 'var(--text)', boxSizing: 'border-box',
                    }} placeholder="e.g., Luxury Villa in Masaki" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--gold)' }}>Location Name</label>
                    <input type="text" value={newProperty.location} onChange={(e) => setNewProperty({...newProperty, location: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                      backgroundColor: 'rgba(10, 15, 30, 0.6)', color: 'var(--text)', boxSizing: 'border-box',
                    }} placeholder="e.g., Dar es Salaam" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--gold)' }}>Price (TZS)</label>
                    <input type="number" value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                      backgroundColor: 'rgba(10, 15, 30, 0.6)', color: 'var(--text)', boxSizing: 'border-box',
                    }} placeholder="500000000" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--gold)' }}>Description</label>
                    <textarea value={newProperty.description} onChange={(e) => setNewProperty({...newProperty, description: e.target.value})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                      backgroundColor: 'rgba(10, 15, 30, 0.6)', color: 'var(--text)', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit',
                    }} placeholder="Describe your property..." />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--gold)' }}>Property Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setNewProperty({...newProperty, image: e.target.files?.[0]})} style={{
                      width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                      backgroundColor: 'rgba(10, 15, 30, 0.6)', color: 'var(--text)', boxSizing: 'border-box', cursor: 'pointer',
                    }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--gold)' }}>🗺️ Set Location on Map (Click to place marker)</label>
                    <div id="property-location-map" style={{
                      width: '100%', height: '400px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px',
                    }} />
                    {newProperty.lat && newProperty.lng && (
                      <div style={{
                        backgroundColor: 'rgba(201, 168, 76, 0.1)', padding: '12px', borderRadius: '8px',
                        border: '1px solid var(--border)', fontSize: '13px', color: 'var(--gold-light)'
                      }}>✓ Location fixed: <strong>Lat: {newProperty.lat.toFixed(4)}, Lng: {newProperty.lng.toFixed(4)}</strong></div>
                    )}
                  </div>
                  <button type="submit" style={{
                    width: '100%', backgroundColor: 'var(--gold)', color: 'var(--deep)', border: 'none', padding: '14px',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', fontFamily: 'inherit'
                  }}>🚀 List Property</button>
                </form>
              )}

              {loading ? <p>Loading properties...</p> : properties.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No properties listed yet. Create your first listing!</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {properties.map(prop => (
                    <div key={prop.id} style={{
                      backgroundColor: 'linear-gradient(145deg, rgba(19, 28, 48, 0.6), rgba(25, 35, 64, 0.5))', border: '1px solid var(--border)',
                      borderRadius: '12px', overflow: 'hidden',
                    }}>
                      {prop.image_url && <img src={prop.image_url} alt={prop.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold-light)' }}>{prop.title}</h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--muted)' }}>📍 {prop.location}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--gold)' }}>📌 Lat: {prop.lat?.toFixed(4)}, Lng: {prop.lng?.toFixed(4)}</p>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gold-light)' }}>TZS {Number(prop.price || 0).toLocaleString()}</div>
                        {prop.description && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text)', fontStyle: 'italic' }}>
                            {prop.description.length > 50 ? prop.description.substring(0, 50) + '...' : prop.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 style={{ marginTop: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: 'var(--gold-light)' }}>Recent Transactions</h3>
              {loading ? <p>Loading...</p> : transactions.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No transactions yet.</p>
              ) : (
                <div>
                  {transactions.map(txn => (
                    <div key={txn.id} style={{
                      backgroundColor: 'linear-gradient(145deg, rgba(19, 28, 48, 0.6), rgba(25, 35, 64, 0.5))', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '16px', marginBottom: '12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--gold-light)' }}>Ref: {txn.payment_reference}</div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{new Date(txn.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gold-light)', marginBottom: '4px' }}>TZS {Number(txn.amount_total * 0.98).toLocaleString()}</div>
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
