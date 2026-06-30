import api from './api';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  register: (data: { username: string; email: string; password: string; name: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  getProfile: () => api.get('/auth/profile').then((r) => r.data),
  getUsers: () => api.get('/auth/users').then((r) => r.data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats').then((r) => r.data),
};
