// ===================================================
// src/views/AuthView.jsx — Authentication & Demo Personas
// ===================================================

import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Cpu, LogIn, UserPlus, Sparkles, Shield, Users, ArrowRight } from 'lucide-react';

export function AuthView() {
  const { login, register, loginAsDemo, authError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, username, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0a0d14 70%)',
      }}
    >
      <div style={{ maxWidth: '960px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
        {/* Left Column: Project Identity & Demo Switcher */}
        <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <Cpu size={26} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                  Skill<span className="gradient-text">Cloud</span>
                </h1>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Cloud Computing Course Project
                </div>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              A cloud-native skills analytics engine with real-time practice logging, streak gamification, milestone tracking, and decentralized community sharing.
            </p>

            {/* 1-Click Demo Accounts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  1-Click Test Demo Personas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.email}
                    onClick={() => loginAsDemo(demo.email)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{demo.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{demo.role}</div>
                    </div>
                    <ArrowRight size={15} color="var(--accent-primary)" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🔒 Stateless JWT Authentication · Cloud SQL / SQLite Database · Simulated Cloud Object Storage
          </div>
        </div>

        {/* Right Column: Custom Auth Form */}
        <div className="glass-panel" style={{ padding: '36px' }}>
          {/* Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <button
              onClick={() => setIsRegister(false)}
              style={{
                flex: 1,
                padding: '10px',
                background: !isRegister ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: !isRegister ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                border: 'none',
                borderBottom: !isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              style={{
                flex: 1,
                padding: '10px',
                background: isRegister ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: isRegister ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                border: 'none',
                borderBottom: isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>

          {(localError || authError) && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '18px', fontSize: '0.85rem' }}>
              {localError || authError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Maya Lin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. mayalin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '10px' }}>
              {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
              <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In to Dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
