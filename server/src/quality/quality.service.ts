import { Injectable, NotFoundException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { NCR_TRANSITIONS, CAPA_TRANSITIONS } from '../common/services/status-transitions';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';

@Injectable()
export class QualityService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit() {
    // Chain 4: Purchase Receipt -> auto-create IQC incoming inspection
    this.eventBus.on(CrossModuleEvents.PURCHASE_RECEIPT_COMPLETED,
      async (event) => { await this.handlePurchaseReceipt(event.data); });
  }

  private async handlePurchaseReceipt(data: any) {
    const code = await this.codingRule.generate('QLT_INCOMING');
    const firstItem = data.items?.[0] || {};
    await this.prisma.incomingMaterial.create({
      data: {
        inspectionCode: code,
        materialId: firstItem.materialId || '',
        purchaseOrderId: data.orderId,
        materialCode: firstItem.materialCode || '',
        materialName: firstItem.materialName || '未知物料',
        supplierName: data.supplierName || '',
        batchNo: data.receiptCode || '',
        quantity: data.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0,
        status: '待检',
      },
    });
  }

  // ========== Module 1: IQC 来料检验 ==========

  
  // ========== Quality Objectives (P1-5) ==========

  async createObjective(data: any) {
    const objCode = await this.codingRule.generate('QLT_OBJECTIVE');
    return this.prisma.qualityObjective.create({ data: { objCode, ...data } });
  }

  async getObjectives(year?: number, month?: number, category?: string, status?: string) {
    const where: any = {};
    if (year) where.periodYear = year;
    if (month) where.periodMonth = month;
    if (category) where.category = category;
    if (status) where.status = status;
    return this.prisma.qualityObjective.findMany({
      where,
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { category: 'asc' }],
    });
  }

  async getObjective(id: string) {
    const obj = await this.prisma.qualityObjective.findUnique({ where: { id } });
    if (!obj) throw new NotFoundException('质量目标不存在');
    return obj;
  }

  async updateObjective(id: string, data: any) {
    await this.getObjective(id);
    return this.prisma.qualityObjective.update({ where: { id }, data });
  }

  async deleteObjective(id: string) {
    await this.getObjective(id);
    return this.prisma.qualityObjective.delete({ where: { id } });
  }
  async createStandard(data: any) {
    return this.prisma.inspectionStandard.create({ data });
  }

  async getStandards(materialId?: string) {
    const where = materialId ? { materialId } : {};
    return this.prisma.inspectionStandard.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async updateStandard(id: string, data: any) {
    await this.findStandard(id);
    return this.prisma.inspectionStandard.update({ where: { id }, data });
  }

  async deleteStandard(id: string) {
    await this.findStandard(id);
    return this.prisma.inspectionStandard.delete({ where: { id } });
  }

  private async findStandard(id: string) {
    const s = await this.prisma.inspectionStandard.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('检验标准不存在');
    return s;
  }

  async createIncoming(data: any) {
    const code = await this.codingRule.generate('QLT_INCOMING');
    return this.prisma.incomingMaterial.create({ data: { ...data, inspectionCode: code } });
  }

  async getIncomings(status?: string, purchaseOrderId?: string, keyword?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (keyword) where.OR = [
      { materialName: { contains: keyword } },
      { materialCode: { contains: keyword } },
      { supplierName: { contains: keyword } },
    ];
    return this.prisma.incomingMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { records: true, disposition: true },
    });
  }

  async getIncoming(id: string) {
    const inc = await this.prisma.incomingMaterial.findUnique({
      where: { id },
      include: { records: true, disposition: true },
    });
    if (!inc) throw new NotFoundException('来料检验记录不存在');
    return inc;
  }

  async updateIncoming(id: string, data: any) {
    await this.getIncoming(id);
    return this.prisma.incomingMaterial.update({ where: { id }, data });
  }

  async createRecord(incomingId: string, data: any) {
    await this.getIncoming(incomingId);
    return this.prisma.inspectionRecord.create({ data: { ...data, incomingId } });
  }

  async submitInspection(incomingId: string, items: any[], inspector: string) {
    await this.getIncoming(incomingId);
    const records = [];
    let hasFail = false;
    for (const item of items) {
      let result = '待判';
      if (item.measuredValue != null) {
        if (item.specLower != null && item.measuredValue < item.specLower) result = '不合格';
        else if (item.specUpper != null && item.measuredValue > item.specUpper) result = '不合格';
        else result = '合格';
      }
      if (result === '不合格') hasFail = true;
      const record = await this.prisma.inspectionRecord.create({
        data: { ...item, incomingId, result, inspectedBy: inspector },
      });
      records.push(record);
    }
    const status = hasFail ? '不合格' : '合格';
    await this.prisma.incomingMaterial.update({
      where: { id: incomingId },
      data: { status, inspector, inspectedAt: new Date() },
    });
    return { records, status, hasFail };
  }

  async createDisposition(incomingId: string, data: any) {
    await this.getIncoming(incomingId);
    const disp = await this.prisma.defectDisposition.create({ data: { ...data, incomingId } });
    await this.prisma.incomingMaterial.update({
      where: { id: incomingId },
      data: { status: '已处置' },
    });
    return disp;
  }

  async getIqcStats() {
    const [total, byStatus] = await Promise.all([
      this.prisma.incomingMaterial.count(),
      this.prisma.incomingMaterial.groupBy({ by: ['status'], _count: true }),
    ]);
    return { total, byStatus };
  }

  // ========== Module 2: IPQC 过程检验 ==========

  async createFirstPiece(data: any) {
    const code = await this.codingRule.generate('QLT_FIRSTPIECE');
    return this.prisma.firstPieceInspection.create({ data: { ...data, inspectionCode: code } });
  }

  async getFirstPieces(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.firstPieceInspection.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateFirstPiece(id: string, data: any) {
    const fp = await this.prisma.firstPieceInspection.findUnique({ where: { id } });
    if (!fp) throw new NotFoundException('首件检验不存在');
    return this.prisma.firstPieceInspection.update({
      where: { id },
      data: { ...data, inspectedAt: data.result ? new Date() : undefined },
    });
  }

  async generatePatrolPlans(days: number = 7) {
    const plans = [];
    const now = new Date();
    for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      for (const shift of ['白班', '夜班']) {
        const code = await this.codingRule.generate('QLT_PATROL');
        const plan = await this.prisma.patrolInspectionPlan.create({
          data: { planCode: code, checkDate: date, shift, status: '待执行' },
        });
        plans.push(plan);
      }
    }
    return plans;
  }

  async getPatrolPlans(status?: string, date?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.checkDate = { gte: d, lt: next };
    }
    return this.prisma.patrolInspectionPlan.findMany({
      where,
      orderBy: { checkDate: 'desc' },
      include: { records: true },
    });
  }

  async getTodayPatrolPlans() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.patrolInspectionPlan.findMany({
      where: { checkDate: { gte: today, lt: tomorrow } },
      include: { records: true },
      orderBy: { shift: 'asc' },
    });
  }

  async executePatrolCheck(planId: string, data: any) {
    const plan = await this.prisma.patrolInspectionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('巡检计划不存在');
    const record = await this.prisma.patrolInspectionRecord.create({
      data: { ...data, planId },
    });
    if (data.checkResult === '异常' || data.triggeredNcr) {
      await this.prisma.patrolInspectionPlan.update({ where: { id: planId }, data: { status: '异常' } });
      if (data.triggeredNcr) {
        const ncrCode = await this.codingRule.generate('QLT_NCR');
        await this.prisma.ncrReport.create({
          data: {
            ncrCode,
            source: 'IPQC巡检',
            sourceId: record.id,
            productName: data.productName || '未知产品',
            defectType: data.checkItem,
            severity: '一般',
            description: data.note,
            status: '待评审',
          },
        });
      }
    } else {
      const allDone = await this.prisma.patrolInspectionRecord.count({ where: { planId } });
      if (allDone >= 5) {
        await this.prisma.patrolInspectionPlan.update({ where: { id: planId }, data: { status: '已完成' } });
      }
    }
    return record;
  }

  async getPatrolRecords(planId?: string) {
    const where: any = {};
    if (planId) where.planId = planId;
    return this.prisma.patrolInspectionRecord.findMany({ where, orderBy: { checkedAt: 'desc' } });
  }

  // ========== Module 3: OQC 出货检验 + NCR + CAPA ==========

  async createOutgoing(data: any) {
    const code = await this.codingRule.generate('QLT_OUTGOING');
    return this.prisma.outgoingInspection.create({ data: { ...data, inspectionCode: code } });
  }

  async getOutgoings(status?: string, keyword?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where.OR = [
      { productName: { contains: keyword } },
      { batchNo: { contains: keyword } },
    ];
    return this.prisma.outgoingInspection.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getOutgoing(id: string) {
    const oqc = await this.prisma.outgoingInspection.findUnique({ where: { id } });
    if (!oqc) throw new NotFoundException('出货检验记录不存在');
    return oqc;
  }

  async updateOutgoing(id: string, data: any) {
    await this.getOutgoing(id);
    return this.prisma.outgoingInspection.update({
      where: { id },
      data: { ...data, inspectedAt: data.result ? new Date() : undefined },
    });
  }

  async createNcr(data: any) {
    const code = await this.codingRule.generate('QLT_NCR');
    const ncr = await this.prisma.ncrReport.create({ data: { ...data, ncrCode: code } });

    // Chain 5: Quality NCR -> Supplier QCDS score update
    await this.eventBus.emit(CrossModuleEvents.QUALITY_NCR_CREATED, {
      ncrId: ncr.id,
      ncrCode: ncr.ncrCode,
      productName: ncr.productName || '',
      defectType: ncr.defectType || '',
      severity: ncr.severity || '一般',
      source: ncr.source || '',
      description: ncr.description || '',
    }, 'quality');

    return ncr;
  }

  async getNcrs(status?: string, source?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    return this.prisma.ncrReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { capa: true },
    });
  }

  async getNcr(id: string) {
    const ncr = await this.prisma.ncrReport.findUnique({ where: { id }, include: { capa: true } });
    if (!ncr) throw new NotFoundException('NCR不存在');
    return ncr;
  }

  async reviewNcr(id: string, data: any) {
    const ncr = await this.prisma.ncrReport.findUnique({ where: { id } });
    if (!ncr) throw new NotFoundException('NCR不存在');
    return this.prisma.ncrReport.update({
      where: { id },
      data: { ...data, reviewedAt: new Date() },
    });
  }

  async createCapa(data: any) {
    const code = await this.codingRule.generate('QLT_CAPA');
    return this.prisma.capaReport.create({ data: { ...data, capaCode: code } });
  }

  async getCapas(ncrId?: string, status?: string) {
    const where: any = {};
    if (ncrId) where.ncrId = ncrId;
    if (status) where.status = status;
    return this.prisma.capaReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { ncr: true },
    });
  }

  async updateCapa(id: string, data: any) {
    const capa = await this.prisma.capaReport.findUnique({ where: { id } });
    if (!capa) throw new NotFoundException('CAPA不存在');
    return this.prisma.capaReport.update({
      where: { id },
      data: data.status === '已验证' ? { ...data, verifiedAt: new Date() } : data,
    });
  }

  // ========== Module 4: 量具/仪器管理 ==========

  async createGauge(data: any) {
    const code = await this.codingRule.generate('QLT_GAUGE');
    let nextCal: Date | undefined;
    if (data.lastCalibrationDate && data.calibrationCycle) {
      nextCal = new Date(data.lastCalibrationDate);
      nextCal.setMonth(nextCal.getMonth() + (data.calibrationCycle || 12));
    }
    return this.prisma.gaugeInstrument.create({ data: { ...data, gaugeCode: code, nextCalibrationDate: nextCal } });
  }

  async getGauges(status?: string, keyword?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where.OR = [
      { gaugeName: { contains: keyword } },
      { gaugeCode: { contains: keyword } },
      { serialNo: { contains: keyword } },
    ];
    return this.prisma.gaugeInstrument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { records: { orderBy: { calibrationDate: 'desc' }, take: 1 } },
    });
  }

  async getGauge(id: string) {
    const gauge = await this.prisma.gaugeInstrument.findUnique({
      where: { id },
      include: { records: { orderBy: { calibrationDate: 'desc' } } },
    });
    if (!gauge) throw new NotFoundException('量具不存在');
    return gauge;
  }

  async updateGauge(id: string, data: any) {
    await this.getGauge(id);
    if (data.lastCalibrationDate || data.calibrationCycle) {
      const existing = await this.prisma.gaugeInstrument.findUnique({ where: { id } });
      const lastCal = data.lastCalibrationDate || existing?.lastCalibrationDate;
      const cycle = data.calibrationCycle || existing?.calibrationCycle || 12;
      if (lastCal) {
        const nextCal = new Date(lastCal);
        nextCal.setMonth(nextCal.getMonth() + cycle);
        data.nextCalibrationDate = nextCal;
      }
    }
    return this.prisma.gaugeInstrument.update({ where: { id }, data });
  }

  async deleteGauge(id: string) {
    await this.getGauge(id);
    return this.prisma.gaugeInstrument.delete({ where: { id } });
  }

  async createCalibration(gaugeId: string, data: any) {
    await this.getGauge(gaugeId);
    const record = await this.prisma.calibrationRecord.create({ data: { ...data, gaugeId } });
    const gauge = await this.prisma.gaugeInstrument.findUnique({ where: { id: gaugeId } });
    const nextCal = new Date(data.calibrationDate || new Date());
    nextCal.setMonth(nextCal.getMonth() + (gauge?.calibrationCycle || 12));
    await this.prisma.gaugeInstrument.update({
      where: { id: gaugeId },
      data: { lastCalibrationDate: new Date(data.calibrationDate || new Date()), nextCalibrationDate: nextCal },
    });
    return record;
  }

  async getGaugeWarnings() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + 30);
    return this.prisma.gaugeInstrument.findMany({
      where: { nextCalibrationDate: { lte: warningDate }, status: { not: '报废' } },
      orderBy: { nextCalibrationDate: 'asc' },
    });
  }

  async getQualityStats() {
    const [iqcTotal, ipqcTotal, oqcTotal, ncrTotal, capaTotal, gaugeTotal, gaugeWarnings] = await Promise.all([
      this.prisma.incomingMaterial.count(),
      this.prisma.firstPieceInspection.count(),
      this.prisma.outgoingInspection.count(),
      this.prisma.ncrReport.count({ where: { status: '待评审' } }),
      this.prisma.capaReport.count({ where: { status: { not: '已验证' } } }),
      this.prisma.gaugeInstrument.count(),
      this.prisma.gaugeInstrument.count({ where: { nextCalibrationDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, status: { not: '报废' } } }),
    ]);
    return { iqcTotal, ipqcTotal, oqcTotal, ncrPending: ncrTotal, capaOpen: capaTotal, gaugeTotal, gaugeWarnings };
  }
}
