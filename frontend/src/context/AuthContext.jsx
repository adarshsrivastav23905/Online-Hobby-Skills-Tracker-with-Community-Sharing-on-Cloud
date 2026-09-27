// ===================================================
// src/context/AuthContext.jsx — Authentication State
// ===================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken } from '../api';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  { name: 'Aarav Sharma', email: 'aarav@example.com', role: 'Music & Coding Tracker' },
  { name: 'Priya Patel', email: 'priya@example.com', role: 'Art & Fitness Tracker' },
  { name: 'Rahul Verma', email: 'rahul@example.com', role: 'Full-Stack Developer' },
  { name: 'Sneha Rao', email: 'sneha@example.com', role: 'Polyglot & Yoga' },
  { name: 'Vikram Singh', email: 'vikram@example.com', role: 'Chef & Photographer' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize Auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getCurrentUser();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await api.login(email, password);
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (name, username, email, password) => {
    setAuthError(null);
    try {
      const data = await api.register(name, username, email, password);
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginAsDemo = async (email) => {
    return login(email, 'password123');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUserProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        loginAsDemo,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
