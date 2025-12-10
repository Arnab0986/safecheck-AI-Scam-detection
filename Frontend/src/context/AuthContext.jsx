// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check local token

  // Initialize from localStorage if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token) {
      // attach token to api default headers so subsequent requests include it
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch {
          // ignore parse error
          localStorage.removeItem('user');
        }
      }

      // Refresh profile from server to ensure token is valid and data fresh
      fetchUserProfile().finally(() => setLoading(false));
    } else {
      // no token -> not authenticated
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch profile + subscription from backend
  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data?.success) {
        const { user: serverUser, subscription: serverSubscription } = res.data.data;
        setUser(serverUser);
        setSubscription(serverSubscription || null);
        try {
          localStorage.setItem('user', JSON.stringify(serverUser));
        } catch {}
        return { success: true, user: serverUser, subscription: serverSubscription };
      } else {
        // If backend returned success false, clear token
        logout(false);
        return { success: false };
      }
    } catch (err) {
      // likely invalid token or network error -> force logout locally
      logout(false);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  // Login: posts to /auth/login, stores token & user on success
  const login = async (email, password, { redirect = true } = {}) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token, user: userData, subscription: sub } = res.data.data;
        // persist token & user
        localStorage.setItem('token', token);
        try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
        // set default header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setSubscription(sub || null);

        if (redirect) navigate('/dashboard');
        return { success: true, user: userData, subscription: sub || null };
      }
      return { success: false, error: res.data?.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  // Register: posts to /auth/register, behaves similarly to login on success
  const register = async (payload = {}, { redirect = true } = {}) => {
    try {
      const res = await api.post('/auth/register', payload);
      if (res.data?.success) {
        const { token, user: userData, subscription: sub } = res.data.data;
        localStorage.setItem('token', token);
        try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setSubscription(sub || null);

        if (redirect) navigate('/dashboard');
        return { success: true, user: userData, subscription: sub || null };
      }
      return { success: false, error: res.data?.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  // Logout: clear local storage + header + state. Optionally redirect.
  const logout = (redirect = true) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setSubscription(null);
    if (redirect) {
      // navigate to login page
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fetchUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
