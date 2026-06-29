import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { EQUIPMENT_TRANSITIONS, MAINTENANCE_WO_TRANSITIONS, REPAIR_WO_TRANSITIONS } from '../common/services/status-transitions';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
  ) {}

  // ==================== Module 1: 设备台账 ====================

  async createEquipment(data: any) {
    const code = await this.codingRule.generate('EQUIPMENT');
    return this.prisma.equipment.create({
      data: {
        equipmentCode: code,
        equipmentName: data.equipmentName,
        modelNo: data.modelNo,
        manufacturer: data.manufacturer,
        location: data.location,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        status: data.status || '运行中',
        category: data.category || '外购设备',
        patentId: data.patentId || null,
        description: data.description,
      },
    });
  }

  async findAllEquipments(keyword?: string, status?: string, category?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (keyword) {
      where.OR = [
        { equipmentCode: { contains: keyword } },
        { equipmentName: { contains: keyword } },
        { modelNo: { contains: keyword } },
        { manufacturer: { contains: keyword } },
      ];
    }
    return this.prisma.equipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { documents: { take: 5 }, checkStandards: { take: 5 } },
    });
  }

  async findEquipment(id: string) {
    const eq = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        checkStandards: { orderBy: { sortOrder: 'asc' } },
        maintenancePlans: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!eq) throw new NotFoundException('设备不存在');
    return eq;
  }

  async updateEquipment(id: string, data: any) {
    await this.findEquipment(id);
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
    });
  }

  async deleteEquipment(id: string) {
    await this.findEquipment(id);
    return this.prisma.equipment.delete({ where: { id } });
  }

  async getDocuments(equipmentId: string) {
    return this.prisma.equipmentDocument.findMany({
      where: { equipmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(equipmentId: string, data: any) {
    await this.findEquipment(equipmentId);
    return this.prisma.equipmentDocument.create({
      data: { ...data, equipmentId },
    });
  }

  async updateDocument(id: string, data: any) {
    return this.prisma.equipmentDocument.update({ where: { id }, data });
  }

  async deleteDocument(id: string) {
    return this.prisma.equipmentDocument.delete({ where: { id } });
  }

  async getPatents() {
    return this.prisma.plmDocument.findMany({
      where: { docType: '专利' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== Module 2: TPM点检 ====================

  async createCheckStandard(equipmentId: string, data: any) {
    await this.findEquipment(equipmentId);
    return this.prisma.tpmCheckStandard.create({
      data: {
        equipmentId,
        checkItem: data.checkItem,
        checkMethod: data.checkMethod,
        normalRange: data.standardValue || data.normalRange,
        unit: data.unit,
        frequency: data.frequency || '每日',
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async getCheckStandards(equipmentId: string) {
    return this.prisma.tpmCheckStandard.findMany({
      where: { equipmentId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateCheckStandard(id: string, data: any) {
    return this.prisma.tpmCheckStandard.update({ where: { id }, data });
  }

  async deleteCheckStandard(id: string) {
    return this.prisma.tpmCheckStandard.delete({ where: { id } });
  }

  async generateCheckPlans(equipmentId: string, days: number = 7) {
    await this.findEquipment(equipmentId);
    const standards = await this.prisma.tpmCheckStandard.findMany({ where: { equipmentId } });
    const results = [];
    const today = new Date();

    for (let d = 0; d < days; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + d);
      const dateStr = checkDate.toISOString().split('T')[0];

      for (const std of standards) {
        let shouldCreate = false;
        if (std.frequency === '每日') shouldCreate = true;
        else if (std.frequency === '每周' && checkDate.getDay() === 1) shouldCreate = true;
        else if (std.frequency === '每月' && checkDate.getDate() === 1) shouldCreate = true;

        if (shouldCreate) {
          const existing = await this.prisma.tpmCheckPlan.findFirst({
            where: {
              equipmentId,
              checkDate: { gte: new Date(`${dateStr}T00:00:00`), lte: new Date(`${dateStr}T23:59:59`) },
            },
          });
          if (existing) continue;

          const plan = await this.prisma.tpmCheckPlan.create({
            data: {
              planCode: `CP-${dateStr.replace(/-/g, '')}-${std.id.slice(0, 6)}`,
              equipmentId,
              checkDate,
              status: '待执行',
            },
          });
          results.push(plan);
        }
      }
    }
    return results;
  }

  async getCheckPlans(equipmentId?: string, status?: string, date?: string) {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    if (date) {
      where.checkDate = { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) };
    }
    return this.prisma.tpmCheckPlan.findMany({
      where,
      orderBy: { checkDate: 'desc' },
      include: {
        equipment: { select: { equipmentName: true, equipmentCode: true } },
        checkRecords: true,
      },
    });
  }

  async getTodayCheckPlans() {
    const today = new Date().toISOString().split('T')[0];
    return this.getCheckPlans(undefined, undefined, today);
  }

  async executeCheck(planId: string, data: { checkItem: string; checkResult: string; reading?: string; note?: string; checkedBy?: string }) {
    const plan = await this.prisma.tpmCheckPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('计划不存在');

    const record = await this.prisma.tpmCheckRecord.create({
      data: {
        planId,
        equipmentId: plan.equipmentId,
        checkItem: data.checkItem,
        checkResult: data.checkResult,
        reading: data.reading,
        note: data.note,
        checkedBy: data.checkedBy,
        triggeredRepair: data.checkResult === '异常',
      },
    });

    const standards = await this.prisma.tpmCheckStandard.findMany({ where: { equipmentId: plan.equipmentId } });
    const records = await this.prisma.tpmCheckRecord.findMany({ where: { planId } });
    if (records.length >= standards.length) {
      const hasAbnormal = records.some(r => r.checkResult === '异常');
      await this.prisma.tpmCheckPlan.update({ where: { id: planId }, data: { status: hasAbnormal ? '异常' : '已完成' } });

      if (hasAbnormal) {
        const abnormalItems = records.filter(r => r.checkResult === '异常').map(r => r.checkItem).join('、');
        const repair = await this.prisma.repairRequest.create({
          data: {
            requestCode: `RR-${Date.now().toString(36).toUpperCase()}`,
            equipmentId: plan.equipmentId,
            faultDescription: `TPM点检异常项: ${abnormalItems}`,
            severity: '一般',
            reporter: data.checkedBy || '系统自动',
            status: '待派工',
          },
        });

        // Chain 6: Equipment Anomaly -> PLM technical change document
        await this.eventBus.emit(CrossModuleEvents.EQUIPMENT_ANOMALY_DETECTED, {
          equipmentId: plan.equipmentId,
          equipmentName: '' /* filled by PLM handler via lookup */,
          checkDate: plan.checkDate,
          abnormalItems,
          repairRequestId: repair?.id || null,
        }, 'equipment');

        return { record, repair };
      }
    }

    return { record };
  }

  async getCheckRecords(planId?: string, equipmentId?: string) {
    const where: any = {};
    if (planId) where.planId = planId;
    if (equipmentId) where.equipmentId = equipmentId;
    return this.prisma.tpmCheckRecord.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      include: {
        plan: { select: { planCode: true, checkDate: true } },
        equipment: { select: { equipmentName: true } },
      },
    });
  }

  // ==================== 保养管理 ====================

  async createMaintenancePlan(equipmentId: string, data: any) {
    await this.findEquipment(equipmentId);
    const code = await this.codingRule.generate('EQUIP_MAINT_PLAN');
    return this.prisma.maintenancePlan.create({
      data: {
        planCode: code,
        equipmentId,
        planType: data.planType || '定期保养',
        content: data.content,
        frequency: data.frequency,
        nextDate: data.nextDate ? new Date(data.nextDate) : null,
        status: '计划中',
      },
    });
  }

  async getMaintenancePlans(equipmentId?: string, status?: string) {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    return this.prisma.maintenancePlan.findMany({
      where,
      orderBy: { nextDate: 'asc' },
      include: {
        equipment: { select: { equipmentName: true, equipmentCode: true } },
        workOrders: { take: 5 },
      },
    });
  }

  async updateMaintenancePlan(id: string, data: any) {
    return this.prisma.maintenancePlan.update({
      where: { id },
      data: { ...data, nextDate: data.nextDate ? new Date(data.nextDate) : undefined },
    });
  }

  async deleteMaintenancePlan(id: string) {
    return this.prisma.maintenancePlan.delete({ where: { id } });
  }

  async createMaintenanceWorkOrder(data: any) {
    const code = await this.codingRule.generate('EQUIP_MAINT_WO');
    return this.prisma.maintenanceWorkOrder.create({
      data: {
        orderCode: code,
        planId: data.planId || null,
        equipmentId: data.equipmentId,
        workType: data.workType || '保养',
        status: '待执行',
        description: data.description,
        assignedTo: data.assignedTo,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        equipment: { select: { equipmentName: true } },
        plan: { select: { planCode: true } },
      },
    });
  }

  async getMaintenanceWorkOrders(equipmentId?: string, status?: string) {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    return this.prisma.maintenanceWorkOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: { select: { equipmentName: true, equipmentCode: true } },
        plan: { select: { planCode: true } },
      },
    });
  }

  async updateMaintenanceWorkOrder(id: string, data: any) {
    return this.prisma.maintenanceWorkOrder.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteMaintenanceWorkOrder(id: string) {
    return this.prisma.maintenanceWorkOrder.delete({ where: { id } });
  }

  // ==================== Module 3: 维修管理 ====================

  async createRepairRequest(data: any) {
    const code = await this.codingRule.generate('EQUIP_REPAIR_REQ');
    return this.prisma.repairRequest.create({
      data: {
        requestCode: code,
        equipmentId: data.equipmentId,
        faultDescription: data.faultDescription,
        severity: data.severity || '一般',
        reporter: data.reporter,
        status: '待派工',
      },
      include: {
        equipment: { select: { equipmentName: true, equipmentCode: true } },
      },
    });
  }

  async getRepairRequests(equipmentId?: string, status?: string) {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    return this.prisma.repairRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: { select: { equipmentName: true, equipmentCode: true } },
        workOrder: true,
      },
    });
  }

  async findRepairRequest(id: string) {
    const rr = await this.prisma.repairRequest.findUnique({
      where: { id },
      include: {
        equipment: { select: { equipmentName: true, equipmentCode: true } },
        workOrder: true,
      },
    });
    if (!rr) throw new NotFoundException('报修单不存在');
    return rr;
  }

  async dispatchRepair(id: string, data: { assignedTo: string; repairMethod?: string }) {
    const rr = await this.findRepairRequest(id);
    this.sm.validateTransition(REPAIR_WO_TRANSITIONS, rr.status, '待维修');

    const code = await this.codingRule.generate('EQUIP_REPAIR_WO');

    const [workOrder] = await Promise.all([
      this.prisma.repairWorkOrder.create({
        data: {
          orderCode: code,
          requestId: id,
          equipmentId: rr.equipmentId,
          assignedTo: data.assignedTo,
          repairMethod: data.repairMethod,
          status: '待维修',
        },
      }),
      this.prisma.repairRequest.update({ where: { id }, data: { status: '已派工' } }),
    ]);

    return workOrder;
  }

  async startRepair(id: string) {
    const wo = await this.prisma.repairWorkOrder.findUnique({ where: { id } });
    if (!wo) throw new NotFoundException('工单不存在');
    return this.prisma.repairWorkOrder.update({
      where: { id },
      data: { status: '维修中', startTime: new Date() },
    });
  }

  async completeRepair(id: string, data: { result: string; partsUsed?: string }) {
    const wo = await this.prisma.repairWorkOrder.findUnique({ where: { id } });
    if (!wo) throw new NotFoundException('工单不存在');

    const [workOrder] = await Promise.all([
      this.prisma.repairWorkOrder.update({
        where: { id },
        data: { status: '待验收', endTime: new Date(), result: data.result, partsUsed: data.partsUsed },
      }),
      this.prisma.repairRequest.update({ where: { id: wo.requestId }, data: { status: '待验收' } }),
    ]);

    return workOrder;
  }

  async verifyRepair(id: string, data: { verifiedBy: string }) {
    const wo = await this.prisma.repairWorkOrder.findUnique({ where: { id } });
    if (!wo) throw new NotFoundException('工单不存在');

    const [workOrder] = await Promise.all([
      this.prisma.repairWorkOrder.update({
        where: { id },
        data: { status: '已验收', verifiedBy: data.verifiedBy, verifiedAt: new Date() },
      }),
      this.prisma.repairRequest.update({ where: { id: wo.requestId }, data: { status: '已关闭' } }),
      this.prisma.equipment.update({ where: { id: wo.equipmentId }, data: { status: '运行中' } }),
    ]);

    return workOrder;
  }

  async getRepairStats() {
    const workOrders = await this.prisma.repairWorkOrder.findMany({
      where: { startTime: { not: null }, endTime: { not: null } },
      include: { equipment: { select: { equipmentName: true, equipmentCode: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const total = workOrders.length;
    const totalRepairHours = workOrders.reduce((sum, wo) => {
      if (wo.startTime && wo.endTime) {
        return sum + (wo.endTime.getTime() - wo.startTime.getTime()) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);

    const mttr = total > 0 ? (totalRepairHours / total).toFixed(1) : 0;
    const mtbf = total > 0 ? ((30 * 24 * total - totalRepairHours) / total).toFixed(1) : 0;

    const byEquipment: Record<string, any> = {};
    for (const wo of workOrders) {
      const key = wo.equipmentId;
      if (!byEquipment[key]) {
        byEquipment[key] = {
          equipmentName: wo.equipment.equipmentName,
          equipmentCode: wo.equipment.equipmentCode,
          count: 0,
          totalHours: 0,
        };
      }
      byEquipment[key].count++;
      if (wo.startTime && wo.endTime) {
        byEquipment[key].totalHours += (wo.endTime.getTime() - wo.startTime.getTime()) / (1000 * 60 * 60);
      }
    }

    return {
      totalRepairs: total,
      mttr: `${mttr}h`,
      mtbf: `${mtbf}h`,
      totalRepairHours: totalRepairHours.toFixed(1),
      byEquipment: Object.values(byEquipment),
    };
  }

  // ==================== Module 4: 备品备件 ====================

  async createSparePart(data: any) {
    const code = await this.codingRule.generate('EQUIP_SPARE_PART');
    return this.prisma.sparePart.create({
      data: {
        partCode: code,
        partName: data.partName,
        spec: data.spec,
        unit: data.unit || '个',
        safetyStock: data.safetyStock || 0,
        currentStock: data.currentStock || 0,
        price: data.price,
        category: data.category,
        location: data.location,
      },
    });
  }

  async findAllSpareParts(keyword?: string, category?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (keyword) {
      where.OR = [
        { partCode: { contains: keyword } },
        { partName: { contains: keyword } },
        { spec: { contains: keyword } },
      ];
    }
    return this.prisma.sparePart.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { records: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  async findSparePart(id: string) {
    const sp = await this.prisma.sparePart.findUnique({
      where: { id },
      include: { records: { orderBy: { createdAt: 'desc' } } },
    });
    if (!sp) throw new NotFoundException('备件不存在');
    return sp;
  }

  async updateSparePart(id: string, data: any) {
    await this.findSparePart(id);
    return this.prisma.sparePart.update({ where: { id }, data });
  }

  async deleteSparePart(id: string) {
    await this.findSparePart(id);
    return this.prisma.sparePart.delete({ where: { id } });
  }

  async stockIn(data: { partId: string; quantity: number; operator?: string; remark?: string }) {
    const part = await this.findSparePart(data.partId);
    const beforeQty = part.currentStock;
    const afterQty = beforeQty + data.quantity;

    const [record] = await Promise.all([
      this.prisma.sparePartRecord.create({
        data: {
          partId: data.partId,
          type: '入库',
          quantity: data.quantity,
          beforeQty,
          afterQty,
          operator: data.operator,
          remark: data.remark,
        },
      }),
      this.prisma.sparePart.update({
        where: { id: data.partId },
        data: { currentStock: afterQty },
      }),
    ]);

    return record;
  }

  async stockOut(data: { partId: string; quantity: number; operator?: string; reference?: string; remark?: string }) {
    const part = await this.findSparePart(data.partId);
    if (part.currentStock < data.quantity) throw new BadRequestException('库存不足');

    const beforeQty = part.currentStock;
    const afterQty = beforeQty - data.quantity;

    const [record] = await Promise.all([
      this.prisma.sparePartRecord.create({
        data: {
          partId: data.partId,
          type: '领用',
          quantity: data.quantity,
          beforeQty,
          afterQty,
          reference: data.reference,
          operator: data.operator,
          remark: data.remark,
        },
      }),
      this.prisma.sparePart.update({
        where: { id: data.partId },
        data: { currentStock: afterQty },
      }),
    ]);

    return record;
  }

  async getSparePartRecords(partId?: string, type?: string) {
    const where: any = {};
    if (partId) where.partId = partId;
    if (type) where.type = type;
    return this.prisma.sparePartRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { part: { select: { partName: true, partCode: true } } },
    });
  }

  async getSparePartWarnings() {
    const parts = await this.prisma.sparePart.findMany({
      where: { safetyStock: { gt: 0 } },
      orderBy: { currentStock: 'asc' },
    });
    return parts.filter(p => p.currentStock <= p.safetyStock);
  }

  async getPurchaseSuggestions() {
    const allParts = await this.prisma.sparePart.findMany({
      where: { safetyStock: { gt: 0 } },
      orderBy: { currentStock: 'asc' },
    });
    const warnings = allParts.filter(p => p.currentStock <= p.safetyStock);
    return warnings.map(sp => ({
      partId: sp.id,
      partCode: sp.partCode,
      partName: sp.partName,
      currentStock: sp.currentStock,
      safetyStock: sp.safetyStock,
      suggestQuantity: Math.ceil(sp.safetyStock * 2 - sp.currentStock),
      estimatedCost: sp.price ? (Math.ceil(sp.safetyStock * 2 - sp.currentStock) * sp.price) : 0,
    }));
  }

  async getEquipmentStats() {
    const [total, byStatus, byCategory] = await Promise.all([
      this.prisma.equipment.count(),
      this.prisma.equipment.groupBy({ by: ['status'], _count: true }),
      this.prisma.equipment.groupBy({ by: ['category'], _count: true }),
    ]);
    const pendingRepairs = await this.prisma.repairRequest.count({ where: { status: { not: '已关闭' } } });
    const todayPlans = await this.prisma.tpmCheckPlan.count({ where: { status: '待执行' } });
    const sparePartsLow = await this.prisma.sparePart.findMany({ where: { safetyStock: { gt: 0 } } });
    const spareWarnings = sparePartsLow.filter(p => p.currentStock <= p.safetyStock).length;
    return { total, byStatus, byCategory, pendingRepairs, todayPlans, spareWarnings };
  }
}
