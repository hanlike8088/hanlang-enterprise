import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodingRuleService } from "../common/services/coding-rule.service";
import { StatusMachineService } from "../common/services/status-machine.service";
import { MFG_ORDER_TRANSITIONS, MFG_OPERATION_TRANSITIONS, MFG_PLAN_TRANSITIONS } from "../common/services/status-transitions";
import { EventBusService } from "../common/services/event-bus.service";
import { CrossModuleEvents } from "../common/services/event-types";

@Injectable()
export class ManufacturingService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit() {
    // Chain 8: Manufacturing Order Released -> Warehouse material preparation
    this.eventBus.on(CrossModuleEvents.MFG_ORDER_RELEASED,
      async (event) => { await this.handleOrderReleased(event.data); });
  }

  private async handleOrderReleased(data: any) {
    // When an order is released, optionally log for warehouse material prep
    console.log("[MFG] Order released, warehouse should prep materials:", data.orderCode);
  }

  // ================================================================
  // Module 1: 生产排产 (Production Plan)
  // ================================================================

  async createPlan(data: any) {
    const code = await this.codingRule.generate("MFG_PLAN");
    return this.prisma.productionPlan.create({ data: { ...data, planCode: code } });
  }

  async findAllPlans(status?: string, period?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (period) where.planPeriod = period;
    return this.prisma.productionPlan.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } }, orders: true },
    });
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } }, orders: true },
    });
    if (!plan) throw new NotFoundException("排产计划不存在");
    return plan;
  }

  async updatePlan(id: string, data: any) {
    await this.findOnePlan(id);
    return this.prisma.productionPlan.update({ where: { id }, data });
  }

  async deletePlan(id: string) {
    await this.findOnePlan(id);
    return this.prisma.productionPlan.delete({ where: { id } });
  }

  async addPlanItem(planId: string, data: any) {
    await this.findOnePlan(planId);
    const maxSort = await this.prisma.productionPlanItem.aggregate({
      where: { planId }, _max: { sortOrder: true },
    });
    return this.prisma.productionPlanItem.create({
      data: { ...data, planId, sortOrder: (maxSort._max.sortOrder || 0) + 1 },
    });
  }

  async updatePlanItem(id: string, data: any) {
    const item = await this.prisma.productionPlanItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("排产明细不存在");
    return this.prisma.productionPlanItem.update({ where: { id }, data });
  }

  async deletePlanItem(id: string) {
    const item = await this.prisma.productionPlanItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("排产明细不存在");
    return this.prisma.productionPlanItem.delete({ where: { id } });
  }

  async dragPlanItem(id: string, data: { startDate?: string; endDate?: string; workCenter?: string }) {
    const item = await this.prisma.productionPlanItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("排产明细不存在");
    return this.prisma.productionPlanItem.update({ where: { id }, data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined } });
  }

  async checkCapacity(planId: string) {
    const plan = await this.findOnePlan(planId);
    const items = plan.items || [];
    const byWorkCenter: Record<string, { totalHours: number; items: any[] }> = {};
    for (const item of items) {
      const wc = item.workCenter || "未指定";
      if (!byWorkCenter[wc]) byWorkCenter[wc] = { totalHours: 0, items: [] };
      const hours = (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 3600000;
      byWorkCenter[wc].totalHours += hours;
      byWorkCenter[wc].items.push(item);
    }
    const alerts: any[] = [];
    for (const [wc, info] of Object.entries(byWorkCenter)) {
      if (info.totalHours > plan.capacityHours) {
        alerts.push({ workCenter: wc, usedHours: info.totalHours, capacityHours: plan.capacityHours, overload: info.totalHours - plan.capacityHours });
      }
    }
    return { planId, alerts, byWorkCenter };
  }

  // ================================================================
  // Module 1: 工作日历
  // ================================================================

  async findCalendars(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate && endDate) {
      where.calendarDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    return this.prisma.workCalendar.findMany({ where, orderBy: { calendarDate: "asc" } });
  }

  async upsertCalendar(data: any) {
    return this.prisma.workCalendar.upsert({
      where: { calendarDate_shift: { calendarDate: new Date(data.calendarDate), shift: data.shift || "白班" } },
      create: { ...data, calendarDate: new Date(data.calendarDate) },
      update: { isWorkingDay: data.isWorkingDay, startTime: data.startTime, endTime: data.endTime, capacityHours: data.capacityHours, note: data.note },
    });
  }

  // ================================================================
  // Module 2: 工单流转 (Manufacturing Order)
  // ================================================================

  async createOrder(data: any) {
    const code = await this.codingRule.generate("MFG_ORDER");
    const order = await this.prisma.manufacturingOrder.create({
      data: { ...data, orderCode: code, status: "draft" },
    });

    // Auto-create operations from routing
    if (data.routingId) {
      const routingOps = await this.prisma.routingOperation.findMany({
        where: { routingId: data.routingId }, orderBy: { opSequence: "asc" },
      });
      for (const rop of routingOps) {
        await this.prisma.manufacturingOrderOperation.create({
          data: {
            orderId: order.id,
            routingOpId: rop.id,
            opSequence: rop.opSequence,
            opName: rop.opName,
            workCenter: rop.workCenter,
            machineNo: rop.machineNo,
            plannedHours: rop.standardLaborHours,
            inputQty: data.quantity,
          },
        });
      }
    }
    return order;
  }

  async findAllOrders(status?: string, priority?: string, keyword?: string, planId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (planId) where.planId = planId;
    if (keyword) where.OR = [
      { orderCode: { contains: keyword } },
      { productName: { contains: keyword } },
      { customerName: { contains: keyword } },
    ];
    return this.prisma.manufacturingOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { operations: true } } },
    });
  }

  async findOneOrder(id: string) {
    const order = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: {
        operations: { orderBy: { opSequence: "asc" }, include: { reports: { orderBy: { createdAt: "desc" } } } },
        materialIssues: { orderBy: { issuedAt: "desc" } },
      },
    });
    if (!order) throw new NotFoundException("制造工单不存在");
    return order;
  }

  async updateOrder(id: string, data: any) {
    await this.findOneOrder(id);
    return this.prisma.manufacturingOrder.update({ where: { id }, data });
  }

  async deleteOrder(id: string) {
    await this.findOneOrder(id);
    return this.prisma.manufacturingOrder.delete({ where: { id } });
  }

  async transitionOrder(id: string, toStatus: string) {
    const order = await this.findOneOrder(id);
    const from = order.status;
    const allowed = this.sm.canTransition(MFG_ORDER_TRANSITIONS, from, toStatus);
    if (!allowed) throw new BadRequestException(`不允许从 ${from} 转换到 ${toStatus}`);

    const updateData: any = { status: toStatus };
    if (toStatus === "in_progress" && !order.actualStart) updateData.actualStart = new Date();
    if (toStatus === "completed") updateData.actualEnd = new Date();
    if (toStatus === "released") {
      await this.eventBus.emit(CrossModuleEvents.MFG_ORDER_RELEASED, { orderId: id, orderCode: order.orderCode, productName: order.productName }, "manufacturing");
    }

    return this.prisma.manufacturingOrder.update({ where: { id }, data: updateData });
  }

  // ================================================================
  // Module 2: 工序操作
  // ================================================================

  async findOrderOperations(orderId: string) {
    await this.findOneOrder(orderId);
    return this.prisma.manufacturingOrderOperation.findMany({
      where: { orderId },
      orderBy: { opSequence: "asc" },
      include: { reports: { orderBy: { createdAt: "desc" } } },
    });
  }

  async updateOperation(id: string, data: any) {
    const op = await this.prisma.manufacturingOrderOperation.findUnique({ where: { id } });
    if (!op) throw new NotFoundException("工序不存在");
    return this.prisma.manufacturingOrderOperation.update({ where: { id }, data });
  }

  async transitionOperation(id: string, toStatus: string) {
    const op = await this.prisma.manufacturingOrderOperation.findUnique({ where: { id } });
    if (!op) throw new NotFoundException("工序不存在");
    const allowed = this.sm.canTransition(MFG_OPERATION_TRANSITIONS, op.status, toStatus);
    if (!allowed) throw new BadRequestException(`不允许从 ${op.status} 转换到 ${toStatus}`);

    const updateData: any = { status: toStatus };
    if (toStatus === "in_progress" && !op.actualStart) updateData.actualStart = new Date();
    if (toStatus === "completed") updateData.actualEnd = new Date();
    return this.prisma.manufacturingOrderOperation.update({ where: { id }, data: updateData });
  }

  // ================================================================
  // Module 2: 领料
  // ================================================================

  async issueMaterial(orderId: string, data: any) {
    await this.findOneOrder(orderId);
    const code = await this.codingRule.generate("MFG_ISSUE");
    return this.prisma.materialIssuing.create({ data: { ...data, orderId, issueCode: code } });
  }

  async findIssues(orderId?: string, materialId?: string) {
    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (materialId) where.materialId = materialId;
    return this.prisma.materialIssuing.findMany({ where, orderBy: { issuedAt: "desc" } });
  }

  // ================================================================
  // Module 2: 报工 (扫二维码报工)
  // ================================================================

  async reportOperation(data: { operationId: string; worker?: string; shift?: string; processedQty: number; qualifiedQty: number; defectQty?: number; defectReason?: string; laborHours?: number; scanCode?: string; note?: string }) {
    const op = await this.prisma.manufacturingOrderOperation.findUnique({
      where: { id: data.operationId }, include: { order: true },
    });
    if (!op) throw new NotFoundException("工序不存在");

    if (op.status !== "in_progress") {
      await this.transitionOperation(op.id, "in_progress");
    }

    const code = await this.codingRule.generate("MFG_REPORT");
    const report = await this.prisma.operationReport.create({
      data: {
        ...data, defectQty: data.defectQty || 0, laborHours: data.laborHours || 0,
        operationId: data.operationId, reportCode: code,
        startTime: new Date(),
      },
    });

    // Update operation progress
    const opReports = await this.prisma.operationReport.findMany({ where: { operationId: op.id } });
    const totalProcessed = opReports.reduce((s, r) => s + r.processedQty, 0);
    const totalQualified = opReports.reduce((s, r) => s + r.qualifiedQty, 0);
    const totalDefect = opReports.reduce((s, r) => s + r.defectQty, 0);
    const totalLabor = opReports.reduce((s, r) => s + r.laborHours, 0);

    await this.prisma.manufacturingOrderOperation.update({
      where: { id: op.id },
      data: { completedQty: totalProcessed, qualifiedQty: totalQualified, defectQty: totalDefect, actualHours: totalLabor },
    });

    // Update order progress
    const allOps = await this.prisma.manufacturingOrderOperation.findMany({ where: { orderId: op.orderId } });
    const orderCompletedQty = allOps.reduce((s, o) => s + o.completedQty, 0);
    const orderQualifiedQty = allOps.reduce((s, o) => s + o.qualifiedQty, 0);
    await this.prisma.manufacturingOrder.update({
      where: { id: op.orderId },
      data: { completedQty: orderCompletedQty, qualifiedQty: orderQualifiedQty },
    });

    return report;
  }

  async findReports(operationId?: string, scanCode?: string) {
    const where: any = {};
    if (operationId) where.operationId = operationId;
    if (scanCode) where.scanCode = scanCode;
    return this.prisma.operationReport.findMany({ where, orderBy: { createdAt: "desc" }, include: { operation: true } });
  }

  // ================================================================
  // Module 2: 完工入库 (Complete order -> stock in)
  // ================================================================

  async completeOrder(id: string, warehouseData?: { warehouseId: string; materialId: string; materialName: string; locationId?: string; operator?: string }) {
    const order = await this.findOneOrder(id);
    if (order.status !== "completed") {
      await this.transitionOrder(id, "completed");
    }
    // Auto stock-in if warehouse data provided
    if (warehouseData && warehouseData.warehouseId) {
      const { warehouseId, materialId, materialName, locationId, operator } = warehouseData;
      const existing = await this.prisma.warehouseInventory.findUnique({
        where: { warehouseId_materialId: { warehouseId, materialId } },
      });
      const beforeQty = existing?.quantity || 0;
      const afterQty = beforeQty + order.qualifiedQty;
      await this.prisma.warehouseInventory.upsert({
        where: { warehouseId_materialId: { warehouseId, materialId } },
        create: { warehouseId, locationId, materialId, materialName, quantity: order.qualifiedQty, updatedAt: new Date() },
        update: { quantity: afterQty, updatedAt: new Date() },
      });
      await this.prisma.inventoryRecord.create({
        data: { materialId, warehouse: warehouseId, type: "入库", quantity: order.qualifiedQty, beforeQty, afterQty, reference: order.orderCode, operator },
      });
    }
    await this.eventBus.emit(CrossModuleEvents.MFG_ORDER_COMPLETED, { orderId: id, orderCode: order.orderCode, productName: order.productName, quantity: order.qualifiedQty }, "manufacturing");
    return this.findOneOrder(id);
  }

  // ================================================================
  // Module 3: WIP在制品监控
  // ================================================================

  async getWipOverview(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const orders = await this.prisma.manufacturingOrder.findMany({
      where: { status: { in: ["released", "in_progress", "paused"] }, ...where },
      include: {
        operations: { where: { status: "in_progress" }, orderBy: { opSequence: "asc" } },
        _count: { select: { operations: true } },
      },
      orderBy: { plannedStart: "asc" },
    });
    const wipData = orders.map(o => {
      const activeOp = o.operations[0];
      const stayDuration = activeOp?.actualStart
        ? Math.round((Date.now() - new Date(activeOp.actualStart).getTime()) / 3600000)
        : null;
      return {
        orderId: o.id, orderCode: o.orderCode, productName: o.productName,
        status: o.status, quantity: o.quantity, completedQty: o.completedQty,
        currentOperation: activeOp?.opName || null,
        currentWorkCenter: activeOp?.workCenter || null,
        stayHours: stayDuration,
        plannedStart: o.plannedStart, plannedEnd: o.plannedEnd,
        isOverdue: o.plannedEnd && new Date(o.plannedEnd) < new Date(),
      };
    });
    return wipData;
  }

  async getWipByWorkCenter() {
    const ops = await this.prisma.manufacturingOrderOperation.findMany({
      where: { status: "in_progress" },
      include: { order: { select: { orderCode: true, productName: true } } },
    });
    const byWorkCenter: Record<string, { count: number; totalQty: number; operations: any[] }> = {};
    for (const op of ops) {
      const wc = op.workCenter || "未指定";
      if (!byWorkCenter[wc]) byWorkCenter[wc] = { count: 0, totalQty: 0, operations: [] };
      byWorkCenter[wc].count++;
      byWorkCenter[wc].totalQty += op.inputQty - op.completedQty;
      byWorkCenter[wc].operations.push({
        id: op.id, opName: op.opName, orderCode: op.order.orderCode, productName: op.order.productName,
        remainingQty: op.inputQty - op.completedQty, status: op.status,
      });
    }
    return byWorkCenter;
  }

  async getOverdueWarnings() {
    const today = new Date();
    const orders = await this.prisma.manufacturingOrder.findMany({
      where: {
        status: { in: ["released", "in_progress"] },
        plannedEnd: { lt: today },
      },
      include: { operations: { where: { status: "in_progress" }, take: 1 } },
      orderBy: { plannedEnd: "asc" },
    });
    return orders.map(o => ({
      orderId: o.id, orderCode: o.orderCode, productName: o.productName,
      plannedEnd: o.plannedEnd, status: o.status,
      overdueDays: Math.round((today.getTime() - new Date(o.plannedEnd!).getTime()) / 86400000),
      currentOperation: o.operations[0]?.opName || null,
    }));
  }

  // ================================================================
  // Module 4: 工时与效率
  // ================================================================

  async getEfficiencyByOrder(orderId: string) {
    const order = await this.findOneOrder(orderId);
    const ops = order.operations || [];
    let totalPlanned = 0;
    let totalActual = 0;
    const details = ops.map(op => {
      totalPlanned += op.plannedHours;
      totalActual += op.actualHours;
      const efficiency = op.plannedHours > 0 ? (op.plannedHours / op.actualHours * 100) : 0;
      return {
        opSequence: op.opSequence, opName: op.opName,
        plannedHours: op.plannedHours, actualHours: op.actualHours,
        efficiency: Math.round(efficiency * 100) / 100,
        completedQty: op.completedQty, qualifiedQty: op.qualifiedQty,
      };
    });
    const overallEfficiency = totalPlanned > 0 ? (totalPlanned / totalActual * 100) : 0;
    return {
      orderId: order.id, orderCode: order.orderCode, productName: order.productName,
      totalPlannedHours: totalPlanned, totalActualHours: totalActual,
      overallEfficiency: Math.round(overallEfficiency * 100) / 100,
      details,
    };
  }

  async getEfficiencyByWorker(worker?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (worker) where.worker = worker;
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    const reports = await this.prisma.operationReport.findMany({
      where,
      include: { operation: { select: { opName: true, plannedHours: true, order: { select: { orderCode: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    const byWorker: Record<string, { totalLaborHours: number; totalProcessed: number; reports: any[]; plannedHours: number }> = {};
    for (const r of reports) {
      const w = r.worker || "未知";
      if (!byWorker[w]) byWorker[w] = { totalLaborHours: 0, totalProcessed: 0, reports: [], plannedHours: 0 };
      byWorker[w].totalLaborHours += r.laborHours;
      byWorker[w].totalProcessed += r.processedQty;
      byWorker[w].plannedHours += r.operation?.plannedHours || 0;
    }
    return Object.entries(byWorker).map(([worker, data]) => ({
      worker, totalLaborHours: data.totalLaborHours, totalProcessed: data.totalProcessed,
      plannedHours: data.plannedHours,
      efficiency: data.totalLaborHours > 0 ? Math.round(data.totalProcessed / data.totalLaborHours * 100) / 100 : 0,
    }));
  }

  // ================================================================
  // Module 4: 工艺路线
  // ================================================================

  async createRouting(data: any) {
    const code = await this.codingRule.generate("MFG_ROUTING");
    return this.prisma.productRouting.create({ data: { ...data, routingCode: code } });
  }

  async findAllRoutings(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    return this.prisma.productRouting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { operations: { orderBy: { opSequence: "asc" } } },
    });
  }

  async findOneRouting(id: string) {
    const routing = await this.prisma.productRouting.findUnique({
      where: { id }, include: { operations: { orderBy: { opSequence: "asc" } } },
    });
    if (!routing) throw new NotFoundException("工艺路线不存在");
    return routing;
  }

  async updateRouting(id: string, data: any) {
    await this.findOneRouting(id);
    return this.prisma.productRouting.update({ where: { id }, data });
  }

  async deleteRouting(id: string) {
    await this.findOneRouting(id);
    return this.prisma.productRouting.delete({ where: { id } });
  }

  async addRoutingOperation(routingId: string, data: any) {
    await this.findOneRouting(routingId);
    const maxSeq = await this.prisma.routingOperation.aggregate({
      where: { routingId }, _max: { opSequence: true },
    });
    return this.prisma.routingOperation.create({
      data: { ...data, routingId, opSequence: (maxSeq._max.opSequence || 0) + 1 },
    });
  }

  async updateRoutingOperation(id: string, data: any) {
    const op = await this.prisma.routingOperation.findUnique({ where: { id } });
    if (!op) throw new NotFoundException("工艺工序不存在");
    return this.prisma.routingOperation.update({ where: { id }, data });
  }

  async deleteRoutingOperation(id: string) {
    const op = await this.prisma.routingOperation.findUnique({ where: { id } });
    if (!op) throw new NotFoundException("工艺工序不存在");
    return this.prisma.routingOperation.delete({ where: { id } });
  }

  // ================================================================
  // 统计
  // ================================================================

  async getStats() {
    const [orderTotal, orderInProgress, orderCompleted, planTotal, wipCount, overdueCount] = await Promise.all([
      this.prisma.manufacturingOrder.count(),
      this.prisma.manufacturingOrder.count({ where: { status: { in: ["released", "in_progress"] } } }),
      this.prisma.manufacturingOrder.count({ where: { status: "completed" } }),
      this.prisma.productionPlan.count(),
      this.prisma.manufacturingOrderOperation.count({ where: { status: "in_progress" } }),
      this.prisma.manufacturingOrder.count({
        where: { status: { in: ["released", "in_progress"] }, plannedEnd: { lt: new Date() } },
      }),
    ]);
    return { orderTotal, orderInProgress, orderCompleted, planTotal, wipOperationCount: wipCount, overdueCount };
  }
}
