// ===================================================
// src/components/CloudArchitectureModal.jsx — Architecture Inspector
// ===================================================

import React, { useState, useEffect } from 'react';
import { api, getToken } from '../api';
import { 
  X, 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Layers,
  Key
} from 'lucide-react';

export function CloudArchitectureModal({ isOpen, onClose }) {
  const [healthData, setHealthData] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await api.getHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setHealthData(res);
    } catch (err) {
      setHealthData({ status: 'offline', error: err.message });
      setLatencyMs(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const token = getToken();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={22} color="var(--accent-primary)" />
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Cloud Architecture & Services Map</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                System topology, REST API microservices, and live diagnostics
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Live Cloud Status Banner */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: healthData?.status === 'healthy' ? 'var(--color-success)' : 'var(--color-danger)',
                  boxShadow: `0 0 10px ${healthData?.status === 'healthy' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Cloud API Gateway: {healthData?.status === 'healthy' ? 'Operational & Healthy' : 'Service Offline'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Round-trip API Latency: <strong style={{ color: 'var(--text-primary)' }}>{latencyMs !== null ? `${latencyMs} ms` : 'N/A'}</strong> · Environment: <strong style={{ color: 'var(--text-primary)' }}>Local Simulation / Hybrid Cloud Ready</strong>
                </div>
              </div>
            </div>
            <button
              onClick={testConnection}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'flame-icon' : ''} />
              <span>Ping Cloud</span>
            </button>
          </div>

          {/* Architecture 4-Tier Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* Tier 1: Client */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                <Layers size={18} />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>1. Client SPA Tier</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                • React 18 + Vite Frontend<br />
                • Glassmorphism Design System<br />
                • Responsive Grid & Live Timers<br />
                • Client-Side Routing
              </p>
            </div>

            {/* Tier 2: API Gateway & Auth */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '8px' }}>
                <ShieldCheck size={18} />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>2. Security & Auth</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                • Stateless JWT Bearer Auth<br />
                • Argon2 / PBKDF2 Password Hash<br />
                • CORS Policy Security Filter<br />
                • Role-Based Access Control
              </p>
            </div>

            {/* Tier 3: Compute */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '8px' }}>
                <Server size={18} />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>3. REST Compute</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                • Flask Application Factory<br />
                • Modular Blueprint Architecture<br />
                • Streaks & Gamification Engine<br />
                • Real-Time Analytics Pipeline
              </p>
            </div>

            {/* Tier 4: Storage */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
                <HardDrive size={18} />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>4. Cloud Storage</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                • SQLAlchemy ORM (Cloud SQL / RDS)<br />
                • Simulated S3 / GCS Object Bucket<br />
                • File Verification & Size Caps<br />
                • Database Indexing & Cascades
              </p>
            </div>
          </div>

          {/* JWT Token Inspector */}
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Key size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '0.9rem', margin: 0 }}>Active JWT Session Token</h4>
            </div>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#93c5fd',
                wordBreak: 'break-all',
              }}
            >
              {token ? token : 'No active JWT token found. Log in to authenticate.'}
            </div>
          </div>

          {/* Production Deployment Mapping */}
          <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Free-Tier Cloud Mapping:</strong> Frontend deploys to <em>Vercel / Netlify</em>; REST backend deploys to <em>Render / Google Cloud Run</em>; Database connects to <em>Supabase / Neon Postgres</em>; Object storage targets <em>Cloudflare R2 / AWS S3 Free Tier</em>.
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
