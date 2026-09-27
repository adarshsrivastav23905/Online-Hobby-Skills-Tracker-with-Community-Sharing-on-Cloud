// ===================================================
// src/views/DashboardView.jsx — Main Analytics & Summary
// ===================================================

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Clock, 
  Sparkles, 
  Calendar, 
  Target, 
  PlusCircle, 
  ArrowUpRight, 
  Award,
  CheckCircle2,
  TrendingUp,
  BarChart2
} from 'lucide-react';

export function DashboardView({ onOpenLogModal, onOpenSkillModal, setActiveTab }) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [analyticsRes, skillsRes, goalsRes] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getSkills(),
        api.getGoals(null, 'ACTIVE'),
      ]);
      setDashboardData(analyticsRes);
      setSkills(skillsRes.skills || []);
      setGoals(goalsRes.goals || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="flame-icon" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚀</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Cloud Dashboard...</div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    total_skills: 0,
    total_hours: 0,
    total_sessions: 0,
    current_streak: 0,
    longest_streak: 0,
    active_goals: 0,
  };

  const weeklyActivity = dashboardData?.weekly_activity || [];
  const recentSessions = dashboardData?.recent_sessions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div className="badge badge-streak" style={{ marginBottom: '10px' }}>
            <span className="flame-icon">🔥</span> Day {stats.current_streak} Streak Active
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, {user?.name || 'Explorer'}! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.92rem' }}>
            You have logged <strong style={{ color: 'var(--text-primary)' }}>{stats.total_hours} hours</strong> of deliberate practice across <strong style={{ color: 'var(--text-primary)' }}>{stats.total_skills} skills</strong>. Keep your learning momentum going!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onOpenLogModal} className="btn btn-primary btn-lg">
            <PlusCircle size={18} />
            <span>Log Practice Session</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-grid">
        {/* Streak */}
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">CURRENT STREAK</span>
            <div className="stat-icon-box" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>
              <Flame size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fb923c' }}>
            {stats.current_streak} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Days</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Personal Best: <strong>{stats.longest_streak} days</strong>
          </div>
        </div>

        {/* Total Hours */}
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL PRACTICE</span>
            <div className="stat-icon-box">
              <Clock size={22} />
            </div>
          </div>
          <div className="stat-value">
            {stats.total_hours} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hours</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across <strong>{stats.total_sessions}</strong> logged sessions
          </div>
        </div>

        {/* Active Skills */}
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">TRACKED SKILLS</span>
            <div className="stat-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Sparkles size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {stats.total_skills}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <strong>{skills.filter(s => s.status === 'ACTIVE').length}</strong> active learning tracks
          </div>
        </div>

        {/* Active Goals */}
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">GOALS IN PROGRESS</span>
            <div className="stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Target size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {stats.active_goals}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Structured targets & milestones
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Activity Chart & Goals */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '22px' }}>
        {/* Weekly Activity Visualizer */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Weekly Practice Activity</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last 7 Days</span>
          </div>

          {/* Activity Bar Chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', gap: '10px' }}>
            {weeklyActivity.map((day, idx) => {
              const maxMinutes = Math.max(...weeklyActivity.map((d) => d.minutes), 60);
              const heightPercent = Math.max((day.minutes / maxMinutes) * 100, 8);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: day.minutes > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {day.minutes > 0 ? `${day.minutes}m` : '0m'}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPercent}%`,
                      background: day.minutes > 0 ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease',
                      boxShadow: day.minutes > 0 ? '0 0 12px var(--accent-glow)' : 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {day.day_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Goals & Milestones */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Active Goals</h3>
            </div>
            <button onClick={() => setActiveTab('skills')} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              View All
            </button>
          </div>

          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              No active goals yet. Set a goal to stay accountable!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {goals.slice(0, 3).map((g) => {
                const percent = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                return (
                  <div key={g.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{g.title}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{percent}%</span>
                    </div>
                    <div className="progress-container" style={{ height: '6px', marginBottom: '6px' }}>
                      <div className="progress-bar" style={{ width: `${percent}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>{g.current_value.toFixed(1)} / {g.target_value} {g.unit}</span>
                      <span>{g.milestones?.filter(m => m.achieved).length || 0} / {g.milestones?.length || 0} milestones</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Skills Showcase & Recent Practice History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '22px' }}>
        {/* Skills Cards */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>My Learning Tracks</h3>
            </div>
            <button onClick={onOpenSkillModal} className="btn btn-secondary btn-sm">
              <PlusCircle size={14} /> Add Skill
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {skills.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-beginner" style={{ fontSize: '0.7rem' }}>
                      {s.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {s.current_level}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                    {s.skill_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {s.total_hours} Hours Practiced
                  </div>
                </div>

                <button
                  onClick={onOpenLogModal}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Log Session
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Practice Log */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Recent Activity</h3>
            </div>
            <button onClick={() => setActiveTab('practice')} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              View History
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              No practice logged yet. Start today!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentSessions.slice(0, 4).map((sess) => (
                <div
                  key={sess.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {sess.skill_name || 'Practice Session'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {sess.activity || 'Deliberate practice'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.88rem' }}>
                      +{sess.duration_minutes}m
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(sess.practiced_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
