import api from './api';
import type { PlmBom, PlmDocument, PlmProduct } from './types';

export const plmApi = {
  getProducts: () => api.get('/plm/products').then((r) => r.data),
  getProduct: (id: string) => api.get('/plm/products/' + id).then((r) => r.data),
  createProduct: (data: Partial<PlmProduct>) => api.post('/plm/products', data).then((r) => r.data),
  updateProduct: (id: string, data: Partial<PlmProduct>) =>
    api.patch('/plm/products/' + id, data).then((r) => r.data),
  deleteProduct: (id: string) => api.delete('/plm/products/' + id).then((r) => r.data),
  getNextProductCode: () =>
    api.get('/plm/products/next-code').then((r) => r.data),
  searchMaterials: (q: string) =>
    api.get('/plm/materials/search', { params: { q } }).then((r) => r.data),
  getBoms: (productId?: string) =>
    api.get('/plm/boms', { params: { productId } }).then((r) => r.data),
  createBom: (data: Partial<PlmBom>) => api.post('/plm/boms', data).then((r) => r.data),
  updateBom: (id: string, data: Partial<PlmBom>) => api.patch('/plm/boms/' + id, data).then((r) => r.data),
  deleteBom: (id: string) => api.delete('/plm/boms/' + id).then((r) => r.data),
  getDocuments: (productId?: string, docType?: string) =>
    api.get('/plm/documents', { params: { productId, docType } }).then((r) => r.data),
  createDocument: (data: Partial<PlmDocument>) => api.post('/plm/documents', data).then((r) => r.data),
  updateDocument: (id: string, data: Partial<PlmDocument>) =>
    api.patch('/plm/documents/' + id, data).then((r) => r.data),
  deleteDocument: (id: string) => api.delete('/plm/documents/' + id).then((r) => r.data),
  getPatents: (patentType?: string) =>
    api.get('/plm/documents/patents', { params: { patentType } }).then((r) => r.data),
  getExpiringPatents: (days?: number) =>
    api.get('/plm/documents/patents/expiring', { params: { days } }).then((r) => r.data),
};
