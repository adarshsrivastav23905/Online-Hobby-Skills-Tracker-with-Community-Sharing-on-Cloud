// ===================================================
// src/components/LogPracticeModal.jsx — Practice Logger Modal
// ===================================================

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { X, Play, Pause, RotateCcw, CheckCircle2, Clock } from 'lucide-react';

export function LogPracticeModal({ isOpen, onClose, skills, onSessionLogged, preselectedSkillId }) {
  const [skillId, setSkillId] = useState(preselectedSkillId || '');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState('manual'); // 'manual' | 'timer'
  
  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preselectedSkillId) {
      setSkillId(preselectedSkillId);
    } else if (skills && skills.length > 0 && !skillId) {
      setSkillId(skills[0].id);
    }
  }, [preselectedSkillId, skills]);

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
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

  const stopTimerAndApply = () => {
    setTimerRunning(false);
    const calculatedMinutes = Math.max(1, Math.round(seconds / 60));
    setDurationMinutes(calculatedMinutes);
    setMode('manual');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let minutesToLog = durationMinutes;
    if (mode === 'timer') {
      minutesToLog = Math.max(1, Math.round(seconds / 60));
    }

    try {
      const res = await api.logPractice({
        skill_id: parseInt(skillId),
        duration_minutes: parseInt(minutesToLog),
        activity: activity.trim() || 'General Practice',
        notes: notes.trim(),
      });

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onSessionLogged) {
        onSessionLogged(res);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Log Practice Session</h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setMode('manual')}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'manual' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: mode === 'manual' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              border: 'none',
              borderBottom: mode === 'manual' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setMode('timer')}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'timer' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: mode === 'timer' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              border: 'none',
              borderBottom: mode === 'timer' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            Live Stopwatch Timer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '16px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Select Skill */}
            <div className="input-group">
              <label className="input-label">Select Skill *</label>
              <select
                className="input-control"
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                required
              >
                {skills && skills.length > 0 ? (
                  skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.skill_name} ({s.category})
                    </option>
                  ))
                ) : (
                  <option value="">No skills added yet</option>
                )}
              </select>
            </div>

            {/* Live Timer View */}
            {mode === 'timer' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3.2rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '2px', marginBottom: '16px' }}>
                  {formatTimer()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  {!timerRunning ? (
                    <button
                      type="button"
                      onClick={() => setTimerRunning(true)}
                      className="btn btn-primary"
                      style={{ padding: '10px 20px' }}
                    >
                      <Play size={16} /> Start
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTimerRunning(false)}
                      className="btn btn-secondary"
                      style={{ padding: '10px 20px' }}
                    >
                      <Pause size={16} /> Pause
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setSeconds(0);
                    }}
                    className="btn btn-secondary btn-icon"
                    title="Reset Timer"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={stopTimerAndApply}
                    className="btn btn-secondary"
                  >
                    Save & Edit
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Duration View */
              <div className="input-group">
                <label className="input-label">Duration (Minutes) *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    className="input-control"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>min</span>
                </div>
                {/* Preset quick minute buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        background: durationMinutes === mins ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: durationMinutes === mins ? 'var(--accent-primary)' : 'var(--border-color)',
                      }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Name */}
            <div className="input-group">
              <label className="input-label">Activity / Focus Area</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Practiced fingerstyle guitar chords, Solved 2 LeetCode problems"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              />
            </div>

            {/* Reflection Notes */}
            <div className="input-group">
              <label className="input-label">Reflection & Notes</label>
              <textarea
                className="input-control"
                placeholder="What went well? Any challenges or key learnings?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <CheckCircle2 size={16} />
              {loading ? 'Saving...' : 'Save Practice Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
