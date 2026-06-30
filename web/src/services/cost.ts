import api from './api';
import type { CrmQuote } from './types';

export const costApi = {
  createSheet: (data: Partial<CrmQuote>) => api.post('/cost/sheets', data).then((r) => r.data),
  getSheets: (params?: Partial<CrmQuote>) => api.get('/cost/sheets', { params }).then((r) => r.data),
  getSheet: (id: string) => api.get('/cost/sheets/' + id).then((r) => r.data),
  deleteSheet: (id: string) => api.delete('/cost/sheets/' + id).then((r) => r.data),
  quickCompare: (productId: string) =>
    api.get('/cost/quick-compare', { params: { productId } }).then((r) => r.data),
  calculateStandard: (productId: string) =>
    api.get('/cost/calculate-standard', { params: { productId } }).then((r) => r.data),
};
