import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};
