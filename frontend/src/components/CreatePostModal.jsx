// ===================================================
// src/components/CreatePostModal.jsx — Share with Community
// ===================================================

import React, { useState } from 'react';
import { api } from '../api';
import { X, Send, Image, Sparkles, UploadCloud } from 'lucide-react';

export function CreatePostModal({ isOpen, onClose, skills, onPostCreated }) {
  const [content, setContent] = useState('');
  const [skillId, setSkillId] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 16 * 1024 * 1024) {
        setError('File size cannot exceed 16MB');
        return;
      }
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selected));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setUploading(true);

    try {
      let mediaUrl = null;

      // If file attached, upload to Cloud Storage first
      if (file) {
        const uploadRes = await api.uploadFile(file, 'post_media');
        mediaUrl = uploadRes.file.url;
      }

      // Create community post
      const payload = {
        content: content.trim(),
        skill_id: skillId ? parseInt(skillId) : null,
        media_url: mediaUrl,
        visibility: 'public',
      };

      const res = await api.createPost(payload);
      if (onPostCreated) {
        onPostCreated(res.post);
      }
      setContent('');
      setFile(null);
      setFilePreview(null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Share Progress with Community</h2>
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

            {/* Tag Skill */}
            <div className="input-group">
              <label className="input-label">Tag Related Skill (Optional)</label>
              <select
                className="input-control"
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
              >
                <option value="">General Update</option>
                {skills && skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.skill_name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Post Content */}
            <div className="input-group">
              <label className="input-label">What milestone or progress did you achieve? *</label>
              <textarea
                className="input-control"
                placeholder="Share your breakthrough, practice insights, or learning journey..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
              />
            </div>

            {/* Media Upload */}
            <div className="input-group">
              <label className="input-label">Attach Practice Media / Certificate (Cloud Storage)</label>
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
                <UploadCloud size={32} color="var(--accent-primary)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {file ? file.name : 'Click or drop an image/file here'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Simulates Cloud Object Storage (S3 / GCS / Azure Blob) · Up to 16MB
                </div>
              </div>

              {/* Preview */}
              {filePreview && (
                <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                  <img
                    src={filePreview}
                    alt="Upload Preview"
                    style={{ maxHeight: '140px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="btn btn-danger btn-icon"
                    style={{ position: 'absolute', top: '5px', right: '5px', width: '26px', height: '26px' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={uploading || !content.trim()} className="btn btn-primary">
              <Send size={16} />
              {uploading ? 'Uploading to Cloud...' : 'Publish Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
