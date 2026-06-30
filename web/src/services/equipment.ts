import api from './api';
import type { Equipment } from './types';

export const equipmentApi = {
  // �豸̨��
  getEquipments: (keyword?: string, status?: string, category?: string) =>
    api.get('/equipment', { params: { keyword, status, category } }).then((r) => r.data),
  getEquipment: (id: string) => api.get('/equipment/' + id).then((r) => r.data),
  createEquipment: (data: Partial<Equipment>) => api.post('/equipment', data).then((r) => r.data),
  updateEquipment: (id: string, data: Partial<Equipment>) =>
    api.patch('/equipment/' + id, data).then((r) => r.data),
  deleteEquipment: (id: string) => api.delete('/equipment/' + id).then((r) => r.data),
  getEquipmentStats: () => api.get('/equipment/stats').then((r) => r.data),
  getPatents: () => api.get('/equipment/patents').then((r) => r.data),
  // �豸�ĵ�
  getDocuments: (equipmentId: string) =>
    api.get('/equipment/' + equipmentId + '/documents').then((r) => r.data),
  createDocument: (equipmentId: string, data: Partial<Equipment>) =>
    api.post('/equipment/' + equipmentId + '/documents', data).then((r) => r.data),
  updateDocument: (docId: string, data: Partial<Equipment>) =>
    api.patch('/equipment/documents/' + docId, data).then((r) => r.data),
  deleteDocument: (docId: string) =>
    api.delete('/equipment/documents/' + docId).then((r) => r.data),
  // TPM����׼
  getCheckStandards: (equipmentId: string) =>
    api.get('/equipment/' + equipmentId + '/check-standards').then((r) => r.data),
  createCheckStandard: (equipmentId: string, data: Partial<Equipment>) =>
    api.post('/equipment/' + equipmentId + '/check-standards', data).then((r) => r.data),
  updateCheckStandard: (stdId: string, data: Partial<Equipment>) =>
    api.patch('/equipment/check-standards/' + stdId, data).then((r) => r.data),
  deleteCheckStandard: (stdId: string) =>
    api.delete('/equipment/check-standards/' + stdId).then((r) => r.data),
  // TPM���ƻ�
  generateCheckPlans: (equipmentId: string, days?: number) =>
    api
      .post('/equipment/' + equipmentId + '/check-plans/generate', { days: days || 7 })
      .then((r) => r.data),
  getCheckPlans: (equipmentId?: string, status?: string, date?: string) =>
    api
      .get('/equipment/check-plans', { params: { equipmentId, status, date } })
      .then((r) => r.data),
  getTodayCheckPlans: () => api.get('/equipment/check-plans/today').then((r) => r.data),
  executeCheck: (planId: string, data: Partial<TpmCheckPlan>) =>
    api.post('/equipment/check-plans/' + planId + '/execute', data).then((r) => r.data),
  getCheckRecords: (planId?: string, equipmentId?: string) =>
    api.get('/equipment/check-records', { params: { planId, equipmentId } }).then((r) => r.data),
  // ����
  getMaintenancePlans: (equipmentId?: string, status?: string) =>
    api
      .get('/equipment/maintenance-plans', { params: { equipmentId, status } })
      .then((r) => r.data),
  createMaintenancePlan: (equipmentId: string, data: Partial<Equipment>) =>
    api.post('/equipment/' + equipmentId + '/maintenance-plans', data).then((r) => r.data),
  updateMaintenancePlan: (planId: string, data: Partial<MaintenancePlan>) =>
    api.patch('/equipment/maintenance-plans/' + planId, data).then((r) => r.data),
  deleteMaintenancePlan: (planId: string) =>
    api.delete('/equipment/maintenance-plans/' + planId).then((r) => r.data),
  getMaintenanceWorkOrders: (equipmentId?: string, status?: string) =>
    api
      .get('/equipment/maintenance-work-orders', { params: { equipmentId, status } })
      .then((r) => r.data),
  createMaintenanceWorkOrder: (data: Partial<MaintenanceWorkOrder>) =>
    api.post('/equipment/maintenance-work-orders', data).then((r) => r.data),
  updateMaintenanceWorkOrder: (woId: string, data: Partial<MaintenanceWorkOrder>) =>
    api.patch('/equipment/maintenance-work-orders/' + woId, data).then((r) => r.data),
  deleteMaintenanceWorkOrder: (woId: string) =>
    api.delete('/equipment/maintenance-work-orders/' + woId).then((r) => r.data),
  // ά��
  getRepairRequests: (equipmentId?: string, status?: string) =>
    api.get('/equipment/repair-requests', { params: { equipmentId, status } }).then((r) => r.data),
  getRepairRequest: (id: string) => api.get('/equipment/repair-requests/' + id).then((r) => r.data),
  createRepairRequest: (data: Partial<RepairRequest>) =>
    api.post('/equipment/repair-requests', data).then((r) => r.data),
  dispatchRepair: (id: string, data: Partial<RepairRequest>) =>
    api.post('/equipment/repair-requests/' + id + '/dispatch', data).then((r) => r.data),
  startRepair: (woId: string) =>
    api.post('/equipment/repair-work-orders/' + woId + '/start').then((r) => r.data),
  completeRepair: (woId: string, data: Partial<Equipment>) =>
    api.post('/equipment/repair-work-orders/' + woId + '/complete', data).then((r) => r.data),
  verifyRepair: (woId: string, data: Partial<Equipment>) =>
    api.post('/equipment/repair-work-orders/' + woId + '/verify', data).then((r) => r.data),
  getRepairStats: () => api.get('/equipment/repair-stats').then((r) => r.data),
  // ��Ʒ����
  getSpareParts: (keyword?: string, category?: string) =>
    api.get('/equipment/spare-parts', { params: { keyword, category } }).then((r) => r.data),
  getSparePart: (id: string) => api.get('/equipment/spare-parts/' + id).then((r) => r.data),
  createSparePart: (data: Partial<SparePart>) => api.post('/equipment/spare-parts', data).then((r) => r.data),
  updateSparePart: (id: string, data: Partial<SparePart>) =>
    api.patch('/equipment/spare-parts/' + id, data).then((r) => r.data),
  deleteSparePart: (id: string) => api.delete('/equipment/spare-parts/' + id).then((r) => r.data),
  stockIn: (data: Partial<SparePart>) => api.post('/equipment/spare-parts/stock-in', data).then((r) => r.data),
  stockOut: (data: Partial<SparePart>) => api.post('/equipment/spare-parts/stock-out', data).then((r) => r.data),
  getSparePartRecords: (partId?: string, type?: string) =>
    api.get('/equipment/spare-parts-records', { params: { partId, type } }).then((r) => r.data),
  getSparePartWarnings: () => api.get('/equipment/spare-parts/warnings').then((r) => r.data),
  getPurchaseSuggestions: () => api.get('/equipment/spare-parts/suggestions').then((r) => r.data),
};
