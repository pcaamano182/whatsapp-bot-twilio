import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  setup: (email, password, name) => api.post('/auth/setup', { email, password, name }),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getStats: () => api.get('/orders/stats'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

// Conversations API
export const conversationsAPI = {
  getAll: (params) => api.get('/conversations', { params }),
  getStats: () => api.get('/conversations/stats'),
  getMessages: (id, params) => api.get(`/conversations/${id}/messages`, { params }),
  search: (q) => api.get('/conversations/search', { params: { q } }),
};
