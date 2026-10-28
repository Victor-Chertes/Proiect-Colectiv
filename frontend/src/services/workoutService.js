import api from './api';

export const workoutService = {
  getMyWorkouts: () => api.get('/workouts'),
  getPublicWorkouts: () => api.get('/workouts/public'),
  getWorkout: (id) => api.get(`/workouts/${id}`),
  createWorkout: (data) => api.post('/workouts', data),
  createPublicWorkout: (data) => api.post('/workouts/public', data),
  copyWorkout: (id) => api.post(`/workouts/${id}/copy`),
  updateWorkout: (id, data) => api.put(`/workouts/${id}`, data),
  deleteWorkout: (id) => api.delete(`/workouts/${id}`),
  getExercises: () => api.get('/exercises'),
};
