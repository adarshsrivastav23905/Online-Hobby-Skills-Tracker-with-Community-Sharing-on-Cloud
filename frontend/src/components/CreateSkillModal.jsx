// ===================================================
// src/components/CreateSkillModal.jsx — Add / Edit Skill
// ===================================================

import React, { useState } from 'react';
import { api } from '../api';
import { X, Sparkles, Plus } from 'lucide-react';

const CATEGORIES = [
  'Music', 'Coding', 'Art', 'Fitness', 'Language', 
  'Cooking', 'Photography', 'Writing', 'Gaming', 'Other'
];

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER'];

export function CreateSkillModal({ isOpen, onClose, onSkillCreated, existingSkill = null }) {
  const [skillName, setSkillName] = useState(existingSkill?.skill_name || '');
  const [category, setCategory] = useState(existingSkill?.category || 'Coding');
  const [currentLevel, setCurrentLevel] = useState(existingSkill?.current_level || 'BEGINNER');
  const [targetLevel, setTargetLevel] = useState(existingSkill?.target_level || 'ADVANCED');
  const [description, setDescription] = useState(existingSkill?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        skill_name: skillName.trim(),
        category,
        current_level: currentLevel,
        target_level: targetLevel,
        description: description.trim(),
      };

      let res;
      if (existingSkill) {
        res = await api.updateSkill(existingSkill.id, payload);
      } else {
        res = await api.createSkill(payload);
      }

      if (onSkillCreated) {
        onSkillCreated(res.skill);
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
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              {existingSkill ? 'Edit Skill' : 'Track a New Hobby / Skill'}
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

            {/* Skill Name */}
            <div className="input-group">
              <label className="input-label">Skill / Hobby Name *</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Acoustic Guitar, Python Algorithms, Oil Painting"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="input-group">
              <label className="input-label">Category *</label>
              <select
                className="input-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Current and Target Level */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Current Level</label>
                <select
                  className="input-control"
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Target Level Goal</label>
                <select
                  className="input-control"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="input-group">
              <label className="input-label">Description & Motivation</label>
              <textarea
                className="input-control"
                placeholder="Why do you want to learn this skill? What are your aspirations?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Plus size={16} />
              {loading ? 'Saving...' : existingSkill ? 'Update Skill' : 'Create Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
