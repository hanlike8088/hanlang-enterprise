import api from './api';
import type { ManufacturingOrder, ProductRouting, ProductionPlan } from './types';

export const manufacturingApi = {
  // 生产排产
  createPlan: (data: Partial<ProductionPlan>) => api.post('/manufacturing/plans', data).then((r) => r.data),
  getPlans: (status?: string, period?: string) =>
    api.get('/manufacturing/plans', { params: { status, period } }).then((r) => r.data),
  getPlan: (id: string) => api.get('/manufacturing/plans/' + id).then((r) => r.data),
  updatePlan: (id: string, data: Partial<ProductionPlan>) =>
    api.patch('/manufacturing/plans/' + id, data).then((r) => r.data),
  deletePlan: (id: string) => api.delete('/manufacturing/plans/' + id).then((r) => r.data),
  addPlanItem: (planId: string, data: Partial<ProductionPlan>) =>
    api.post('/manufacturing/plans/' + planId + '/items', data).then((r) => r.data),
  updatePlanItem: (id: string, data: Partial<ProductionPlanItem>) =>
    api.patch('/manufacturing/plan-items/' + id, data).then((r) => r.data),
  deletePlanItem: (id: string) => api.delete('/manufacturing/plan-items/' + id).then((r) => r.data),
  dragPlanItem: (id: string, data: Partial<ProductionPlanItem>) =>
    api.patch('/manufacturing/plan-items/' + id + '/drag', data).then((r) => r.data),
  checkCapacity: (planId: string) =>
    api.get('/manufacturing/plans/' + planId + '/capacity').then((r) => r.data),
  getCalendars: (start?: string, end?: string) =>
    api.get('/manufacturing/calendars', { params: { start, end } }).then((r) => r.data),
  upsertCalendar: (data: Partial<WorkCalendar>) => api.post('/manufacturing/calendars', data).then((r) => r.data),
  // 工单流转
  createOrder: (data: Partial<ManufacturingOrder>) => api.post('/manufacturing/orders', data).then((r) => r.data),
  getOrders: (status?: string, priority?: string, keyword?: string, planId?: string) =>
    api
      .get('/manufacturing/orders', { params: { status, priority, keyword, planId } })
      .then((r) => r.data),
  getOrder: (id: string) => api.get('/manufacturing/orders/' + id).then((r) => r.data),
  updateOrder: (id: string, data: Partial<ManufacturingOrder>) =>
    api.patch('/manufacturing/orders/' + id, data).then((r) => r.data),
  deleteOrder: (id: string) => api.delete('/manufacturing/orders/' + id).then((r) => r.data),
  transitionOrder: (id: string, toStatus: string) =>
    api.post('/manufacturing/orders/' + id + '/transition', { toStatus }).then((r) => r.data),
  getOrderOperations: (orderId: string) =>
    api.get('/manufacturing/orders/' + orderId + '/operations').then((r) => r.data),
  updateOperation: (id: string, data: Partial<ManufacturingOrderOperation>) =>
    api.patch('/manufacturing/operations/' + id, data).then((r) => r.data),
  transitionOperation: (id: string, toStatus: string) =>
    api.post('/manufacturing/operations/' + id + '/transition', { toStatus }).then((r) => r.data),
  issueMaterial: (orderId: string, data: Partial<ManufacturingOrder>) =>
    api.post('/manufacturing/orders/' + orderId + '/issues', data).then((r) => r.data),
  getIssues: (orderId?: string, materialId?: string) =>
    api.get('/manufacturing/issues', { params: { orderId, materialId } }).then((r) => r.data),
  reportOperation: (data: Partial<OperationReport>) => api.post('/manufacturing/reports', data).then((r) => r.data),
  getReports: (operationId?: string, scanCode?: string) =>
    api.get('/manufacturing/reports', { params: { operationId, scanCode } }).then((r) => r.data),
  completeOrder: (id: string, data: Partial<ManufacturingOrder>) =>
    api.post('/manufacturing/orders/' + id + '/complete', data).then((r) => r.data),
  // WIP 在制品
  getWipOverview: (status?: string) =>
    api.get('/manufacturing/wip', { params: { status } }).then((r) => r.data),
  getWipByWorkCenter: () => api.get('/manufacturing/wip/by-workcenter').then((r) => r.data),
  getOverdueWarnings: () => api.get('/manufacturing/wip/overdue').then((r) => r.data),
  // 工时效率
  getEfficiencyByOrder: (orderId: string) =>
    api.get('/manufacturing/efficiency/order/' + orderId).then((r) => r.data),
  getEfficiencyByWorker: (worker?: string, start?: string, end?: string) =>
    api
      .get('/manufacturing/efficiency/worker', { params: { worker, start, end } })
      .then((r) => r.data),
  // 工艺路线
  createRouting: (data: Partial<ProductRouting>) => api.post('/manufacturing/routings', data).then((r) => r.data),
  getRoutings: (productId?: string) =>
    api.get('/manufacturing/routings', { params: { productId } }).then((r) => r.data),
  getRouting: (id: string) => api.get('/manufacturing/routings/' + id).then((r) => r.data),
  updateRouting: (id: string, data: Partial<ProductRouting>) =>
    api.patch('/manufacturing/routings/' + id, data).then((r) => r.data),
  deleteRouting: (id: string) => api.delete('/manufacturing/routings/' + id).then((r) => r.data),
  addRoutingOperation: (routingId: string, data: Partial<ProductRouting>) =>
    api.post('/manufacturing/routings/' + routingId + '/operations', data).then((r) => r.data),
  updateRoutingOperation: (id: string, data: Partial<RoutingOperation>) =>
    api.patch('/manufacturing/routing-operations/' + id, data).then((r) => r.data),
  deleteRoutingOperation: (id: string) =>
    api.delete('/manufacturing/routing-operations/' + id).then((r) => r.data),
  // 统计
  getStats: () => api.get('/manufacturing/stats').then((r) => r.data),
};
