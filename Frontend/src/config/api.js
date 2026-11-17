import axios from 'axios';

const browserProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const defaultApiOrigin = browserProtocol === 'https:'
  ? 'https://localhost:7068'
  : 'http://localhost:5233';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || defaultApiOrigin;
export const API_BASE_URL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
