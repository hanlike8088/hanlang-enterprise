import api from './api';
import type { PurchaseOrder } from './types';

export const purchaseApi = {
  getAll: (status?: string, supplierId?: string, keyword?: string) =>
    api.get('/purchase', { params: { status, supplierId, keyword } }).then((r) => r.data),
  get: (id: string) => api.get('/purchase/' + id).then((r) => r.data),
  create: (data: Partial<PurchaseOrder>) => api.post('/purchase', data).then((r) => r.data),
  update: (id: string, data: Partial<PurchaseOrder>) => api.patch('/purchase/' + id, data).then((r) => r.data),
  delete: (id: string) => api.delete('/purchase/' + id).then((r) => r.data),
  advanceStatus: (id: string, status: string) =>
    api.post('/purchase/' + id + '/status', { status }).then((r) => r.data),
  getWarnings: () => api.get('/purchase/warnings').then((r) => r.data),
  getStats: () => api.get('/purchase/stats').then((r) => r.data),
  createReceipt: (orderId: string, data: Partial<PurchaseOrder>) =>
    api.post('/purchase/' + orderId + '/receipts', data).then((r) => r.data),
  getReceipts: (orderId: string) =>
    api.get('/purchase/' + orderId + '/receipts').then((r) => r.data),
  linkSaleOrder: (orderId: string, saleOrderId: string) =>
    api.post('/purchase/' + orderId + '/link-sale-order', { saleOrderId }).then((r) => r.data),
  unlinkSaleOrder: (linkId: string) =>
    api.delete('/purchase/sale-order-link/' + linkId).then((r) => r.data),
  getLinkedSaleOrders: (orderId: string) =>
    api.get('/purchase/' + orderId + '/sale-orders').then((r) => r.data),
};
