import api from './api';

export const progressService = {
  getSheets: () => api.get('/progress'),
  createSheet: (data) => api.post('/progress', data),
  getSheet: (id) => api.get(`/progress/${id}`),
  addEntry: (id, data) => api.post(`/progress/${id}/entries`, data),
  deleteSheet: (id) => api.delete(`/progress/${id}`),
  updateEntry: (entryId, data) => api.put(`/progress/entries/${entryId}`, data),
  deleteEntry: (entryId) => api.delete(`/progress/entries/${entryId}`),
};
