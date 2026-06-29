import { TransitionDef } from './status-machine.service';

// ============================================================
// Phase 1.1: 技术研发中心 (Sampling, Drawing, PLM, NPI)
// ============================================================

// 采样工单 (SamplingWorkOrder)
export const SAMPLING_WO_TRANSITIONS: TransitionDef[] = [
  { from: 'pending_approval', to: 'approved' },
  { from: 'pending_approval', to: 'rejected' },
  { from: 'approved',         to: 'assigned' },
  { from: 'assigned',         to: 'in_progress' },
  { from: 'in_progress',      to: 'completed' },
  { from: 'in_progress',      to: 'exception_paused' },
  { from: 'exception_paused', to: 'in_progress' },
];

// 图纸 (Drawing)
export const DRAWING_TRANSITIONS: TransitionDef[] = [
  { from: 'active',   to: 'archived' },
  { from: 'active',   to: 'obsoleted' },
  { from: 'archived', to: 'active' },
];

// PLM 产品 (PlmProduct)
export const PLM_PRODUCT_TRANSITIONS: TransitionDef[] = [
  { from: 'developing',      to: 'trial' },
  { from: 'developing',      to: 'cancelled' },
  { from: 'trial',           to: 'mass_production' },
  { from: 'trial',           to: 'cancelled' },
  { from: 'mass_production', to: 'discontinued' },
];

// PLM BOM
export const PLM_BOM_TRANSITIONS: TransitionDef[] = [
  { from: 'draft',  to: 'active' },
  { from: 'active', to: 'archived' },
];

// PLM 文档
export const PLM_DOCUMENT_TRANSITIONS: TransitionDef[] = [
  { from: 'draft',  to: 'active' },
  { from: 'active', to: 'archived' },
];

// ============================================================
// NPI 新产品导入
// ============================================================

// NPI 项目 (NpiProject)
export const NPI_PROJECT_TRANSITIONS: TransitionDef[] = [
  { from: 'initiated',   to: 'evaluating' },
  { from: 'initiated',   to: 'cancelled' },
  { from: 'evaluating',  to: 'approved' },
  { from: 'evaluating',  to: 'cancelled' },
  { from: 'approved',    to: 'in_progress' },
  { from: 'in_progress', to: 'completed' },
];

// NPI 试产 (NpiTrialRun)
export const NPI_TRIAL_TRANSITIONS: TransitionDef[] = [
  { from: 'planned',     to: 'in_progress' },
  { from: 'planned',     to: 'cancelled' },
  { from: 'in_progress', to: 'testing' },
  { from: 'testing',     to: 'completed' },
  { from: 'testing',     to: 'failed' },
  { from: 'failed',      to: 'planned' },
];

// NPI 问题 (NpiIssue)
export const NPI_ISSUE_TRANSITIONS: TransitionDef[] = [
  { from: 'pending',   to: 'in_review' },
  { from: 'in_review', to: 'resolved' },
  { from: 'in_review', to: 'rejected' },
];

// NPI 审批 (NpiApproval)
export const NPI_APPROVAL_TRANSITIONS: TransitionDef[] = [
  { from: 'pending',  to: 'approved' },
  { from: 'pending',  to: 'rejected' },
];

// ============================================================
// Phase 1.2: CRM 销售管理
// ============================================================

// 报价单 (CrmQuote)
export const CRM_QUOTE_TRANSITIONS: TransitionDef[] = [
  { from: 'draft', to: 'sent' },
  { from: 'draft', to: 'cancelled' },
  { from: 'sent',  to: 'won' },
  { from: 'sent',  to: 'lost' },
];

// 销售订单 (CrmOrder)
export const CRM_ORDER_TRANSITIONS: TransitionDef[] = [
  { from: 'pending_confirm', to: 'confirmed' },
  { from: 'pending_confirm', to: 'cancelled' },
  { from: 'confirmed',       to: 'in_production' },
  { from: 'confirmed',       to: 'cancelled' },
  { from: 'in_production',   to: 'shipped' },
  { from: 'shipped',         to: 'delivered' },
  { from: 'delivered',       to: 'completed' },
];

// 客诉 (CrmComplaint)
export const CRM_COMPLAINT_TRANSITIONS: TransitionDef[] = [
  { from: 'pending',      to: 'investigating' },
  { from: 'investigating', to: 'resolved' },
  { from: 'investigating', to: 'escalated' },
  { from: 'resolved',      to: 'closed' },
  { from: 'resolved',      to: 'reopened' },
  { from: 'escalated',     to: 'resolved' },
  { from: 'reopened',      to: 'investigating' },
];

// 对账 (CrmReconciliation)
export const CRM_RECONCILIATION_TRANSITIONS: TransitionDef[] = [
  { from: 'pending',  to: 'matched' },
  { from: 'pending',  to: 'partial' },
  { from: 'partial',  to: 'completed' },
  { from: 'matched',  to: 'completed' },
];

// 回款 (CrmPayment)
export const CRM_PAYMENT_TRANSITIONS: TransitionDef[] = [
  { from: 'pending',  to: 'planned' },
  { from: 'pending',  to: 'overdue' },
  { from: 'planned',  to: 'paid' },
  { from: 'overdue',  to: 'planned' },
];

// ============================================================
// Phase 1.3: 供应链中心 (Purchase)
// ============================================================

// 采购订单 (PurchaseOrder)
export const PURCHASE_ORDER_TRANSITIONS: TransitionDef[] = [
  { from: '草稿',     to: '已确认' },
  { from: '已确认',   to: '供应商确认' },
  { from: '供应商确认', to: '已发货' },
  { from: '已发货',   to: '已到货' },
  { from: '已到货',   to: '检验中' },
  { from: '已到货',   to: '已入库' },
  { from: '检验中',   to: '已入库' },
  { from: '已入库',   to: '已关闭' },
];

// ============================================================
// Phase 2: 设备工程部 (Equipment)
// ============================================================

// 设备台帐 (Equipment)
export const EQUIPMENT_TRANSITIONS: TransitionDef[] = [
  { from: '运行中', to: '停机' },
  { from: '运行中', to: '维修中' },
  { from: '运行中', to: '报废' },
  { from: '停机',   to: '运行中' },
  { from: '停机',   to: '维修中' },
  { from: '停机',   to: '报废' },
  { from: '维修中', to: '运行中' },
  { from: '维修中', to: '报废' },
];

// 保养工单 (MaintenanceWorkOrder)
export const MAINTENANCE_WO_TRANSITIONS: TransitionDef[] = [
  { from: '待执行', to: '执行中' },
  { from: '执行中', to: '已完成' },
];

// 报修/维修工单 (RepairRequest -> RepairWorkOrder)
export const REPAIR_WO_TRANSITIONS: TransitionDef[] = [
  { from: '待维修', to: '维修中' },
  { from: '维修中', to: '待验收' },
  { from: '待验收', to: '已验收' },
];

// ============================================================
// Phase 3: 品质中心 (Quality)
// ============================================================

// NCR 不合格品报告 (NcrReport)
export const NCR_TRANSITIONS: TransitionDef[] = [
  { from: '待评估', to: '评估中' },
  { from: '评估中', to: '已评估' },
  { from: '已评估', to: '已处置' },
  { from: '已评估', to: '已关闭' },
];

// CAPA 纠正预防 (CapaReport)
export const CAPA_TRANSITIONS: TransitionDef[] = [
  { from: '待实施', to: '实施中' },
  { from: '实施中', to: '已验证' },
  { from: '已验证', to: '已关闭' },
];

// ============================================================
// ============================================================
// Phase 4: 制造中心 (Manufacturing)
// ============================================================

// 制造工单 (ManufacturingOrder)
export const MFG_ORDER_TRANSITIONS: TransitionDef[] = [
  { from: "draft",       to: "released" },
  { from: "draft",       to: "cancelled" },
  { from: "released",    to: "in_progress" },
  { from: "in_progress", to: "completed" },
  { from: "in_progress", to: "paused" },
  { from: "paused",      to: "in_progress" },
  { from: "completed",   to: "closed" },
];

// 工单工序 (ManufacturingOrderOperation)
export const MFG_OPERATION_TRANSITIONS: TransitionDef[] = [
  { from: "pending",   to: "in_progress" },
  { from: "in_progress", to: "completed" },
  { from: "in_progress", to: "paused" },
  { from: "paused",      to: "in_progress" },
];

// 生产排产计划 (ProductionPlan)
export const MFG_PLAN_TRANSITIONS: TransitionDef[] = [
  { from: "draft",        to: "confirmed" },
  { from: "confirmed",    to: "executing" },
  { from: "executing",    to: "completed" },
  { from: "draft",        to: "cancelled" },
];

// ERP 基础数据 (erp 模块)
// ============================================================

// 物料主数据 (ErpMaterial)
export const ERP_MATERIAL_TRANSITIONS: TransitionDef[] = [
  { from: 'active',   to: 'inactive' },
  { from: 'inactive', to: 'active' },
];

// ERP 工单 (ErpWorkOrder)
export const ERP_WORK_ORDER_TRANSITIONS: TransitionDef[] = [
  { from: 'pending',     to: 'in_progress' },
  { from: 'pending',     to: 'cancelled' },
  { from: 'in_progress', to: 'completed' },
];
