// ===================================================
// src/components/CreateGoalModal.jsx — Goal & Milestone Builder
// ===================================================

import React, { useState } from 'react';
import { api } from '../api';
import { X, Target, Plus, Trash2 } from 'lucide-react';

export function CreateGoalModal({ isOpen, onClose, skill, onGoalCreated }) {
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState(50);
  const [unit, setUnit] = useState('hours'); // 'hours' | 'sessions' | 'minutes'
  const [deadline, setDeadline] = useState('');
  const [milestones, setMilestones] = useState([
    { title: 'Complete first phase', target_value: 10 },
    { title: 'Intermediate proficiency milestone', target_value: 25 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', target_value: 10 }]);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        skill_id: skill.id,
        title: title.trim(),
        target_value: parseFloat(targetValue),
        unit,
        deadline: deadline ? `${deadline}T23:59:59Z` : null,
        milestones: milestones.filter((m) => m.title.trim()).map((m) => ({
          title: m.title.trim(),
          target_value: parseFloat(m.target_value),
        })),
      };

      const res = await api.createGoal(payload);
      if (onGoalCreated) {
        onGoalCreated(res.goal);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !skill) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              Set Goal for {skill.skill_name}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '16px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Goal Title */}
            <div className="input-group">
              <label className="input-label">Goal Title *</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Master 10 Classical Fingerstyle Songs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Target Value & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Target Target Metric *</label>
                <input
                  type="number"
                  min="1"
                  className="input-control"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Unit</label>
                <select
                  className="input-control"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="hours">Hours</option>
                  <option value="sessions">Sessions</option>
                  <option value="minutes">Minutes</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div className="input-group">
              <label className="input-label">Target Completion Date (Optional)</label>
              <input
                type="date"
                className="input-control"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* Milestones Builder */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="input-label" style={{ margin: 0 }}>Progress Milestones</label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                >
                  <Plus size={13} /> Add Milestone
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {milestones.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="input-control"
                      placeholder={`Milestone #${idx + 1} name`}
                      value={m.title}
                      onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                      style={{ flex: 3 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1.5 }}>
                      <input
                        type="number"
                        min="1"
                        className="input-control"
                        placeholder="Target"
                        value={m.target_value}
                        onChange={(e) => updateMilestone(idx, 'target_value', e.target.value)}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{unit}</span>
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        className="btn btn-danger btn-icon"
                        style={{ width: '32px', height: '32px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Target size={16} />
              {loading ? 'Creating Goal...' : 'Create Goal & Milestones'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
