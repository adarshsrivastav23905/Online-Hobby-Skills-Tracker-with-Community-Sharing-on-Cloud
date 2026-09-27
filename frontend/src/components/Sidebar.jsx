// ===================================================
// src/components/Sidebar.jsx — Navigation Sidebar
// ===================================================

import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Timer, 
  MessageSquareShare, 
  BarChart3, 
  Users2, 
  CloudRain, 
  Cpu,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skills', label: 'Skills & Goals', icon: Sparkles },
    { id: 'practice', label: 'Practice Logger', icon: Timer },
    { id: 'feed', label: 'Community Feed', icon: MessageSquareShare },
    { id: 'analytics', label: 'Analytics & Badges', icon: BarChart3 },
    { id: 'community', label: 'Peers & Network', icon: Users2 },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '260px',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        borderRadius: 0,
        borderRight: '1px solid var(--border-color)',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
      }}
    >
      <div>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 10px 24px 10px', borderBottom: '1px solid var(--border-color)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Skill<span className="gradient-text">Cloud</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Cloud Computing Project
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '24px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '6px',
                      bottom: '6px',
                      width: '4px',
                      background: 'var(--accent-primary)',
                      borderRadius: '0 4px 4px 0',
                      boxShadow: '0 0 10px var(--accent-primary)',
                    }}
                  />
                )}
                <Icon size={19} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Mini Profile Card */}
      <div
        className="glass-panel"
        style={{
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--accent-gradient-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Student User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              @{user?.username || 'user'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
