// ===================================================
// src/views/PracticeView.jsx — Practice Logger & Timer
// ===================================================

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  Sparkles,
  PlusCircle,
  FileText
} from 'lucide-react';

export function PracticeView({ skills, onSessionLogged }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [filterSkillId, setFilterSkillId] = useState('ALL');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  
  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (skills && skills.length > 0 && !selectedSkillId) {
      setSelectedSkillId(skills[0].id);
    }
  }, [skills]);

  // Fetch practice history
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const skillFilter = filterSkillId === 'ALL' ? null : filterSkillId;
      const res = await api.getPracticeSessions(skillFilter);
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to fetch practice history:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filterSkillId]);

  // Stopwatch interval
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (!timerRunning && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, seconds]);

  const formatTimer = () => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let minutesToLog = durationMinutes;
    if (seconds > 0) {
      minutesToLog = Math.max(1, Math.round(seconds / 60));
    }

    try {
      const res = await api.logPractice({
        skill_id: parseInt(selectedSkillId),
        duration_minutes: parseInt(minutesToLog),
        activity: activity.trim() || 'General Practice',
        notes: notes.trim(),
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setTimerRunning(false);
      setSeconds(0);
      setActivity('');
      setNotes('');
      fetchSessions();
      if (onSessionLogged) onSessionLogged(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Practice Logger & Live Timer</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
          Record deliberate practice sessions, track focus time with the live stopwatch, and build daily consistency.
        </p>
      </div>

      {/* Main Grid: Logger Card + Live Timer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Practice Entry Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={19} color="var(--accent-primary)" />
            <span>Log a Practice Session</span>
          </h3>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '16px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Skill Selector */}
            <div className="input-group">
              <label className="input-label">Skill / Hobby *</label>
              <select
                className="input-control"
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                required
              >
                {skills && skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.skill_name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="input-group">
              <label className="input-label">Duration (Minutes) *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  className="input-control"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                />
              </div>
              {/* Presets */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[15, 25, 45, 60, 90, 120].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      background: durationMinutes === mins ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Focus */}
            <div className="input-group">
              <label className="input-label">Focus Area / Activity Name</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Practiced chord transitions, Completed CSS grid layout"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              />
            </div>

            {/* Reflection Notes */}
            <div className="input-group">
              <label className="input-label">Session Notes & Reflections</label>
              <textarea
                className="input-control"
                placeholder="Key takeaways, breakthroughs, or things to practice next time..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
              <CheckCircle2 size={16} />
              {loading ? 'Recording to Cloud...' : 'Save Practice Session'}
            </button>
          </form>
        </div>

        {/* Live Stopwatch Card */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(30, 27, 75, 0.5) 100%)',
          }}
        >
          <div className="badge badge-streak" style={{ marginBottom: '14px' }}>
            <span className="flame-icon">🔥</span> Live Focus Timer
          </div>

          <div
            style={{
              fontSize: '3.6rem',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              letterSpacing: '3px',
              textShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              margin: '10px 0 24px 0',
            }}
          >
            {formatTimer()}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {!timerRunning ? (
              <button
                onClick={() => setTimerRunning(true)}
                className="btn btn-primary btn-lg"
              >
                <Play size={18} /> Start Session
              </button>
            ) : (
              <button
                onClick={() => setTimerRunning(false)}
                className="btn btn-secondary btn-lg"
              >
                <Pause size={18} /> Pause Session
              </button>
            )}

            <button
              onClick={() => {
                setTimerRunning(false);
                setSeconds(0);
              }}
              className="btn btn-secondary btn-icon"
              style={{ width: '48px', height: '48px' }}
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            {seconds > 0 && (
              <button
                onClick={() => {
                  setTimerRunning(false);
                  const mins = Math.max(1, Math.round(seconds / 60));
                  setDurationMinutes(mins);
                }}
                className="btn btn-outline"
              >
                Apply to Form ({Math.max(1, Math.round(seconds / 60))}m)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Practice Log History Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Practice History Log</h3>
          </div>

          {/* Filter by skill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-secondary)" />
            <select
              className="input-control"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              value={filterSkillId}
              onChange={(e) => setFilterSkillId(e.target.value)}
            >
              <option value="ALL">All Skills</option>
              {skills && skills.map((s) => (
                <option key={s.id} value={s.id}>{s.skill_name}</option>
              ))}
            </select>
          </div>
        </div>

        {sessionsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Loading history...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No practice sessions found. Log your first session above!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px' }}>Skill</th>
                  <th style={{ padding: '10px' }}>Activity</th>
                  <th style={{ padding: '10px' }}>Duration</th>
                  <th style={{ padding: '10px' }}>Notes</th>
                  <th style={{ padding: '10px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess) => (
                  <tr key={sess.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                      {sess.skill_name || 'General'}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                      {sess.activity || 'Practice'}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      +{sess.duration_minutes} min
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sess.notes || '—'}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(sess.practiced_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
