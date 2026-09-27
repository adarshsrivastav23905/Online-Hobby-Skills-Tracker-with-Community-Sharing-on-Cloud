// ===================================================
// src/views/SkillsView.jsx — Skills & Goals Manager
// ===================================================

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Sparkles, 
  PlusCircle, 
  Target, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Circle,
  Filter,
  Calendar
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Coding', 'Music', 'Art', 'Fitness', 'Language', 'Cooking', 'Photography', 'Writing', 'Gaming'];

export function SkillsView({ onOpenSkillModal, onOpenLogModal, onOpenGoalModal, setSelectedSkillForGoal }) {
  const [skills, setSkills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [skillsRes, goalsRes] = await Promise.all([
        api.getSkills(),
        api.getGoals(),
      ]);
      setSkills(skillsRes.skills || []);
      setGoals(goalsRes.goals || []);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill and all its practice history?')) {
      return;
    }
    try {
      await api.deleteSkill(skillId);
      setSkills(skills.filter((s) => s.id !== skillId));
      setGoals(goals.filter((g) => g.skill_id !== skillId));
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSkills = selectedCategory === 'ALL'
    ? skills
    : skills.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());

  const getLevelBadgeClass = (level) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER': return 'badge-beginner';
      case 'INTERMEDIATE': return 'badge-intermediate';
      case 'ADVANCED': return 'badge-advanced';
      case 'MASTER': return 'badge-master';
      default: return 'badge-beginner';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Skills & Hobbies Portfolio</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Manage your learning curriculum, target milestones, and proficiency progression.
          </p>
        </div>

        <button onClick={onOpenSkillModal} className="btn btn-primary">
          <PlusCircle size={17} />
          <span>Add New Skill</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="btn btn-sm"
            style={{
              background: selectedCategory === cat ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
              color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              fontWeight: 600,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading your skills...
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Sparkles size={40} color="var(--accent-primary)" style={{ margin: '0 auto 14px auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No skills in this category</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
            Start your learning path by creating a skill track.
          </p>
          <button onClick={onOpenSkillModal} className="btn btn-primary">
            <PlusCircle size={16} /> Create Skill
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredSkills.map((skill) => {
            const skillGoals = goals.filter((g) => g.skill_id === skill.id);
            return (
              <div
                key={skill.id}
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  {/* Category & Status Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-beginner" style={{ fontSize: '0.72rem' }}>
                      {skill.category}
                    </span>
                    <span className={`badge ${getLevelBadgeClass(skill.current_level)}`}>
                      {skill.current_level}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                    {skill.skill_name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '38px', marginBottom: '14px' }}>
                    {skill.description || 'No description provided.'}
                  </p>

                  {/* Stats Bar */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color="var(--accent-primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{skill.total_hours} hrs</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Target: <strong style={{ color: 'var(--text-primary)' }}>{skill.target_level}</strong>
                    </div>
                  </div>

                  {/* Associated Goals */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Goals & Milestones
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSkillForGoal(skill);
                          onOpenGoalModal();
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      >
                        + Set Goal
                      </button>
                    </div>

                    {skillGoals.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No goals set for this skill.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {skillGoals.map((g) => {
                          const percent = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                          return (
                            <div key={g.id} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600 }}>{g.title}</span>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{percent}%</span>
                              </div>
                              <div className="progress-container" style={{ height: '4px', marginBottom: '4px' }}>
                                <div className="progress-bar" style={{ width: `${percent}%` }} />
                              </div>
                              {/* Milestones preview */}
                              {g.milestones && g.milestones.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                  {g.milestones.map((m) => (
                                    <span
                                      key={m.id}
                                      style={{
                                        fontSize: '0.7rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: m.achieved ? 'var(--color-success)' : 'var(--text-muted)',
                                      }}
                                    >
                                      {m.achieved ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                                      {m.title}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <button
                    onClick={onOpenLogModal}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Log Practice
                  </button>
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="btn btn-danger btn-icon"
                    style={{ width: '34px', height: '34px' }}
                    title="Delete Skill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
