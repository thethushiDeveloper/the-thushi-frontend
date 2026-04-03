import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://the-thushi-api.onrender.com';

// Smart image URL helper - handles both Cloudinary absolute URLs and legacy local paths
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path}`;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://the-thushi-api.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
