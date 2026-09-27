// ===================================================
// src/views/FeedView.jsx — Community Social Feed
// ===================================================

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Trash2, 
  Sparkles, 
  PlusCircle, 
  Send,
  User,
  Image as ImageIcon
} from 'lucide-react';

export function FeedView({ onOpenPostModal, skills }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.getFeed(1, 30);
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLikeToggle = async (post) => {
    try {
      if (post.user_liked) {
        await api.unlikePost(post.id);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, user_liked: false, likes_count: Math.max(0, p.likes_count - 1) }
              : p
          )
        );
      } else {
        await api.likePost(post.id);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, user_liked: true, likes_count: p.likes_count + 1 }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  const toggleComments = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    try {
      const res = await api.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: res.comments || [] }));
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.addComment(postId, commentText.trim());
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
      setCommentText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this community post?')) return;
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await api.deleteComment(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Feed Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Community Learning Feed</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Share milestones, get inspired by peer progress, and celebrate consistency together.
          </p>
        </div>

        <button onClick={onOpenPostModal} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Share Milestone</span>
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading community feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Sparkles size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h3>No posts yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Be the first to share your practice milestone with the community!
          </p>
          <button onClick={onOpenPostModal} className="btn btn-primary">
            <PlusCircle size={16} /> Share Milestone
          </button>
        </div>
      ) : (
        posts.map((post) => (
          <article
            key={post.id}
            className="glass-panel"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Post Author Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                >
                  {post.author_name ? post.author_name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {post.author_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    @{post.author_username} · {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {post.skill_name && (
                  <span className="badge badge-beginner" style={{ fontSize: '0.72rem' }}>
                    {post.skill_name}
                  </span>
                )}
                {post.user_id === user?.id && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="btn btn-secondary btn-icon"
                    style={{ width: '32px', height: '32px' }}
                    title="Delete Post"
                  >
                    <Trash2 size={14} color="var(--color-danger)" />
                  </button>
                )}
              </div>
            </div>

            {/* Post Content */}
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {post.content}
            </p>

            {/* Attached Media (from Cloud Storage) */}
            {post.media_url && (
              <div style={{ marginTop: '4px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img
                  src={post.media_url}
                  alt="Post Attachment"
                  style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Post Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
              }}
            >
              {/* Like Button */}
              <button
                onClick={() => handleLikeToggle(post)}
                className="btn btn-secondary btn-sm"
                style={{
                  color: post.user_liked ? '#f43f5e' : 'var(--text-secondary)',
                  background: post.user_liked ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: post.user_liked ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-color)',
                }}
              >
                <Heart size={16} fill={post.user_liked ? '#f43f5e' : 'none'} />
                <span>{post.likes_count}</span>
              </button>

              {/* Comment Toggle */}
              <button
                onClick={() => toggleComments(post.id)}
                className="btn btn-secondary btn-sm"
              >
                <MessageSquare size={16} />
                <span>{post.comments_count} Comments</span>
              </button>
            </div>

            {/* Comments Expandable Drawer */}
            {activeCommentPostId === post.id && (
              <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                {/* Add Comment Box */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Write a supportive comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(post.id);
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    disabled={submittingComment || !commentText.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={14} />
                  </button>
                </div>

                {/* Comments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(commentsMap[post.id] || []).length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    (commentsMap[post.id] || []).map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)', marginRight: '8px' }}>
                            @{c.author_username}
                          </span>
                          <span style={{ color: 'var(--text-primary)' }}>{c.content}</span>
                        </div>
                        {c.user_id === user?.id && (
                          <button
                            onClick={() => handleDeleteComment(post.id, c.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px 4px' }}
                            title="Delete Comment"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}
