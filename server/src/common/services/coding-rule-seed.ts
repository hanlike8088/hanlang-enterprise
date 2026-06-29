import { Injectable, OnModuleInit } from '@nestjs/common';
import { CodingRuleService } from './coding-rule.service';

/**
 * 所有模块的默认编码规则定义。
 *
 * 约定:
 * - yearDigits=0 表示编码不包含年份（如 PO-00001）
 * - separator 默认 '-'
 * - serialDigits 默认 5
 */
const DEFAULT_CODING_RULES = [
  // ── NPI ──────────────────────────────────
  { docType: 'NPI_PROJECT',    prefix: 'NPI', yearDigits: 4, description: 'NPI 项目编号' },
  { docType: 'NPI_TRIAL',      prefix:  'TR', yearDigits: 4, description: '试产编号' },
  { docType: 'NPI_ISSUE',      prefix: 'ISS', yearDigits: 4, description: '试产问题编号' },

  // ── PLM ──────────────────────────────────
  { docType: 'PLM_PRODUCT',    prefix: 'PRD', yearDigits: 4, description: '产品编号' },
  { docType: 'PLM_BOM',        prefix: 'BOM', yearDigits: 4, description: 'BOM 编号' },
  { docType: 'PLM_DOCUMENT',   prefix: 'PLM', yearDigits: 4, description: 'PLM 文档编号' },

  // ── CRM ──────────────────────────────────
  { docType: 'CRM_CUSTOMER',   prefix:   'C', yearDigits: 2, description: '客户编号' },
  { docType: 'CRM_QUOTE',      prefix:  'BJ', yearDigits: 2, description: '报价单编号' },
  { docType: 'CRM_ORDER',      prefix:  'SO', yearDigits: 2, description: '销售订单编号' },
  { docType: 'CRM_COMPLAINT',  prefix:  'KS', yearDigits: 2, description: '客诉编号' },
  { docType: 'CRM_RECON',      prefix:  'DZ', yearDigits: 2, description: '对账编号' },
  { docType: 'CRM_PAYMENT',    prefix:  'HK', yearDigits: 2, description: '收款编号' },

  // ── Supplier ─────────────────────────────
  { docType: 'SUPPLIER',       prefix: 'SUP', yearDigits: 0, description: '供应商编号' },

  // ── Purchase ─────────────────────────────
  { docType: 'PURCHASE_ORDER',   prefix: 'PO', yearDigits: 0, serialDigits: 5, description: '采购订单编号' },
  { docType: 'PURCHASE_RECEIPT', prefix: 'RC', yearDigits: 0, serialDigits: 5, description: '到货单编号' },

  // ── Warehouse ────────────────────────────
  { docType: 'WH_WAREHOUSE',   prefix:  'WH', yearDigits: 0, serialDigits: 4, description: '仓库编号' },
  { docType: 'WH_LOCATION',    prefix: 'WHL', yearDigits: 0, serialDigits: 5, description: '库位编号' },

  // ── Finance ──────────────────────────────
  { docType: 'FINANCE_RECON',   prefix: 'APDZ', yearDigits: 0, serialDigits: 5, description: '应付对账编号' },
  { docType: 'FINANCE_PAYMENT', prefix: 'APFK', yearDigits: 0, serialDigits: 5, description: '付款单编号' },

  // ── Equipment ────────────────────────────
  { docType: 'EQUIPMENT',           prefix: 'EQP', yearDigits: 0, serialDigits: 5, description: '设备编号' },
  { docType: 'EQUIP_MAINT_PLAN',    prefix: 'MTN', yearDigits: 0, serialDigits: 5, description: '保养计划编号' },
  { docType: 'EQUIP_MAINT_WO',      prefix: 'MWO', yearDigits: 0, serialDigits: 5, description: '保养工单编号' },
  { docType: 'EQUIP_REPAIR_REQ',    prefix: 'RPR', yearDigits: 0, serialDigits: 5, description: '报修单编号' },
  { docType: 'EQUIP_REPAIR_WO',     prefix: 'RWO', yearDigits: 0, serialDigits: 5, description: '维修工单编号' },
  { docType: 'EQUIP_SPARE_PART',    prefix: 'SPP', yearDigits: 0, serialDigits: 5, description: '备件编号' },

  // ── Quality ──────────────────────────────
  { docType: 'QLT_STANDARD',      prefix: 'QST', yearDigits: 0, serialDigits: 5, description: '检验标准编号' },
  { docType: 'QLT_INCOMING',      prefix: 'QIM', yearDigits: 0, serialDigits: 5, description: '来料检验编号' },
  { docType: 'QLT_FIRSTPIECE',    prefix: 'FPI', yearDigits: 0, serialDigits: 5, description: '首件检验编号' },
  { docType: 'QLT_PATROL',        prefix: 'PIP', yearDigits: 0, serialDigits: 5, description: '巡检计划编号' },
  { docType: 'QLT_OUTGOING',      prefix: 'OQC', yearDigits: 0, serialDigits: 5, description: '出货检验编号' },
  { docType: 'QLT_NCR',           prefix: 'NCR', yearDigits: 0, serialDigits: 5, description: 'NCR 编号' },
  { docType: 'QLT_CAPA',          prefix: 'CAP', yearDigits: 0, serialDigits: 5, description: 'CAPA 编号' },
  { docType: 'QLT_GAUGE',         prefix: 'GAG', yearDigits: 0, serialDigits: 5, description: '量具编号' },
  { docType: 'QLT_OBJECTIVE',     prefix: 'QOBJ', yearDigits: 4, description: '质量目标编号' },

  // ── Sampling ─────────────────────────────
  { docType: 'SAMPLING_WO',      prefix: 'SWO', yearDigits: 4, description: '打样工单编号' },

  // ── Drawing ──────────────────────────────
  { docType: 'DRAWING',          prefix: 'DRW', yearDigits: 0, serialDigits: 5, description: '图纸编号' },

 // ── ERP ──────────────────────────────────
  { docType: 'ERP_MATERIAL',     prefix: 'MAT', yearDigits: 4, description: '物料编号' },
  { docType: 'ERP_WORK_ORDER',   prefix: 'EWO', yearDigits: 4, description: 'ERP 工单编号' },

  // ── P0: Batch / Training / Document ──────
  { docType: 'BATCH_LABEL',      prefix: 'LBL', yearDigits: 0, serialDigits: 5, description: '批次标签编号' },
  { docType: 'TRAINING_COURSE',  prefix: 'CRS', yearDigits: 0, serialDigits: 5, description: '培训课程编号' },
  { docType: 'TRAINING_RECORD',  prefix: 'TRN', yearDigits: 0, serialDigits: 5, description: '培训记录编号' },
  { docType: 'TRAINING_PLAN',    prefix: 'TPL', yearDigits: 0, serialDigits: 5, description: '培训计划编号' },
  { docType: 'QUALIFICATION',    prefix: 'QAL', yearDigits: 0, serialDigits: 5, description: '资质编号' },
  { docType: 'DOC_APPROVAL',     prefix: 'DAP', yearDigits: 0, serialDigits: 5, description: '文档审批编号' },
  { docType: 'DOC_DISTRIBUTION', prefix: 'DIS', yearDigits: 0, serialDigits: 5, description: '文档分发编号' },
  { docType: 'DOC_OBSOLETE',     prefix: 'OBS', yearDigits: 0, serialDigits: 5, description: '文档废止编号' },
  { docType: 'DOC_CHANGE',       prefix: 'DCR', yearDigits: 0, serialDigits: 5, description: '文档变更编号' },

  // ── P1: MRP & Audit ──────────────────────
  { docType: 'MRP_RUN',          prefix: 'MRP', yearDigits: 4, description: 'MRP 运算编号' },
  { docType: 'AUDIT_PLAN',       prefix:  'AP', yearDigits: 4, description: '审核计划编号' },
  { docType: 'AUDIT_CHECKLIST',  prefix: 'ACL', yearDigits: 4, description: '审核检查表编号' },
  { docType: 'AUDIT_FINDING',    prefix: 'AFD', yearDigits: 4, description: '审核发现编号' },
  // ── P2: Cost & SPC ──────────────────────
  { docType: 'COST_SHEET',       prefix: 'CST', yearDigits: 4, serialDigits: 4, description: '成本核算表编号' },
  { docType: 'SPC_STUDY',      prefix: 'SPC', yearDigits: 0, serialDigits: 5, description: 'SPC研究编号' },
  // ── P2-5: Knowledge ──
  { docType: 'KNOWLEDGE',      prefix: 'KDB', yearDigits: 0, serialDigits: 5, description: '知识文章编号' },
];

/**
 * 编码规则自动种子注入器 — 在模块初始化时执行，确保所有编码规则存在。
 * 通过 CommonModule 的 providers 注册即可。
 */
@Injectable()
export class CodingRuleSeeder implements OnModuleInit {
  constructor(private readonly codingRuleService: CodingRuleService) {}

  async onModuleInit(): Promise<void> {
    await this.codingRuleService.ensureRules(DEFAULT_CODING_RULES);
  }
}
