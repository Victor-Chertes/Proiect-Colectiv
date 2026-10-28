import api from './api';

export const sessionService = {
  startSession: (workoutId) => api.post('/sessions', { workoutId }),
  completeSet: (sessionId, setData) => api.put(`/sessions/${sessionId}/set`, setData),
  finishSession: (sessionId, sets) => api.put(`/sessions/${sessionId}/finish`, { sets }),
  abandonSession: (sessionId) => api.put(`/sessions/${sessionId}/abandon`),
};
