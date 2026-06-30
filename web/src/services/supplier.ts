import api from './api';
import type { Supplier } from './types';

export const supplierApi = {
  syncFromK3: () => api.post('/supplier/sync-from-k3').then((r) => r.data),
  getAll: () => api.get('/supplier').then((r) => r.data),
  get: (id: string) => api.get('/supplier/' + id).then((r) => r.data),
  create: (data: Partial<Supplier>) => api.post('/supplier', data).then((r) => r.data),
  update: (id: string, data: Partial<Supplier>) => api.patch('/supplier/' + id, data).then((r) => r.data),
  delete: (id: string) => api.delete('/supplier/' + id).then((r) => r.data),
  getStats: () => api.get('/supplier/stats').then((r) => r.data),
  createQcds: (id: string, data: Partial<Supplier>) =>
    api.post('/supplier/' + id + '/qcds', data).then((r) => r.data),
  getQcds: (id: string) => api.get('/supplier/' + id + '/qcds').then((r) => r.data),
  createApproval: (id: string, data: Partial<Supplier>) =>
    api.post('/supplier/' + id + '/approvals', data).then((r) => r.data),
  reviewApproval: (id: string, data: Partial<Supplier>) =>
    api.patch('/supplier/approvals/' + id + '/review', data).then((r) => r.data),
};
