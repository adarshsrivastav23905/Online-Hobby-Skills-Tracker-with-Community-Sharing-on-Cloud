// ===================================================
// src/api.js — Centralized REST API Client
// ===================================================
// Connects to Flask REST backend with JWT Auth headers,
// request formatting, file uploads, and error handling.
// ===================================================

const API_BASE = '/api';

/**
 * Get stored auth token from localStorage.
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Set auth token in localStorage.
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

/**
 * Core fetch wrapper with JSON serialization and Bearer token.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// ================= API METHODS =================

export const api = {
  // Auth
  register: (name, username, email, password) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password }),
    }),

  login: (email, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => request('/me'),

  logout: () => request('/logout', { method: 'POST' }),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data) =>
    request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getPublicProfile: (userId) => request(`/profile/${userId}`),
  getAllUsers: () => request('/users'),

  // Skills
  getSkills: (category, status) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/skills${query}`);
  },

  getSkill: (id) => request(`/skills/${id}`),

  createSkill: (skillData) =>
    request('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    }),

  updateSkill: (id, skillData) =>
    request(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    }),

  deleteSkill: (id) =>
    request(`/skills/${id}`, {
      method: 'DELETE',
    }),

  // Practice Sessions
  getPracticeSessions: (skillId, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (skillId) params.append('skill_id', skillId);
    return request(`/practice?${params.toString()}`);
  },

  logPractice: (data) =>
    request('/practice', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSkillPractice: (skillId) => request(`/skills/${skillId}/practice`),

  // Goals & Milestones
  getGoals: (skillId, status) => {
    const params = new URLSearchParams();
    if (skillId) params.append('skill_id', skillId);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/goals${query}`);
  },

  createGoal: (goalData) =>
    request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    }),

  updateGoal: (id, goalData) =>
    request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    }),

  deleteGoal: (id) =>
    request(`/goals/${id}`, {
      method: 'DELETE',
    }),

  // Community Feed & Posts
  getFeed: (page = 1, limit = 20, skillId = null) => {
    const params = new URLSearchParams({ page, limit });
    if (skillId) params.append('skill_id', skillId);
    return request(`/feed?${params.toString()}`);
  },

  createPost: (postData) =>
    request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),

  deletePost: (id) =>
    request(`/posts/${id}`, {
      method: 'DELETE',
    }),

  likePost: (postId) =>
    request(`/posts/${postId}/like`, {
      method: 'POST',
    }),

  unlikePost: (postId) =>
    request(`/posts/${postId}/like`, {
      method: 'DELETE',
    }),

  getComments: (postId) => request(`/posts/${postId}/comments`),

  addComment: (postId, content) =>
    request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteComment: (commentId) =>
    request(`/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Follow System
  followUser: (targetId) =>
    request(`/users/${targetId}/follow`, {
      method: 'POST',
    }),

  unfollowUser: (targetId) =>
    request(`/users/${targetId}/follow`, {
      method: 'DELETE',
    }),

  getFollowers: (userId) => request(`/users/${userId}/followers`),
  getFollowing: (userId) => request(`/users/${userId}/following`),

  // File Upload (Simulated Cloud Object Storage)
  uploadFile: (file, purpose = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    return request('/files/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Analytics & Dashboard
  getDashboardAnalytics: () => request('/analytics/dashboard'),
  getSkillAnalytics: (skillId) => request(`/analytics/skills/${skillId}`),

  // Health
  getHealth: () => request('/health'),
};
