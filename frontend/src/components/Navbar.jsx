// ===================================================
// src/components/Navbar.jsx — Top Navigation Bar
// ===================================================

import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { api } from '../api';
import { 
  PlusCircle, 
  Flame, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  LogOut, 
  Users,
  Layers,
  ChevronDown
} from 'lucide-react';

export function Navbar({ activeTab, onOpenLogModal, onOpenCloudModal, stats }) {
  const { user, logout, loginAsDemo } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('healthy'); // 'healthy' | 'checking' | 'error'

  useEffect(() => {
    const checkCloud = async () => {
      try {
        const res = await api.getHealth();
        if (res.status === 'healthy') {
          setCloudStatus('healthy');
        } else {
          setCloudStatus('error');
        }
      } catch (err) {
        setCloudStatus('error');
      }
    };
    checkCloud();
    const interval = setInterval(checkCloud, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'skills': return 'My Skills & Goals';
      case 'practice': return 'Practice Log & Timer';
      case 'feed': return 'Community Feed';
      case 'analytics': return 'Analytics & Achievements';
      case 'community': return 'Skill Community & Peers';
      default: return 'SkillCloud';
    }
  };

  return (
    <header className="glass-panel" style={{
      margin: '20px 30px 0 30px',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '15px',
      zIndex: 50,
    }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
          {getPageTitle()}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          Cloud-Powered Hobby & Skills Intelligence Engine
        </p>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Streak Quick Beacon */}
        {stats && stats.current_streak > 0 && (
          <div className="badge badge-streak" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            <span className="flame-icon">🔥</span> {stats.current_streak} Day Streak
          </div>
        )}

        {/* Cloud Architecture Beacon */}
        <button
          onClick={onOpenCloudModal}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Inspect Cloud Architecture"
        >
          <Cloud size={16} color="var(--accent-primary)" />
          <span>Cloud Status:</span>
          {cloudStatus === 'healthy' ? (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Active
            </span>
          ) : (
            <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={13} /> Offline
            </span>
          )}
        </button>

        {/* Quick Log Practice Button */}
        <button onClick={onOpenLogModal} className="btn btn-primary btn-sm">
          <PlusCircle size={16} />
          <span>Log Practice</span>
        </button>

        {/* Demo User Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>Switch User</span>
            <ChevronDown size={14} />
          </button>

          {demoMenuOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: '240px',
                padding: '8px',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Demo Personas
              </div>
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => {
                    loginAsDemo(demo.email);
                    setDemoMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: user?.email === demo.email ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: user?.email === demo.email ? 'var(--accent-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.85rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = user?.email === demo.email ? 'rgba(99, 102, 241, 0.15)' : 'transparent'}
                >
                  <span style={{ fontWeight: 600 }}>{demo.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{demo.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#fff',
              boxShadow: '0 2px 8px var(--accent-glow)',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-icon"
            title="Log Out"
            style={{ width: '34px', height: '34px' }}
          >
            <LogOut size={15} color="var(--color-danger)" />
          </button>
        </div>
      </div>
    </header>
  );
}
