import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    // Wait until token & user are fully evaluated
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(parsedUser);
        fetchUserProfile();
      } catch {
        logout(false);
      }
    }

    // delay ensures no flashing
    setTimeout(() => setLoading(false), 300);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.data.user);
      setSubscription(res.data.data.subscription);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
    } catch {
      logout(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token, subscription } = res.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setSubscription(subscription);

      toast.success('Login successful!');
      navigate('/dashboard');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user, token, subscription } = res.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setSubscription(subscription);

      toast.success('Registration successful!');
      navigate('/dashboard');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = (redirect = true) => {
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setSubscription(null);
    if (redirect) {
      toast.success('Logged out successfully');
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
