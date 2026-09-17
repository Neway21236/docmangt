import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach Bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired, clear token and notify
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('dms_token')) {
        console.warn('Session expired or invalid token.');
        // Allow the app to react
      }
    }
    return Promise.reject(error);
  }
);

export default api;
