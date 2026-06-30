import api from './api';
import type { CapaReport, FirstPieceInspection, GaugeInstrument, IncomingMaterial, InspectionStandard, NcrReport, OutgoingInspection, PatrolInspectionPlan } from './types';

export const qualityApi = {
  // 检验标准
  createStandard: (data: Partial<InspectionStandard>) => api.post('/quality/standards', data).then((r) => r.data),
  getStandards: (materialId?: string) =>
    api.get('/quality/standards', { params: { materialId } }).then((r) => r.data),
  updateStandard: (id: string, data: Partial<InspectionStandard>) =>
    api.patch('/quality/standards/' + id, data).then((r) => r.data),
  deleteStandard: (id: string) => api.delete('/quality/standards/' + id).then((r) => r.data),
  // IQC 来料检验
  createIncoming: (data: Partial<IncomingMaterial>) => api.post('/quality/incoming', data).then((r) => r.data),
  getIncomings: (status?: string, purchaseOrderId?: string, keyword?: string) =>
    api
      .get('/quality/incoming', { params: { status, purchaseOrderId, keyword } })
      .then((r) => r.data),
  getIncoming: (id: string) => api.get('/quality/incoming/' + id).then((r) => r.data),
  updateIncoming: (id: string, data: Partial<IncomingMaterial>) =>
    api.patch('/quality/incoming/' + id, data).then((r) => r.data),
  getIqcStats: () => api.get('/quality/incoming/stats').then((r) => r.data),
  createRecord: (incomingId: string, data: Partial<IncomingMaterial>) =>
    api.post('/quality/incoming/' + incomingId + '/records', data).then((r) => r.data),
  submitInspection: (incomingId: string, items: any[], inspector: string) =>
    api
      .post('/quality/incoming/' + incomingId + '/submit', { items, inspector })
      .then((r) => r.data),
  createDisposition: (incomingId: string, data: Partial<IncomingMaterial>) =>
    api.post('/quality/incoming/' + incomingId + '/disposition', data).then((r) => r.data),
  // IPQC 首件检验
  createFirstPiece: (data: Partial<FirstPieceInspection>) => api.post('/quality/first-piece', data).then((r) => r.data),
  getFirstPieces: (status?: string) =>
    api.get('/quality/first-piece', { params: { status } }).then((r) => r.data),
  updateFirstPiece: (id: string, data: Partial<FirstPieceInspection>) =>
    api.patch('/quality/first-piece/' + id, data).then((r) => r.data),
  // IPQC 巡检
  generatePatrolPlans: (days?: number) =>
    api.post('/quality/patrol-plans/generate', { days: days || 7 }).then((r) => r.data),
  getPatrolPlans: (status?: string, date?: string) =>
    api.get('/quality/patrol-plans', { params: { status, date } }).then((r) => r.data),
  getTodayPatrolPlans: () => api.get('/quality/patrol-plans/today').then((r) => r.data),
  executePatrolCheck: (planId: string, data: Partial<PatrolInspectionPlan>) =>
    api.post('/quality/patrol-plans/' + planId + '/execute', data).then((r) => r.data),
  getPatrolRecords: (planId?: string) =>
    api.get('/quality/patrol-records', { params: { planId } }).then((r) => r.data),
  // OQC 出货检验
  createOutgoing: (data: Partial<OutgoingInspection>) => api.post('/quality/outgoing', data).then((r) => r.data),
  getOutgoings: (status?: string, keyword?: string) =>
    api.get('/quality/outgoing', { params: { status, keyword } }).then((r) => r.data),
  getOutgoing: (id: string) => api.get('/quality/outgoing/' + id).then((r) => r.data),
  updateOutgoing: (id: string, data: Partial<OutgoingInspection>) =>
    api.patch('/quality/outgoing/' + id, data).then((r) => r.data),
  // NCR 不合格品
  createNcr: (data: Partial<NcrReport>) => api.post('/quality/ncr', data).then((r) => r.data),
  getNcrs: (status?: string, source?: string) =>
    api.get('/quality/ncr', { params: { status, source } }).then((r) => r.data),
  getNcr: (id: string) => api.get('/quality/ncr/' + id).then((r) => r.data),
  reviewNcr: (id: string, data: Partial<NcrReport>) =>
    api.patch('/quality/ncr/' + id + '/review', data).then((r) => r.data),
  // CAPA 纠正预防
  createCapa: (data: Partial<CapaReport>) => api.post('/quality/capa', data).then((r) => r.data),
  getCapas: (ncrId?: string, status?: string) =>
    api.get('/quality/capa', { params: { ncrId, status } }).then((r) => r.data),
  updateCapa: (id: string, data: Partial<CapaReport>) => api.patch('/quality/capa/' + id, data).then((r) => r.data),
  // 量具/仪器
  createGauge: (data: Partial<GaugeInstrument>) => api.post('/quality/gauges', data).then((r) => r.data),
  getGauges: (status?: string, keyword?: string) =>
    api.get('/quality/gauges', { params: { status, keyword } }).then((r) => r.data),
  getGauge: (id: string) => api.get('/quality/gauges/' + id).then((r) => r.data),
  updateGauge: (id: string, data: Partial<GaugeInstrument>) =>
    api.patch('/quality/gauges/' + id, data).then((r) => r.data),
  deleteGauge: (id: string) => api.delete('/quality/gauges/' + id).then((r) => r.data),
  createCalibration: (gaugeId: string, data: Partial<GaugeInstrument>) =>
    api.post('/quality/gauges/' + gaugeId + '/calibrations', data).then((r) => r.data),
  getGaugeWarnings: () => api.get('/quality/gauges/warnings').then((r) => r.data),
  // 品质统计
  getStats: () => api.get('/quality/stats').then((r) => r.data),
};
