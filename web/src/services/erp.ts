import api from './api';
import type { ErpMaterial, ErpWorkOrder } from './types';
import dayjs from 'dayjs';

export const erpApi = {
  syncMaterialsFromK3: () => api.post('/erp/sync-materials-from-k3').then((r) => r.data),
  getMaterials: (keyword?: string) =>
    api.get('/erp/materials', { params: { keyword } }).then((r) => r.data),
  createMaterial: (data: Partial<ErpMaterial>) => api.post('/erp/materials', data).then((r) => r.data),
  updateMaterial: (id: string, data: Partial<ErpMaterial>) =>
    api.patch('/erp/materials/' + id, data).then((r) => r.data),
  deleteMaterial: (id: string) => api.delete('/erp/materials/' + id).then((r) => r.data),
  getWorkOrders: (status?: string) =>
    api.get('/erp/work-orders', { params: { status } }).then((r) => r.data),
  createWorkOrder: (data: Partial<ErpWorkOrder>) =>
    api
      .post('/erp/work-orders', {
        ...data,
        startDate: dayjs(data.startDate).toISOString(),
        endDate: data.endDate ? dayjs(data.endDate).toISOString() : undefined,
      })
      .then((r) => r.data),
  updateWorkOrder: (id: string, data: Partial<ErpWorkOrder>) =>
    api
      .patch('/erp/work-orders/' + id, {
        ...data,
        ...(data.startDate ? { startDate: dayjs(data.startDate).toISOString() } : {}),
        ...(data.endDate ? { endDate: dayjs(data.endDate).toISOString() } : {}),
      })
      .then((r) => r.data),
  deleteWorkOrder: (id: string) => api.delete('/erp/work-orders/' + id).then((r) => r.data),
};
