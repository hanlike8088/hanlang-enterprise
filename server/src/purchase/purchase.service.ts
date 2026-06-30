import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { PURCHASE_ORDER_TRANSITIONS } from '../common/services/status-transitions';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';
import { FeishuService } from '../feishu/feishu.service';

@Injectable()
export class PurchaseService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
    private readonly feishu: FeishuService,
  ) {}

  onModuleInit() {
    // Chain 3: CRM Order Confirmed -> auto-create purchase order
    this.eventBus.on(CrossModuleEvents.CRM_ORDER_CONFIRMED,
      async (event) => { await this.handleCrmOrderConfirmed(event.data); });
  }

  private async handleCrmOrderConfirmed(data: any) {
    const code = await this.codingRule.generate('PURCHASE_ORDER');
    const items = (data.items || []).map((it: any, idx: number) => ({
      materialCode: it.materialCode || '',
      materialName: it.materialName || '',
      specification: it.specification || '',
      unit: it.unit || 'pcs',
      quantity: Math.ceil(it.quantity || 1),
      unitPrice: it.unitPrice || 0,
      totalPrice: (it.unitPrice || 0) * Math.ceil(it.quantity || 1),
      sortOrder: idx,
    }));
    const totalAmount = items.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0);
    await this.prisma.purchaseOrder.create({
      data: {
        orderCode: code,
        supplierId: '' as any, // TODO: 根据物料默认供应商自动匹配
        status: '草稿',
        totalAmount,
        orderDate: new Date(),
        expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        remark: `自动生成 - 来源销售订单 ${data.orderCode}`,
        items: { create: items },
      },
    });
  }

  async create(data: any) {
    const code = await this.codingRule.generate('PURCHASE_ORDER');
    const items = data.items?.map((it: any) => ({ ...it, totalPrice: (it.quantity || 0) * (it.unitPrice || 0) })) || [];
    const totalAmount = items.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0);
    return this.prisma.purchaseOrder.create({
      data: {
        orderCode: code,
        supplierId: data.supplierId,
        status: '草稿',
        totalAmount,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        remark: data.remark,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async findAll(status?: string, supplierId?: string, keyword?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (keyword) where.OR = [
      { orderCode: { contains: keyword } },
      { items: { some: { materialName: { contains: keyword } } } },
    ];
    return this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { supplierName: true, supplierCode: true } }, items: true, receipts: true, saleOrderLinks: true },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
        receipts: { orderBy: { createdAt: 'desc' } },
        saleOrderLinks: true,
      },
    });
    if (!po) throw new NotFoundException('采购订单不存在');
    return po;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (data.items) {
      await this.prisma.purchaseOrderItem.deleteMany({ where: { orderId: id } });
      data.items = { create: data.items.map((it: any) => ({ ...it, totalPrice: (it.quantity || 0) * (it.unitPrice || 0) })) };
    }
    const totalAmount = data.items?.create?.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { ...data, totalAmount: totalAmount ?? undefined, items: data.items },
      include: { items: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }

  async advanceStatus(id: string, nextStatus: string, operator?: string) {
    const po = await this.findOne(id);
    const oldStatus = po.status;
    this.sm.validateTransition(PURCHASE_ORDER_TRANSITIONS, po.status, nextStatus);
    const updated = await this.prisma.purchaseOrder.update({ where: { id }, data: { status: nextStatus } });

    // 异步飞书通知，不阻塞状态变更
    this.feishu.sendPurchaseStatusCard({
      orderCode: po.orderCode,
      supplierName: po.supplier?.supplierName || '未知供应商',
      oldStatus,
      newStatus: nextStatus,
      totalAmount: po.totalAmount || 0,
      operator,
      items: po.items?.map(it => ({
        materialName: it.materialName,
        quantity: it.quantity,
        unit: it.unit,
      })),
    }).catch(() => {});

    return updated;
  }

  async getDeliveryWarnings() {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { status: { notIn: ['已入库', '已关闭'] } },
      include: { supplier: { select: { supplierName: true, supplierCode: true } }, items: true },
    });
    return orders.map(po => {
      if (!po.expectedDate) return { ...po, warning: 'none' as const };
      const expected = new Date(po.expectedDate);
      if (expected < now) return { ...po, warning: 'red' as const };
      if (expected <= threeDaysLater) return { ...po, warning: 'yellow' as const };
      return { ...po, warning: 'none' as const };
    });
  }

  async createReceipt(orderId: string, data: any) {
    await this.findOne(orderId);
    const code = await this.codingRule.generate('PURCHASE_RECEIPT');
    const receipt = await this.prisma.purchaseOrderReceipt.create({
      data: { ...data, orderId, receiptCode: code, acceptedAt: data.acceptedAt ? new Date(data.acceptedAt) : new Date() },
    });

    // Chain 4: Purchase Receipt -> Quality IQC incoming inspection
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true, supplier: { select: { supplierName: true, supplierCode: true } } },
    });
    await this.eventBus.emit(CrossModuleEvents.PURCHASE_RECEIPT_COMPLETED, {
      receiptId: receipt.id,
      receiptCode: receipt.receiptCode,
      orderId,
      orderCode: order?.orderCode || '',
      supplierId: order?.supplierId || null,
      supplierName: order?.supplier?.supplierName || '',
      items: order?.items || [],
      acceptedAt: receipt.acceptedAt,
    }, 'purchase');

    return receipt;
  }

  async getReceipts(orderId: string) {
    return this.prisma.purchaseOrderReceipt.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } });
  }

  async linkSaleOrder(purchaseOrderId: string, saleOrderId: string) {
    await this.findOne(purchaseOrderId);
    try {
      return await this.prisma.purchaseOrderSaleOrder.create({
        data: { purchaseOrderId, saleOrderId },
      });
    } catch { throw new BadRequestException('已关联该销售订单'); }
  }

  async unlinkSaleOrder(id: string) {
    return this.prisma.purchaseOrderSaleOrder.delete({ where: { id } });
  }

  async getLinkedSaleOrders(purchaseOrderId: string) {
    return this.prisma.purchaseOrderSaleOrder.findMany({ where: { purchaseOrderId } });
  }

  async getStats() {
    const [total, byStatus] = await Promise.all([
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrder.groupBy({ by: ['status'], _count: true }),
    ]);
    const warningCount = (await this.getDeliveryWarnings()).filter(po => po.warning !== 'none').length;
    return { total, byStatus, warningCount };
  }
}
