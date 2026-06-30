import api from './api';
import type { Drawing } from './types';

export const drawingApi = {
  getDrawings: (productId?: string, status?: string) =>
    api.get('/drawings', { params: { productId, status } }).then((r) => r.data),
  getDrawing: (id: string) => api.get('/drawings/' + id).then((r) => r.data),
  createDrawing: (data: Partial<Drawing>) => api.post('/drawings', data).then((r) => r.data),
  updateDrawing: (id: string, data: Partial<Drawing>) => api.put('/drawings/' + id, data).then((r) => r.data),
  deleteDrawing: (id: string) => api.delete('/drawings/' + id).then((r) => r.data),
  getVersions: (drawingId: string) =>
    api.get('/drawings/' + drawingId + '/versions').then((r) => r.data),
  addVersion: (drawingId: string, data: Partial<Drawing>) =>
    api.post('/drawings/' + drawingId + '/versions', data).then((r) => r.data),
  compareVersions: (drawingId: string, v1: string, v2: string) =>
    api
      .get('/drawings/' + drawingId + '/versions/compare', { params: { v1, v2 } })
      .then((r) => r.data),
};
