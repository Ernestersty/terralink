import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './pages/Auth';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1. Check active session on initial page load
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id, session.user);
      }
      setInitializing(false);
    };

    checkUserSession();

    // 2. Listen to real-time auth changes (Sign In, Sign Out, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id, session.user);
      } else {
        setUser(null);
        setRole(null);
      }
      setInitializing(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to reliably fetch the user's role
  const fetchUserRole = async (userId, userObject) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data?.role) {
        setRole(data.role);
      } else {
        // Fallback to metadata if profile table doesn't have it yet
        setRole(userObject.user_metadata?.role || 'buyer');
      }
    } catch (err) {
      setRole(userObject.user_metadata?.role || 'buyer');
    }
  };

  // Prevent flashing the login page while checking the active database session
  if (initializing) {
    return (
      <div style={{
        background: '#0A0F1E', 
        color: '#E8DFC8', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        Loading Secure System...
      </div>
    );
  }

  // 3. MASTER ROUTER CONDITIONAL SWITCH
  if (!user) {
    return <Auth onAuthSuccess={(authenticatedUser, authenticatedRole) => {
      setUser(authenticatedUser);
      setRole(authenticatedRole);
    }} />;
  }

  // If logged in, conditionally render dashboards based on user status
  return role === 'seller' ? <SellerDashboard /> : <BuyerDashboard />;
}