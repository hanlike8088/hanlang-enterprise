import api from './api';
import type { CrmContactRecord, CrmCustomer, CrmOrder, CrmQuote } from './types';

export const crmApi = {
  syncCustomersFromK3: () => api.post('/crm/sync-customers-from-k3').then((r) => r.data),
  get: (url: string, config?: Record<string, unknown>) => api.get(url, config),
  post: (url: string, data?: Partial<CrmCustomer>, config?: Record<string, unknown>) => api.post(url, data, config),
  patch: (url: string, data?: Partial<CrmCustomer>, config?: Record<string, unknown>) => api.patch(url, data, config),
  delete: (url: string, config?: Record<string, unknown>) => api.delete(url, config),
  getCustomers: (keyword?: string, category?: string) =>
    api.get('/crm/customers', { params: { keyword, category } }).then((r) => r.data),
  getCustomer: (id: string) => api.get('/crm/customers/' + id).then((r) => r.data),
  createCustomer: (data: Partial<CrmCustomer>) => api.post('/crm/customers', data).then((r) => r.data),
  updateCustomer: (id: string, data: Partial<CrmCustomer>) =>
    api.patch('/crm/customers/' + id, data).then((r) => r.data),
  deleteCustomer: (id: string) => api.delete('/crm/customers/' + id).then((r) => r.data),
  getContactRecords: (customerId: string) =>
    api.get('/crm/customers/' + customerId + '/contact-records').then((r) => r.data),
  createContactRecord: (data: Partial<CrmContactRecord>) =>
    api.post('/crm/contact-records', data).then((r) => r.data),
  updateContactRecord: (id: string, data: Partial<CrmContactRecord>) =>
    api.patch('/crm/contact-records/' + id, data).then((r) => r.data),
  deleteContactRecord: (id: string) =>
    api.delete('/crm/contact-records/' + id).then((r) => r.data),
  getQuotes: (keyword?: string, status?: string) =>
    api.get('/crm/quotes', { params: { keyword, status } }).then((r) => r.data),
  getQuote: (id: string) => api.get('/crm/quotes/' + id).then((r) => r.data),
  createQuote: (data: Partial<CrmQuote>) => api.post('/crm/quotes', data).then((r) => r.data),
  updateQuote: (id: string, data: Partial<CrmQuote>) =>
    api.patch('/crm/quotes/' + id, data).then((r) => r.data),
  deleteQuote: (id: string) => api.delete('/crm/quotes/' + id).then((r) => r.data),
  getProductBom: (productId: string) =>
    api.get('/crm/products/' + productId + '/bom-for-quote').then((r) => r.data),
  getOrders: (keyword?: string, status?: string) =>
    api.get('/crm/orders', { params: { keyword, status } }).then((r) => r.data),
  getOrder: (id: string) => api.get('/crm/orders/' + id).then((r) => r.data),
  createOrder: (data: Partial<CrmOrder>) => api.post('/crm/orders', data).then((r) => r.data),
  convertQuoteToOrder: (data: Partial<CrmOrder>) =>
    api.post('/crm/orders/convert-quote', data).then((r) => r.data),
  updateOrder: (id: string, data: Partial<CrmOrder>) =>
    api.patch('/crm/orders/' + id, data).then((r) => r.data),
  deleteOrder: (id: string) => api.delete('/crm/orders/' + id).then((r) => r.data),
  getOrdersForCustomer: (customerId: string) =>
    api.get('/crm/customers/' + customerId + '/orders').then((r) => r.data),
};
