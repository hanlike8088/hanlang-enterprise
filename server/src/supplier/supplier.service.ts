import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';
import { K3CloudService } from '../k3cloud/k3cloud.service';

@Injectable()
export class SupplierService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly eventBus: EventBusService,
    private readonly k3cloud: K3CloudService,
  ) {}

  onModuleInit() {
    // Chain 5: Quality NCR -> supplier QCDS score update
    this.eventBus.on(CrossModuleEvents.QUALITY_NCR_CREATED,
      async (event) => { await this.handleQualityNcr(event.data); });
  }

  private async handleQualityNcr(data: any) {
    // If we can identify a supplier from the NCR context, record a QCDS deduction
    // For now, log the event; full supplier matching requires a lookup by product/material
    console.log(
      `[EventBus] NCR "${data.ncrCode}" created (${data.defectType}, severity=${data.severity}). ` +
      `Source: ${data.source}. Review supplier QCDS if applicable.`,
    );
    // Future: look up supplier by material code and auto-create a QCDS score entry
  }

  async create(data: any) {
    const code = await this.codingRule.generate('SUPPLIER');
    return this.prisma.supplier.create({ data: { ...data, supplierCode: code } });
  }

  async findAll(category?: string, status?: string, keyword?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (keyword) where.OR = [
      { supplierName: { contains: keyword } },
      { supplierCode: { contains: keyword } },
      { contactPerson: { contains: keyword } },
    ];
    return this.prisma.supplier.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { qcdsScores: true, purchaseOrders: true } } } });
  }

  async findOne(id: string) {
    const sup = await this.prisma.supplier.findUnique({ where: { id }, include: { qcdsScores: { orderBy: { createdAt: 'desc' } }, approvals: { orderBy: { createdAt: 'desc' } } } });
    if (!sup) throw new NotFoundException('供应商不存在');
    return sup;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  async createQcdsScore(supplierId: string, data: any) {
    await this.findOne(supplierId);
    const total = (data.qualityScore * 0.3 + data.costScore * 0.2 + data.deliveryScore * 0.3 + data.serviceScore * 0.2);
    const score = await this.prisma.supplierQcdsScore.create({
      data: { ...data, supplierId, totalScore: Math.round(total * 100) / 100 },
    });
    const avgScore = await this.prisma.supplierQcdsScore.aggregate({ where: { supplierId }, _avg: { totalScore: true } });
    const avg = avgScore._avg.totalScore || 0;
    const rating = avg >= 90 ? 'A' : avg >= 75 ? 'B' : avg >= 60 ? 'C' : 'D';
    await this.prisma.supplier.update({ where: { id: supplierId }, data: { rating } });
    return score;
  }

  async getQcdsScores(supplierId: string) {
    return this.prisma.supplierQcdsScore.findMany({ where: { supplierId }, orderBy: { createdAt: 'desc' } });
  }

  async createApproval(supplierId: string, data: any) {
    await this.findOne(supplierId);
    return this.prisma.supplierApproval.create({ data: { ...data, supplierId } });
  }

  async reviewApproval(id: string, data: any) {
    const approval = await this.prisma.supplierApproval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('审批不存在');
    const result = await this.prisma.supplierApproval.update({ where: { id }, data: { status: data.status, approver: data.approver, comment: data.comment, decidedAt: new Date() } });
    if (data.status === '已通过') {
      const supplierStatus = approval.approvalType === '准入' ? '合格' : approval.approvalType === '淘汰' ? '淘汰' : undefined;
      if (supplierStatus) await this.prisma.supplier.update({ where: { id: approval.supplierId }, data: { status: supplierStatus } });
    }
    return result;
  }

  async getApprovals(supplierId?: string) {
    const where = supplierId ? { supplierId } : {};
    return this.prisma.supplierApproval.findMany({ where, orderBy: { createdAt: 'desc' }, include: { supplier: { select: { supplierName: true, supplierCode: true } } } });
  }

  /** 从金蝶同步供应商数据 */
  async syncFromK3() {
    const logger = new Logger('SupplierSync');
    logger.log('开始从金蝶同步供应商...');
    const result = await this.k3cloud.getSuppliers();
    const rows = (result?.Result || result || []) as any[];
    if (!Array.isArray(rows) || rows.length === 0) {
      logger.warn('金蝶返回供应商数据为空');
      return { synced: 0, skipped: 0, total: 0, message: '金蝶返回供应商数据为空' };
    }
    const existing = await this.prisma.supplier.findMany({ select: { supplierCode: true } });
    const existingCodes = new Set(existing.map(s => s.supplierCode));
    let synced = 0; let skipped = 0;
    for (const row of rows) {
      const code = row[0] as string;
      const name = row[1] as string;
      if (!code || !name) continue;
      if (existingCodes.has(code)) { skipped++; continue; }
      try {
        await this.prisma.supplier.create({
          data: { supplierCode: code, supplierName: name, category: '原材料', status: '潜在' },
        });
        synced++;
      } catch (e) {
        logger.warn('创建供应商失败: ' + code + ' - ' + (e as any)?.message);
      }
    }
    logger.log('供应商同步完成: 新增 ' + synced + ', 跳过 ' + skipped);
    return { synced, skipped, total: rows.length };
  }

  async getStats() {
    const [total, byCategory, byStatus, byRating] = await Promise.all([
      this.prisma.supplier.count(),
      this.prisma.supplier.groupBy({ by: ['category'], _count: true }),
      this.prisma.supplier.groupBy({ by: ['status'], _count: true }),
      this.prisma.supplier.groupBy({ by: ['rating'], _count: true }),
    ]);
    return { total, byCategory, byStatus, byRating };
  }
}