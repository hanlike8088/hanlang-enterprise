import api from './api';
import type { Warehouse } from './types';

export const warehouseApi = {
  getAll: () => api.get('/warehouse').then((r) => r.data),
  get: (id: string) => api.get('/warehouse/' + id).then((r) => r.data),
  create: (data: Partial<Warehouse>) => api.post('/warehouse', data).then((r) => r.data),
  update: (id: string, data: Partial<Warehouse>) => api.patch('/warehouse/' + id, data).then((r) => r.data),
  delete: (id: string) => api.delete('/warehouse/' + id).then((r) => r.data),
  getLocations: (whId: string) => api.get('/warehouse/' + whId + '/locations').then((r) => r.data),
  createLocation: (whId: string, data: Partial<Warehouse>) =>
    api.post('/warehouse/' + whId + '/locations', data).then((r) => r.data),
  updateLocation: (locId: string, data: Partial<Warehouse>) =>
    api.patch('/warehouse/locations/' + locId, data).then((r) => r.data),
  deleteLocation: (locId: string) =>
    api.delete('/warehouse/locations/' + locId).then((r) => r.data),
  stockIn: (data: Partial<WarehouseInventory>) => api.post('/warehouse/stock-in', data).then((r) => r.data),
  stockOut: (data: Partial<WarehouseInventory>) => api.post('/warehouse/stock-out', data).then((r) => r.data),
  getInventory: (params?: Partial<WarehouseInventory>) => api.get('/warehouse/inventory', { params }).then((r) => r.data),
  getRecords: (params?: Partial<WarehouseInventory>) => api.get('/warehouse/records', { params }).then((r) => r.data),
  getWarnings: () => api.get('/warehouse/warnings').then((r) => r.data),
  getAbcDistribution: () => api.get('/warehouse/abc').then((r) => r.data),
  updateAbcClass: (invId: string, abcClass: string) =>
    api.patch('/warehouse/inventory/' + invId + '/abc', { abcClass }).then((r) => r.data),
  getStats: () => api.get('/warehouse/stats').then((r) => r.data),
  // FIFO 批次管理
  stockInWithBatch: (data: Partial<MaterialBatch>) => api.post('/warehouse/stock-in-fifo', data).then((r) => r.data),
  stockOutFifo: (data: Partial<MaterialBatch>) => api.post('/warehouse/stock-out-fifo', data).then((r) => r.data),
  getBatchInventories: (params?: Partial<MaterialBatch>) =>
    api.get('/warehouse/batch-inventory', { params }).then((r) => r.data),
  getFifoAging: (params?: Partial<MaterialBatch>) => api.get('/warehouse/fifo-aging', { params }).then((r) => r.data),
};
