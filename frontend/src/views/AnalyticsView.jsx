// ===================================================
// src/views/AnalyticsView.jsx — Analytics & Achievements
// ===================================================

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Award, 
  Flame, 
  Clock, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Lock,
  TrendingUp,
  PieChart
} from 'lucide-react';

export function AnalyticsView() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [skills, setSkills] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [anRes, skRes, feedRes] = await Promise.all([
          api.getDashboardAnalytics(),
          api.getSkills(),
          api.getFeed(1, 100),
        ]);
        setAnalytics(anRes);
        setSkills(skRes.skills || []);
        setPosts(feedRes.posts || []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
        Loading cloud analytics & telemetry...
      </div>
    );
  }

  const stats = analytics?.stats || {
    total_skills: 0,
    total_hours: 0,
    total_sessions: 0,
    current_streak: 0,
    longest_streak: 0,
  };

  const skillBreakdown = analytics?.skill_breakdown || [];
  const userPostsCount = posts.filter((p) => p.user_id === user?.id).length;
  const categoriesCount = new Set(skills.map((s) => s.category)).size;

  // Gamified Badges Definition
  const badges = [
    {
      id: 'first_step',
      title: 'First Step',
      icon: '🌱',
      description: 'Logged your very first practice session',
      unlocked: stats.total_sessions >= 1,
      progress: `${Math.min(stats.total_sessions, 1)} / 1`,
    },
    {
      id: 'streak_3',
      title: 'Consistency Spark',
      icon: '🔥',
      description: 'Reached a 3-day practice streak',
      unlocked: Math.max(stats.current_streak, stats.longest_streak) >= 3,
      progress: `${Math.min(Math.max(stats.current_streak, stats.longest_streak), 3)} / 3 days`,
    },
    {
      id: 'streak_7',
      title: 'Habit Master',
      icon: '⚡',
      description: 'Maintained a full 7-day practice streak',
      unlocked: Math.max(stats.current_streak, stats.longest_streak) >= 7,
      progress: `${Math.min(Math.max(stats.current_streak, stats.longest_streak), 7)} / 7 days`,
    },
    {
      id: 'polymath',
      title: 'Modern Polymath',
      icon: '🧠',
      description: 'Tracked hobbies across 3 different domains',
      unlocked: categoriesCount >= 3,
      progress: `${Math.min(categoriesCount, 3)} / 3 categories`,
    },
    {
      id: 'hours_50',
      title: 'Deep Focus',
      icon: '⏳',
      description: 'Dedicated 50+ hours of deliberate practice',
      unlocked: stats.total_hours >= 50,
      progress: `${Math.min(stats.total_hours, 50)} / 50 hrs`,
    },
    {
      id: 'centurion',
      title: 'Centurion (100 Hours)',
      icon: '🏆',
      description: 'Achieved 100 total hours in skill mastery',
      unlocked: stats.total_hours >= 100,
      progress: `${Math.min(stats.total_hours, 100)} / 100 hrs`,
    },
    {
      id: 'community_voice',
      title: 'Community Voice',
      icon: '🌐',
      description: 'Shared 3+ progress updates with the cloud feed',
      unlocked: userPostsCount >= 3,
      progress: `${Math.min(userPostsCount, 3)} / 3 posts`,
    },
    {
      id: 'tenacious',
      title: '50 Practice Sessions',
      icon: '🎯',
      description: 'Logged 50 separate focus sessions',
      unlocked: stats.total_sessions >= 50,
      progress: `${Math.min(stats.total_sessions, 50)} / 50 sessions`,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Skill Analytics & Gamified Badges</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
          Deep telemetry on your practice distribution, level progression, and earned achievement badges.
        </p>
      </div>

      {/* 3 Summary Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL SESSIONS</span>
            <div className="stat-icon-box">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.total_sessions}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Average: <strong>{stats.total_sessions > 0 ? (stats.total_hours * 60 / stats.total_sessions).toFixed(0) : 0} mins / session</strong>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">LONGEST STREAK</span>
            <div className="stat-icon-box" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>
              <Flame size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fb923c' }}>{stats.longest_streak} Days</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Current: <strong>{stats.current_streak} days active</strong>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">UNLOCKED BADGES</span>
            <div className="stat-icon-box" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Award size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#eab308' }}>
            {badges.filter((b) => b.unlocked).length} / {badges.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Gamification level: <strong>{Math.round((badges.filter((b) => b.unlocked).length / badges.length) * 100)}% complete</strong>
          </div>
        </div>
      </div>

      {/* Skill Time Distribution */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <PieChart size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Practice Time Allocation by Skill</h3>
        </div>

        {skillBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            No practice data available for breakdown.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {skillBreakdown.map((item, idx) => {
              const colors = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
              const color = colors[idx % colors.length];
              return (
                <div key={item.skill_id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.skill_name}</span>
                      <span className="badge badge-beginner" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{item.category}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {item.hours} hrs <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({item.percentage}%)</span>
                    </div>
                  </div>

                  <div className="progress-container" style={{ height: '7px' }}>
                    <div className="progress-bar" style={{ width: `${item.percentage}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamified Badges Gallery */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Award size={20} color="#eab308" />
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Achievement Badges Gallery</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {badges.map((b) => (
            <div
              key={b.id}
              className="glass-panel"
              style={{
                padding: '18px',
                background: b.unlocked ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: b.unlocked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
                opacity: b.unlocked ? 1 : 0.65,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{b.icon}</span>
                  {b.unlocked ? (
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      <CheckCircle2 size={13} /> Unlocked
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Lock size={13} /> Locked
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: '4px' }}>
                  {b.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {b.description}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                Progress: <strong style={{ color: b.unlocked ? 'var(--color-success)' : 'var(--text-secondary)' }}>{b.progress}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
