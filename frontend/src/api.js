import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4001';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('nld_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nld_token');
      localStorage.removeItem('nld_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
