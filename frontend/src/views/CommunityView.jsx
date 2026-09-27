// ===================================================
// src/views/CommunityView.jsx — Peers & Community Network
// ===================================================

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  Clock, 
  BookOpen, 
  MessageSquare,
  Award,
  Search,
  Flame,
  ExternalLink,
  X,
  Heart,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';

export function CommunityView() {
  const { user } = useAuth();
  const [peers, setPeers] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  // Selected peer detail modal state
  const [activePeer, setActivePeer] = useState(null);
  const [peerDetailLoading, setPeerDetailLoading] = useState(false);
  const [peerDetails, setPeerDetails] = useState(null);

  const getInterestsList = (interests) => {
    if (Array.isArray(interests)) return interests;
    if (typeof interests === 'string' && interests.trim()) {
      return interests.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const getInitial = (name) => {
    if (name && typeof name === 'string' && name.trim()) {
      return name.trim()[0].toUpperCase();
    }
    return 'U';
  };

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const [usersRes, followingRes] = await Promise.all([
        api.getAllUsers().catch(() => ({ users: [] })),
        user ? api.getFollowing(user.id).catch(() => ({ following: [] })) : Promise.resolve({ following: [] }),
      ]);

      const allUsers = usersRes.users || [];
      // Filter out current user from peers list
      const peerList = allUsers.filter((item) => item?.user && item.user.id !== user?.id);
      setPeers(peerList);

      const ids = new Set((followingRes.following || []).map((f) => f.id));
      setFollowingIds(ids);
    } catch (err) {
      console.error('Failed to load community peers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [user]);

  const handleFollowToggle = async (peerId, e) => {
    if (e) e.stopPropagation();
    try {
      if (followingIds.has(peerId)) {
        await api.unfollowUser(peerId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(peerId);
          return next;
        });
        setPeers((prev) =>
          prev.map((p) =>
            p.user.id === peerId
              ? {
                  ...p,
                  stats: {
                    ...p.stats,
                    followers_count: Math.max(0, (p.stats?.followers_count || 1) - 1),
                  },
                }
              : p
          )
        );
        if (peerDetails && peerDetails.user?.id === peerId) {
          setPeerDetails((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              followers_count: Math.max(0, (prev.stats?.followers_count || 1) - 1),
            },
          }));
        }
      } else {
        await api.followUser(peerId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.add(peerId);
          return next;
        });
        setPeers((prev) =>
          prev.map((p) =>
            p.user.id === peerId
              ? {
                  ...p,
                  stats: {
                    ...p.stats,
                    followers_count: (p.stats?.followers_count || 0) + 1,
                  },
                }
              : p
          )
        );
        if (peerDetails && peerDetails.user?.id === peerId) {
          setPeerDetails((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              followers_count: (prev.stats?.followers_count || 0) + 1,
            },
          }));
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openPeerModal = async (peerUser) => {
    setActivePeer(peerUser);
    setPeerDetailLoading(true);
    try {
      const res = await api.getPublicProfile(peerUser.id);
      setPeerDetails(res);
    } catch (err) {
      console.error('Failed to load peer details:', err);
    } finally {
      setPeerDetailLoading(false);
    }
  };

  const closePeerModal = () => {
    setActivePeer(null);
    setPeerDetails(null);
  };

  // Filter peers safely by search and category
  const filteredPeers = peers.filter((p) => {
    if (!p || !p.user) return false;
    const name = (p.user.name || '').toLowerCase();
    const username = (p.user.username || '').toLowerCase();
    const interestsStr = getInterestsList(p.user.interests).join(' ').toLowerCase();
    const skillsStr = (p.skills || []).map((s) => s.skill_name || '').join(' ').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const nameMatch = !q || name.includes(q) || username.includes(q) || interestsStr.includes(q) || skillsStr.includes(q);

    const catQ = selectedCategory.toLowerCase();
    const categoryMatch =
      selectedCategory === 'ALL' ||
      (p.skills && p.skills.some((s) => (s.category || '').toLowerCase() === catQ)) ||
      interestsStr.includes(catQ);

    return nameMatch && categoryMatch;
  });

  const categories = ['ALL', 'Music', 'Coding', 'Art', 'Fitness', 'Language', 'Cooking', 'Photography'];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div className="badge badge-streak" style={{ marginBottom: '8px' }}>
            <Users size={13} style={{ marginRight: '4px' }} /> Peer Learning Network
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0 8px 0' }}>
            Community Peers & Skill Mentors
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '650px', margin: 0 }}>
            Discover and connect with fellow learners across disciplines. Follow peers to track their milestones, exchange constructive feedback, and maintain mutual accountability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              {peers.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Peers</div>
          </div>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {followingIds.size}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Following</div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search peers by name, username, skill (e.g. Guitar, Python, Yoga), or interest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '44px',
              height: '46px',
              fontSize: '0.95rem',
              background: 'rgba(18, 26, 43, 0.7)',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                background: selectedCategory === cat ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                fontWeight: 600,
                padding: '6px 14px',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Peers Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div className="flame-icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>👥</div>
          Loading community peers...
        </div>
      ) : filteredPeers.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No peers found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Try adjusting your search keywords or category filters.
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredPeers.map((item) => {
            const peer = item.user;
            if (!peer) return null;
            const stats = item.stats || {};
            const skillsList = item.skills || [];
            const interestsList = getInterestsList(peer.interests);
            const isFollowing = followingIds.has(peer.id);

            return (
              <div
                key={peer.id}
                className="glass-panel"
                onClick={() => openPeerModal(peer)}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  {/* Top Bar: Avatar, Names, Follow Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          color: '#fff',
                          boxShadow: '0 4px 14px var(--accent-glow)',
                        }}
                      >
                        {getInitial(peer.name)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                          {peer.name || 'Community Member'}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          @{peer.username || 'user'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleFollowToggle(peer.id, e)}
                      className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={14} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Follow
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bio */}
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', minHeight: '42px', marginBottom: '14px', lineHeight: 1.5 }}>
                    {peer.bio || 'Passionate about acquiring new skills and sharing the journey.'}
                  </p>

                  {/* Interest Tags */}
                  {interestsList.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                      {interestsList.map((interest, i) => (
                        <span key={i} className="badge badge-beginner" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Highlighted Skills */}
                  {skillsList.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Tracked Learning Paths
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {skillsList.slice(0, 2).map((sk) => (
                          <div
                            key={sk.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{sk.skill_name}</span>
                            <span className={`badge ${getLevelBadgeClass(sk.current_level)}`} style={{ fontSize: '0.65rem' }}>
                              {sk.current_level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Stats & Click Cue */}
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {stats.skills_count || 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Skills</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                        {stats.total_practice_hours || 0}h
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Practice</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                        {stats.followers_count || 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Followers</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    <span>View Full Profile</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================
          PEER PROFILE DETAIL MODAL
          =================================================== */}
      {activePeer && (
        <div className="modal-overlay" onClick={closePeerModal}>
          <div
            className="modal-card"
            style={{ maxWidth: '680px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    color: '#fff',
                    boxShadow: '0 4px 16px var(--accent-glow)',
                  }}
                >
                  {getInitial(activePeer.name)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0 }}>{activePeer.name || 'Peer Profile'}</h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    @{activePeer.username || 'user'} · Member since {new Date(activePeer.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <button onClick={closePeerModal} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {peerDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Loading {activePeer.name}'s portfolio...
                </div>
              ) : (
                <>
                  {/* Bio & Follow Button Bar */}
                  <div
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {activePeer.bio || 'Passionate lifelong learner.'}
                      </p>
                      {getInterestsList(activePeer.interests).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {getInterestsList(activePeer.interests).map((item, i) => (
                            <span key={i} className="badge badge-beginner" style={{ fontSize: '0.7rem' }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleFollowToggle(activePeer.id, e)}
                      className={`btn ${followingIds.has(activePeer.id) ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {followingIds.has(activePeer.id) ? (
                        <>
                          <UserCheck size={16} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} /> Follow Peer
                        </>
                      )}
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {peerDetails?.stats?.skills_count || 0}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Skills</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                        {peerDetails?.stats?.total_practice_hours || 0}h
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Practice</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                        {peerDetails?.stats?.posts_count || 0}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Posts</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                        {peerDetails?.stats?.followers_count || 0}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Followers</div>
                    </div>
                  </div>

                  {/* Tracked Skills List */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="var(--accent-primary)" />
                      <span>Tracked Skills & Progression</span>
                    </h3>

                    {(!peerDetails?.skills || peerDetails.skills.length === 0) ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No public skills listed.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {peerDetails.skills.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '12px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{s.skill_name}</span>
                              <span className={`badge ${getLevelBadgeClass(s.current_level)}`} style={{ fontSize: '0.68rem' }}>
                                {s.current_level}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              Category: <strong>{s.category}</strong> · <strong>{s.total_hours} hrs</strong> logged
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Community Posts by this Peer */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} color="var(--accent-primary)" />
                      <span>Shared Community Updates</span>
                    </h3>

                    {(!peerDetails?.recent_posts || peerDetails.recent_posts.length === 0) ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No community updates shared yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                        {peerDetails.recent_posts.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              padding: '12px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                              {p.content}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <span>{new Date(p.created_at).toLocaleDateString()}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e' }}>
                                <Heart size={12} fill="#f43f5e" /> {p.likes_count} likes · {p.comments_count} comments
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={closePeerModal} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
