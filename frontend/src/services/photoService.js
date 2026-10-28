import api from './api';

export const photoService = {
  getFolders: () => api.get('/photos/folders'),
  createFolder: (name) => api.post('/photos/folders', { name }),
  getFolderPhotos: (id) => api.get(`/photos/folders/${id}`),
  uploadPhoto: (folderId, formData) =>
    api.post(`/photos/folders/${folderId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePhoto: (id) => api.delete(`/photos/${id}`),
};
