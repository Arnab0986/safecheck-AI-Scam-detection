// src/api/api.js
import axios from 'axios';

// Safer base URL handling:
// 1. Use VITE_API_BASE_URL if set
// 2. Else fall back to current window origin + /api/v1 (for reverse-proxy setups)
// 3. Else (SSR / no window) use localhost for dev
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1`
    : 'http://localhost:4000/api/v1');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request interceptor – attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Make sure header is exactly "Authorization"
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor – global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
