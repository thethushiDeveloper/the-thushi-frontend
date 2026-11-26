import axios from 'axios';

// Detect whether running in local development environment
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Determine base API endpoint
const getBaseApiUrl = () => {
  // If explicitly provided via VITE_API_URL and not a localhost override in production
  if (import.meta.env.VITE_API_URL) {
    if (!isLocalhost && import.meta.env.VITE_API_URL.includes('localhost')) {
      // In production environment, do not use localhost
      return 'https://the-thushi-api.onrender.com/api';
    }
    return import.meta.env.VITE_API_URL;
  }
  // If running locally in browser
  if (isLocalhost) {
    return 'http://localhost:5000/api';
  }
  // Production fallback on Render/Vercel
  return 'https://the-thushi-api.onrender.com/api';
};

const getBaseHostUrl = () => {
  const apiUrl = getBaseApiUrl();
  return apiUrl.replace(/\/api\/?$/, '');
};

export const BASE_URL = getBaseHostUrl();

// Smart image URL helper - handles Cloudinary, full URLs, and relative paths
export const getImageUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const normalized = trimmed.replace(/\\/g, '/');
  return `${BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

const api = axios.create({
  baseURL: getBaseApiUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
