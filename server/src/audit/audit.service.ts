import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  async createPlan(dto: any) {
    const planCode = await this.codingRule.generate('AUDIT_PLAN');
    return this.prisma.auditPlan.create({ data: { planCode, ...dto } });
  }
  async findAllPlans(year?: number, status?: string) {
    const where: any = {};
    if (year) where.planYear = year;
    if (status) where.status = status;
    return this.prisma.auditPlan.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { checklists: { include: { findings: true } } },
    });
  }
  async findPlanById(id: string) {
    const plan = await this.prisma.auditPlan.findUnique({
      where: { id },
      include: { checklists: { include: { findings: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('审核计划不存在');
    return plan;
  }
  async updatePlan(id: string, dto: any) {
    await this.findPlanById(id);
    return this.prisma.auditPlan.update({ where: { id }, data: dto });
  }
  async deletePlan(id: string) {
    await this.findPlanById(id);
    return this.prisma.auditPlan.delete({ where: { id } });
  }
  async createChecklist(dto: any) {
    const checklistCode = await this.codingRule.generate('AUDIT_CHECKLIST');
    return this.prisma.auditChecklist.create({ data: { checklistCode, ...dto } });
  }
  async findAllChecklists(planId?: string) {
    const where: any = {};
    if (planId) where.planId = planId;
    return this.prisma.auditChecklist.findMany({
      where, orderBy: { sortOrder: 'asc' },
      include: { findings: true, plan: { select: { planName: true, planCode: true } } },
    });
  }
  async updateChecklist(id: string, dto: any) {
    return this.prisma.auditChecklist.update({ where: { id }, data: dto });
  }
  async deleteChecklist(id: string) {
    return this.prisma.auditChecklist.delete({ where: { id } });
  }
  async createFinding(dto: any) {
    const findingCode = await this.codingRule.generate('AUDIT_FINDING');
    return this.prisma.auditFinding.create({ data: { findingCode, ...dto } });
  }
  async findAllFindings(planId?: string, status?: string, severity?: string) {
    const where: any = {};
    if (planId) where.planId = planId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    return this.prisma.auditFinding.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { checklist: { select: { itemNo: true, checkContent: true } } },
    });
  }
  async updateFinding(id: string, dto: any) {
    return this.prisma.auditFinding.update({ where: { id }, data: dto });
  }
  async deleteFinding(id: string) {
    return this.prisma.auditFinding.delete({ where: { id } });
  }
  async getAuditStats() {
    const [planTotal, planActive, findingOpen, findingBySeverity] = await Promise.all([
      this.prisma.auditPlan.count(),
      this.prisma.auditPlan.count({ where: { status: { in: ['draft', 'in_progress', 'planned'] } } }),
      this.prisma.auditFinding.count({ where: { status: 'open' } }),
      this.prisma.auditFinding.groupBy({ by: ['severity'], _count: true }),
    ]);
    return {
      totalPlans: planTotal, activePlans: planActive, openFindings: findingOpen,
      findingsBySeverity: findingBySeverity.map(g => ({ severity: g.severity, count: g._count })),
      findingsByStatus: [
        { status: 'open', count: findingOpen },
        { status: 'closed', count: await this.prisma.auditFinding.count({ where: { status: 'closed' } }) },
        { status: 'in_progress', count: await this.prisma.auditFinding.count({ where: { status: 'in_progress' } }) },
      ],
    };
  }
}
