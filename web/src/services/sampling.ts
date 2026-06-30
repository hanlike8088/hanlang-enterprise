import api from './api';
import type { SamplingWorkOrder } from './types';

export const samplingApi = {
  getOrders: (status?: string) => api.get('/sampling', { params: { status } }).then((r) => r.data),
  getOrder: (id: string) => api.get('/sampling/' + id).then((r) => r.data),
  createOrder: (data: Partial<SamplingWorkOrder>) => api.post('/sampling', data).then((r) => r.data),
  updateOrder: (id: string, data: Partial<SamplingWorkOrder>) => api.put('/sampling/' + id, data).then((r) => r.data),
  deleteOrder: (id: string) => api.delete('/sampling/' + id).then((r) => r.data),
  approveOrder: (id: string, data: Partial<SamplingWorkOrder>) =>
    api.post('/sampling/' + id + '/approve', data).then((r) => r.data),
  rejectOrder: (id: string, data: Partial<SamplingWorkOrder>) =>
    api.post('/sampling/' + id + '/reject', data).then((r) => r.data),
  assignOrder: (id: string, data: Partial<SamplingWorkOrder>) =>
    api.post('/sampling/' + id + '/assign', data).then((r) => r.data),
  startProgress: (id: string) => api.post('/sampling/' + id + '/start').then((r) => r.data),
  pauseProgress: (id: string, reason: string) =>
    api.post('/sampling/' + id + '/pause', { reason }).then((r) => r.data),
  completeProgress: (id: string) => api.post('/sampling/' + id + '/complete').then((r) => r.data),
  getStats: () => api.get('/sampling/stats').then((r) => r.data),
};
