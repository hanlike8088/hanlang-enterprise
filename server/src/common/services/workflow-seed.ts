import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Workflow state and transition seed definitions.
 * Each module defines its states, then transitions between them.
 * Transitions that require approval carry requiredPerm.
 *
 * Uses upsert to be idempotent across restarts.
 */

interface StateSeed {
  stateCode: string;
  stateName: string;
  module: string;
  isStart?: boolean;
  isEnd?: boolean;
  sortOrder: number;
}

interface TransitionSeed {
  module: string;
  fromStateCode: string;
  toStateCode: string;
  transitionName: string;
  requiredPerm?: string;
  sortOrder: number;
}

const WORKFLOW_SEEDS: { states: StateSeed[]; transitions: TransitionSeed[] }[] = [
  // ===== 打样工单 (SamplingWorkOrder) =====
  {
    states: [
      { stateCode: 'pending_approval', stateName: '待审批', module: 'sampling', isStart: true, sortOrder: 1 },
      { stateCode: 'approved', stateName: '已审批', module: 'sampling', sortOrder: 2 },
      { stateCode: 'rejected', stateName: '已驳回', module: 'sampling', isEnd: true, sortOrder: 3 },
      { stateCode: 'assigned', stateName: '已分派', module: 'sampling', sortOrder: 4 },
      { stateCode: 'in_progress', stateName: '进行中', module: 'sampling', sortOrder: 5 },
      { stateCode: 'completed', stateName: '已完成', module: 'sampling', isEnd: true, sortOrder: 6 },
      { stateCode: 'exception_paused', stateName: '异常暂停', module: 'sampling', sortOrder: 7 },
    ],
    transitions: [
      { module: 'sampling', fromStateCode: 'pending_approval', toStateCode: 'approved', transitionName: '审批通过', requiredPerm: 'sampling:approve', sortOrder: 1 },
      { module: 'sampling', fromStateCode: 'pending_approval', toStateCode: 'rejected', transitionName: '审批驳回', requiredPerm: 'sampling:approve', sortOrder: 2 },
      { module: 'sampling', fromStateCode: 'approved', toStateCode: 'assigned', transitionName: '分派任务', sortOrder: 3 },
      { module: 'sampling', fromStateCode: 'assigned', toStateCode: 'in_progress', transitionName: '开始执行', sortOrder: 4 },
      { module: 'sampling', fromStateCode: 'in_progress', toStateCode: 'completed', transitionName: '完成', sortOrder: 5 },
      { module: 'sampling', fromStateCode: 'in_progress', toStateCode: 'exception_paused', transitionName: '异常暂停', sortOrder: 6 },
      { module: 'sampling', fromStateCode: 'exception_paused', toStateCode: 'in_progress', transitionName: '恢复执行', sortOrder: 7 },
    ],
  },

  // ===== NPI 新产品导入 =====
  {
    states: [
      { stateCode: 'initiated', stateName: '已立项', module: 'npi', isStart: true, sortOrder: 1 },
      { stateCode: 'evaluating', stateName: '评估中', module: 'npi', sortOrder: 2 },
      { stateCode: 'approved', stateName: '评审通过', module: 'npi', sortOrder: 3 },
      { stateCode: 'in_progress', stateName: '实施中', module: 'npi', sortOrder: 4 },
      { stateCode: 'completed', stateName: '已完成', module: 'npi', isEnd: true, sortOrder: 5 },
      { stateCode: 'cancelled', stateName: '已取消', module: 'npi', isEnd: true, sortOrder: 6 },
    ],
    transitions: [
      { module: 'npi', fromStateCode: 'initiated', toStateCode: 'evaluating', transitionName: '提交评估', sortOrder: 1 },
      { module: 'npi', fromStateCode: 'evaluating', toStateCode: 'approved', transitionName: '评审通过', requiredPerm: 'npi:approve', sortOrder: 2 },
      { module: 'npi', fromStateCode: 'evaluating', toStateCode: 'cancelled', transitionName: '取消', sortOrder: 3 },
      { module: 'npi', fromStateCode: 'approved', toStateCode: 'in_progress', transitionName: '启动实施', sortOrder: 4 },
      { module: 'npi', fromStateCode: 'in_progress', toStateCode: 'completed', transitionName: '完成', sortOrder: 5 },
    ],
  },

  // ===== 销售订单 (CrmOrder) =====
  {
    states: [
      { stateCode: 'pending_confirm', stateName: '待确认', module: 'crm', isStart: true, sortOrder: 1 },
      { stateCode: 'confirmed', stateName: '已确认', module: 'crm', sortOrder: 2 },
      { stateCode: 'in_production', stateName: '生产中', module: 'crm', sortOrder: 3 },
      { stateCode: 'shipped', stateName: '已发货', module: 'crm', sortOrder: 4 },
      { stateCode: 'delivered', stateName: '已交付', module: 'crm', sortOrder: 5 },
      { stateCode: 'completed', stateName: '已完成', module: 'crm', isEnd: true, sortOrder: 6 },
      { stateCode: 'cancelled', stateName: '已取消', module: 'crm', isEnd: true, sortOrder: 7 },
    ],
    transitions: [
      { module: 'crm', fromStateCode: 'pending_confirm', toStateCode: 'confirmed', transitionName: '确认订单', requiredPerm: 'crm:order:approve', sortOrder: 1 },
      { module: 'crm', fromStateCode: 'pending_confirm', toStateCode: 'cancelled', transitionName: '取消', sortOrder: 2 },
      { module: 'crm', fromStateCode: 'confirmed', toStateCode: 'in_production', transitionName: '投入生产', sortOrder: 3 },
      { module: 'crm', fromStateCode: 'in_production', toStateCode: 'shipped', transitionName: '发货', sortOrder: 4 },
      { module: 'crm', fromStateCode: 'shipped', toStateCode: 'delivered', transitionName: '确认交付', sortOrder: 5 },
      { module: 'crm', fromStateCode: 'delivered', toStateCode: 'completed', transitionName: '完成', sortOrder: 6 },
    ],
  },

  // ===== 采购订单 (PurchaseOrder) =====
  {
    states: [
      { stateCode: '草稿', stateName: '草稿', module: 'purchase', isStart: true, sortOrder: 1 },
      { stateCode: '已确认', stateName: '已确认', module: 'purchase', sortOrder: 2 },
      { stateCode: '供应商确认', stateName: '供应商确认', module: 'purchase', sortOrder: 3 },
      { stateCode: '已发货', stateName: '已发货', module: 'purchase', sortOrder: 4 },
      { stateCode: '已到货', stateName: '已到货', module: 'purchase', sortOrder: 5 },
      { stateCode: '检验中', stateName: '检验中', module: 'purchase', sortOrder: 6 },
      { stateCode: '已入库', stateName: '已入库', module: 'purchase', sortOrder: 7 },
      { stateCode: '已关闭', stateName: '已关闭', module: 'purchase', isEnd: true, sortOrder: 8 },
    ],
    transitions: [
      { module: 'purchase', fromStateCode: '草稿', toStateCode: '已确认', transitionName: '确认订单', requiredPerm: 'purchase:order:approve', sortOrder: 1 },
      { module: 'purchase', fromStateCode: '已确认', toStateCode: '供应商确认', transitionName: '供应商确认', sortOrder: 2 },
      { module: 'purchase', fromStateCode: '供应商确认', toStateCode: '已发货', transitionName: '发货', sortOrder: 3 },
      { module: 'purchase', fromStateCode: '已发货', toStateCode: '已到货', transitionName: '确认到货', sortOrder: 4 },
      { module: 'purchase', fromStateCode: '已到货', toStateCode: '检验中', transitionName: '送检', sortOrder: 5 },
      { module: 'purchase', fromStateCode: '已到货', toStateCode: '已入库', transitionName: '直接入库', sortOrder: 6 },
      { module: 'purchase', fromStateCode: '检验中', toStateCode: '已入库', transitionName: '检验合格入库', sortOrder: 7 },
      { module: 'purchase', fromStateCode: '已入库', toStateCode: '已关闭', transitionName: '关闭', sortOrder: 8 },
    ],
  },

  // ===== 设备维修 (RepairWorkOrder) =====
  {
    states: [
      { stateCode: '待维修', stateName: '待维修', module: 'equipment', isStart: true, sortOrder: 1 },
      { stateCode: '维修中', stateName: '维修中', module: 'equipment', sortOrder: 2 },
      { stateCode: '待验收', stateName: '待验收', module: 'equipment', sortOrder: 3 },
      { stateCode: '已验收', stateName: '已验收', module: 'equipment', isEnd: true, sortOrder: 4 },
    ],
    transitions: [
      { module: 'equipment', fromStateCode: '待维修', toStateCode: '维修中', transitionName: '开始维修', sortOrder: 1 },
      { module: 'equipment', fromStateCode: '维修中', toStateCode: '待验收', transitionName: '提交验收', sortOrder: 2 },
      { module: 'equipment', fromStateCode: '待验收', toStateCode: '已验收', transitionName: '验收通过', requiredPerm: 'equipment:repair:approve', sortOrder: 3 },
    ],
  },

  // ===== 品质 NCR (NcrReport) =====
  {
    states: [
      { stateCode: '待评估', stateName: '待评估', module: 'quality', isStart: true, sortOrder: 1 },
      { stateCode: '评估中', stateName: '评估中', module: 'quality', sortOrder: 2 },
      { stateCode: '已评估', stateName: '已评估', module: 'quality', sortOrder: 3 },
      { stateCode: '已处置', stateName: '已处置', module: 'quality', sortOrder: 4 },
      { stateCode: '已关闭', stateName: '已关闭', module: 'quality', isEnd: true, sortOrder: 5 },
    ],
    transitions: [
      { module: 'quality', fromStateCode: '待评估', toStateCode: '评估中', transitionName: '开始评估', sortOrder: 1 },
      { module: 'quality', fromStateCode: '评估中', toStateCode: '已评估', transitionName: '完成评估', requiredPerm: 'quality:ncr:approve', sortOrder: 2 },
      { module: 'quality', fromStateCode: '已评估', toStateCode: '已处置', transitionName: '处置', sortOrder: 3 },
      { module: 'quality', fromStateCode: '已评估', toStateCode: '已关闭', transitionName: '关闭', sortOrder: 4 },
    ],
  },

  // ===== 品质 CAPA (CapaReport) =====
  {
    states: [
      { stateCode: '待实施', stateName: '待实施', module: 'quality', isStart: true, sortOrder: 10 },
      { stateCode: '实施中', stateName: '实施中', module: 'quality', sortOrder: 11 },
      { stateCode: '已验证', stateName: '已验证', module: 'quality', sortOrder: 12 },
      { stateCode: '已关闭', stateName: '已关闭', module: 'quality', isEnd: true, sortOrder: 13 },
    ],
    transitions: [
      { module: 'quality', fromStateCode: '待实施', toStateCode: '实施中', transitionName: '开始实施', sortOrder: 10 },
      { module: 'quality', fromStateCode: '实施中', toStateCode: '已验证', transitionName: '验证', requiredPerm: 'quality:capa:approve', sortOrder: 11 },
      { module: 'quality', fromStateCode: '已验证', toStateCode: '已关闭', transitionName: '关闭', sortOrder: 12 },
    ],
  },
  // ===== 制造工单 (ManufacturingOrder) =====
  {
    states: [
      { stateCode: "draft", stateName: "草稿", module: "manufacturing", isStart: true, sortOrder: 1 },
      { stateCode: "released", stateName: "已发布", module: "manufacturing", sortOrder: 2 },
      { stateCode: "in_progress", stateName: "生产中", module: "manufacturing", sortOrder: 3 },
      { stateCode: "paused", stateName: "已暂停", module: "manufacturing", sortOrder: 4 },
      { stateCode: "completed", stateName: "已完工", module: "manufacturing", sortOrder: 5 },
      { stateCode: "closed", stateName: "已关闭", module: "manufacturing", isEnd: true, sortOrder: 6 },
      { stateCode: "cancelled", stateName: "已取消", module: "manufacturing", isEnd: true, sortOrder: 7 },
    ],
    transitions: [
      { module: "manufacturing", fromStateCode: "draft", toStateCode: "released", transitionName: "发布工单", requiredPerm: "manufacturing:order:approve", sortOrder: 1 },
      { module: "manufacturing", fromStateCode: "draft", toStateCode: "cancelled", transitionName: "取消", sortOrder: 2 },
      { module: "manufacturing", fromStateCode: "released", toStateCode: "in_progress", transitionName: "开始生产", sortOrder: 3 },
      { module: "manufacturing", fromStateCode: "in_progress", toStateCode: "completed", transitionName: "完工报工", sortOrder: 4 },
      { module: "manufacturing", fromStateCode: "in_progress", toStateCode: "paused", transitionName: "暂停", sortOrder: 5 },
      { module: "manufacturing", fromStateCode: "paused", toStateCode: "in_progress", transitionName: "恢复生产", sortOrder: 6 },
      { module: "manufacturing", fromStateCode: "completed", toStateCode: "closed", transitionName: "关闭工单", requiredPerm: "manufacturing:order:approve", sortOrder: 7 },
    ],
  },
];

@Injectable()
export class WorkflowSeeder implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureWorkflowConfigs();
  }

  private async ensureWorkflowConfigs(): Promise<void> {
    for (const seed of WORKFLOW_SEEDS) {
      // Upsert states
      const stateIds = new Map<string, string>();
      for (const s of seed.states) {
        const existing = await this.prisma.adminWorkflowState.findUnique({
          where: { stateCode: s.stateCode },
        });
        if (existing) {
          stateIds.set(s.stateCode, existing.id);
        } else {
          const created = await this.prisma.adminWorkflowState.create({
            data: {
              stateCode: s.stateCode,
              stateName: s.stateName,
              module: s.module,
              isStart: s.isStart ?? false,
              isEnd: s.isEnd ?? false,
              sortOrder: s.sortOrder,
            },
          });
          stateIds.set(s.stateCode, created.id);
        }
      }

      // Upsert transitions
      for (const t of seed.transitions) {
        const fromStateId = stateIds.get(t.fromStateCode);
        const toStateId = stateIds.get(t.toStateCode);
        if (!fromStateId || !toStateId) continue;

        const existing = await this.prisma.adminWorkflowTransition.findFirst({
          where: { module: t.module, fromStateId, toStateId },
        });
        if (!existing) {
          await this.prisma.adminWorkflowTransition.create({
            data: {
              module: t.module,
              fromStateId,
              toStateId,
              transitionName: t.transitionName,
              requiredPerm: t.requiredPerm ?? null,
              sortOrder: t.sortOrder,
            },
          });
        }
      }
    }
  }
}
