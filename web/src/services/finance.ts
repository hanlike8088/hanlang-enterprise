import api from './api';
import type { ApPayment, ApReconciliation } from './types';

export const financeApi = {
  fetchApFromK3: () => api.get('/finance/ap-from-k3').then((r) => r.data),
  getReconciliations: (status?: string, supplierId?: string) =>
    api.get('/finance/reconciliations', { params: { status, supplierId } }).then((r) => r.data),
  getReconciliation: (id: string) => api.get('/finance/reconciliations/' + id).then((r) => r.data),
  generateReconciliation: (purchaseOrderId: string, invoiceAmount: number) =>
    api.post('/finance/reconciliations', { purchaseOrderId, invoiceAmount }).then((r) => r.data),
  confirmReconciliation: (id: string, confirmedBy: string) =>
    api.post('/finance/reconciliations/' + id + '/confirm', { confirmedBy }).then((r) => r.data),
  getAgingAnalysis: () => api.get('/finance/aging').then((r) => r.data),
  getDifferences: () => api.get('/finance/differences').then((r) => r.data),
  getStats: () => api.get('/finance/stats').then((r) => r.data),
  getPayments: (reconciliationId?: string) =>
    api.get('/finance/payments', { params: { reconciliationId } }).then((r) => r.data),
  createPayment: (data: Partial<ApPayment>) => api.post('/finance/payments', data).then((r) => r.data),
  deletePayment: (id: string) => api.delete('/finance/payments/' + id).then((r) => r.data),
  markAsPaid: (reconciliationId: string) =>
    api.post('/finance/reconciliations/' + reconciliationId + '/paid').then((r) => r.data),
  syncToK3: (reconciliationId: string) =>
    api.post('/k3cloud/sync-ap', { reconciliationId, confirmed: true }).then((r) => r.data),
  getPaymentPlan: () => api.get('/finance/payment-plan').then((r) => r.data),
  getStatement: (supplierId: string, period?: string) =>
    api.get('/finance/statements/' + supplierId, { params: { period } }).then((r) => r.data),
};
