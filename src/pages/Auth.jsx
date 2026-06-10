import React, { useState } from 'react';
import { supabase } from '/src/supabaseClient.js';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('buyer'); // 'buyer' or 'seller'
  const [loading, setLoading] = useState(false);

  // REDIRECT ROUTING ENGINE
  const handleRedirect = (user, role) => {
    if (onAuthSuccess) {
      // Pass both user data and explicit metadata role up to your master App.jsx switch window
      onAuthSuccess(user, role);
      return;
    }

    // Fallback native client routing if App.jsx handles state via local window storage
    if (role === 'seller') {
      window.location.href = '/seller-dashboard';
    } else {
      window.location.href = '/buyer-dashboard';
    }
  };

  const handleAuthentication = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. SIGN UP DISPATCH
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: userRole,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          // Explicitly register user metadata map structure in public profiles table
          await supabase
            .from('profiles')
            .insert([{ id: data.user.id, role: userRole, email: email }]);

          // ROUTE IMMEDIATELY ON SIGNUP (If email auto-confirm toggle is set to OFF in settings)
          handleRedirect(data.user, userRole);
        }

      } else {
        // 2. SIGN IN DISPATCH
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Look up user's designated account classification from metadata or profiles table
          const sessionRole = data.user.user_metadata?.role || 'buyer';
          
          // Double-check profile table database fallbacks to ensure accurate authorization routing
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          const finalRole = profile?.role || sessionRole;

          // ROUTE IMMEDIATELY ON SIGNIN
          handleRedirect(data.user, finalRole);
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
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

        .auth-container {
          background: var(--deep);
          color: var(--text);
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .auth-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 20%, rgba(201,168,76,0.09) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(30,60,120,0.25) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .auth-container::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 0;
        }

        .auth-paper {
          background: linear-gradient(145deg, rgba(19,28,48,0.9), rgba(25,35,64,0.85));
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 440px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 24px 70px rgba(0,0,0,0.6),
            0 1px 0 rgba(201,168,76,0.25) inset,
            0 0 50px rgba(201,168,76,0.03);
          position: relative;
          z-index: 1;
          transform: perspective(1000px) rotateX(2deg);
          animation: paperFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes paperFadeIn {
          from { opacity: 0; transform: perspective(1000px) rotateX(10deg) translateY(20px); }
          to   { opacity: 1; transform: perspective(1000px) rotateX(2deg) translateY(0); }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .auth-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 0.15em;
          background: linear-gradient(135deg, var(--gold-light), var(--gold), #A07830);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .auth-subtitle {
          font-size: 11px;
          color: var(--gold);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .form-group {
          margin-bottom: 22px;
          position: relative;
        }

        .form-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
          margin-bottom: 8px;
          font-weight: 400;
        }

        .input-control {
          width: 100%;
          background: rgba(10,15,30,0.6);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          letter-spacing: 0.03em;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-control:focus {
          outline: none;
          border-color: var(--gold-light);
          background: rgba(16,24,48,0.8);
          box-shadow: 0 0 15px rgba(201,168,76,0.1);
        }

        .role-selector-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: rgba(10,15,30,0.5);
          padding: 6px;
          border-radius: 14px;
          border: 1px solid rgba(201,168,76,0.1);
          margin-top: 6px;
        }

        .role-tab {
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 10px;
          font-size: 12px;
          letter-spacing: 0.06em;
          color: var(--muted);
          transition: all 0.25s;
          user-select: none;
        }

        .role-tab input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .role-tab.active {
          background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05));
          border: 1px solid rgba(201,168,76,0.3);
          color: var(--gold-light);
          font-weight: 500;
        }

        .btn-submit-luxury {
          width: 100%;
          background: linear-gradient(135deg, var(--gold-light), var(--gold));
          border: none;
          border-radius: 12px;
          padding: 14px;
          color: var(--deep);
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 10px;
          box-shadow: 0 4px 20px rgba(201,168,76,0.25);
        }

        .btn-submit-luxury:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(201,168,76,0.4);
        }

        .btn-submit-luxury:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .toggle-footer-action {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: var(--muted);
          letter-spacing: 0.03em;
        }

        .toggle-link-btn {
          background: none;
          border: none;
          color: var(--gold-light);
          text-decoration: underline;
          cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          padding: 0 4px;
        }
      `}} />

      <div className="auth-container">
        <div className="auth-paper">
          
          <div className="auth-header">
            <div className="auth-brand">Terralink</div>
            <div className="auth-subtitle">
              {isSignUp ? 'Create Gateway Account' : 'Secure Dashboard Access'}
            </div>
          </div>

          <form onSubmit={handleAuthentication} autoComplete="off">
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email"
                required
                className="input-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password"
                required
                className="input-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Account Classification</label>
                <div className="role-selector-box">
                  
                  <label className={`role-tab ${userRole === 'buyer' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="buyer"
                      checked={userRole === 'buyer'}
                      onChange={() => setUserRole('buyer')}
                    />
                    ✦ Buy Properties
                  </label>

                  <label className={`role-tab ${userRole === 'seller' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="seller"
                      checked={userRole === 'seller'}
                      onChange={() => setUserRole('seller')}
                    />
                    ✦ Sell Properties
                  </label>

                </div>
              </div>
            )}

            <button type="submit" className="btn-submit-luxury" disabled={loading}>
              {loading ? 'Processing System...' : isSignUp ? 'Sign Up Account' : 'Sign In'}
            </button>

          </form>

          <div className="toggle-footer-action">
            {isSignUp ? (
              <>
                Already have an account? 
                <button type="button" className="toggle-link-btn" onClick={() => setIsSignUp(false)}>
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account? 
                <button type="button" className="toggle-link-btn" onClick={() => setIsSignUp(true)}>
                  Sign Up
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}