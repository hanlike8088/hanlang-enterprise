import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { CRM_ORDER_TRANSITIONS } from '../common/services/status-transitions';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';
import { K3CloudService } from '../k3cloud/k3cloud.service';

@Injectable()
export class CrmService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
    private readonly k3cloud: K3CloudService,
  ) {}

  onModuleInit() {
    // Chain 2: NPI Project Review Passed -> auto-create CRM quote
    this.eventBus.on(CrossModuleEvents.NPI_PROJECT_REVIEW_PASSED,
      async (event) => { await this.handleNpiReviewPassed(event.data); });
  }

  private async handleNpiReviewPassed(data: any) {
    const code = await this.codingRule.generate('CRM_QUOTE');
    await this.prisma.crmQuote.create({
      data: {
        quoteCode: code,
        productId: data.productId || '',
        customerName: data.customerName || 'NPI项目客户',
        status: '草稿',
        notes: `自动生成 - 来源NPI项目评审通过 ${data.projectCode}`,
        items: {
          create: (data.materials || []).map((m: any, i: number) => ({
            materialCode: m.materialCode || '',
            materialName: m.materialName || '',
            specification: m.specification || '',
            unit: m.unit || 'pcs',
            quantity: m.quantity || 1,
            unitPrice: m.unitPrice || 0,
            totalPrice: (m.unitPrice || 0) * (m.quantity || 1),
            sortOrder: i,
          })),
        },
      },
    });
  }

  // ========== Customers ==========

  /** 从金蝶同步客户数据 */
  async syncCustomersFromK3() {
    const logger = new Logger('CrmSync');
    logger.log('开始从金蝶同步客户...');
    const result = await this.k3cloud.getCustomers();
    const rows = (result?.Result || result || []) as any[];
    if (!Array.isArray(rows) || rows.length === 0) {
      logger.warn('金蝶返回客户数据为空');
      return { synced: 0, skipped: 0, total: 0, message: '金蝶返回客户数据为空' };
    }
    const existing = await this.prisma.crmCustomer.findMany({ select: { customerCode: true } });
    const existingCodes = new Set(existing.map(c => c.customerCode));
    let synced = 0; let skipped = 0;
    for (const row of rows) {
      const code = row[0] as string;
      const name = row[1] as string;
      if (!code || !name) continue;
      if (existingCodes.has(code)) { skipped++; continue; }
      try {
        await this.prisma.crmCustomer.create({
          data: { customerCode: code, customerName: name, category: 'potential' },
        });
        synced++;
      } catch (e) {
        logger.warn('创建客户失败: ' + code + ' - ' + (e as any)?.message);
      }
    }
    logger.log('客户同步完成: 新增 ' + synced + ', 跳过 ' + skipped);
    return { synced, skipped, total: rows.length };
  }

  async getCustomers(keyword?: string, category?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (keyword) where.OR = [
      { customerName: { contains: keyword } },
      { customerCode: { contains: keyword } },
    ];
    return this.prisma.crmCustomer.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getCustomer(id: string) {
    const c = await this.prisma.crmCustomer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('客户不存在');
    return c;
  }

  async createCustomer(dto: any) {
    const code = await this.codingRule.generate('CRM_CUSTOMER');
    return this.prisma.crmCustomer.create({ data: { ...dto, customerCode: code } });
  }

  async updateCustomer(id: string, dto: any) {
    await this.getCustomer(id);
    return this.prisma.crmCustomer.update({ where: { id }, data: dto });
  }

  async deleteCustomer(id: string) {
    return this.prisma.crmCustomer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ========== Contact Records ==========

  async getContactRecords(customerId: string) {
    return this.prisma.crmContactRecord.findMany({
      where: { customerId },
      orderBy: { contactDate: 'desc' },
    });
  }

  async createContactRecord(dto: any) {
    return this.prisma.crmContactRecord.create({
      data: { ...dto, contactDate: dto.contactDate ? new Date(dto.contactDate) : new Date() },
    });
  }

  async updateContactRecord(id: string, dto: any) {
    const c = await this.prisma.crmContactRecord.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('联系记录不存在');
    return this.prisma.crmContactRecord.update({ where: { id }, data: dto });
  }

  async deleteContactRecord(id: string) {
    return this.prisma.crmContactRecord.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ========== Quotes ==========

  async getQuotes(keyword?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where.OR = [
      { quoteCode: { contains: keyword } },
      { customerName: { contains: keyword } },
    ];
    return this.prisma.crmQuote.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true } });
  }

  async getQuote(id: string) {
    const q = await this.prisma.crmQuote.findUnique({ where: { id }, include: { items: true } });
    if (!q) throw new NotFoundException('报价单不存在');
    return q;
  }

  async createQuote(dto: any) {
    const code = await this.codingRule.generate('CRM_QUOTE');
    const items = (dto.items || []).map((it: any, i: number) => ({
      ...it,
      totalPrice: (it.quantity || 0) * (it.unitPrice || 0),
      sortOrder: i,
    }));
    const materialCost = items.reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
    const finalPrice = materialCost + (dto.laborCost || 0) + (dto.manufacturingFee || 0);
    return this.prisma.crmQuote.create({
      data: {
        quoteCode: code,
        productId: dto.productId,
        customerId: dto.customerId || null,
        customerName: dto.customerName || null,
        materialCost,
        laborCost: dto.laborCost || 0,
        manufacturingFee: dto.manufacturingFee || 0,
        referencePrice: 0,
        profitRate: dto.profitRate || 15,
        finalPrice,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async updateQuote(id: string, dto: any) {
    await this.getQuote(id);
    if (dto.items) {
      await this.prisma.crmQuoteItem.deleteMany({ where: { quoteId: id } });
      dto.items = { create: dto.items.map((it: any, i: number) => ({
        ...it, totalPrice: (it.quantity || 0) * (it.unitPrice || 0), sortOrder: i,
      })) };
    }
    return this.prisma.crmQuote.update({ where: { id }, data: dto, include: { items: true } });
  }

  async deleteQuote(id: string) {
    return this.prisma.crmQuote.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async transitionQuote(id: string, status: string) {
    await this.getQuote(id);
    return this.prisma.crmQuote.update({ where: { id }, data: { status } });
  }

  async getProductBomForQuote(productId: string) {
    const boms = await this.prisma.plmBom.findMany({ where: { productId } });
    const product = await this.prisma.plmProduct.findUnique({ where: { id: productId } });
    return { product, boms };
  }

  // ========== Orders ==========

  async getOrders(keyword?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where.OR = [
      { orderCode: { contains: keyword } },
      { productName: { contains: keyword } },
      { customerName: { contains: keyword } },
    ];
    return this.prisma.crmOrder.findMany({
      where, orderBy: { createdAt: 'desc' }, include: { items: true, customer: true },
    });
  }

  async getOrder(id: string) {
    const o = await this.prisma.crmOrder.findUnique({ where: { id }, include: { items: true, customer: true } });
    if (!o) throw new NotFoundException('订单不存在');
    return o;
  }

  async createOrder(dto: any) {
    const code = await this.codingRule.generate('CRM_ORDER');
    const items = (dto.items || []).map((it: any, i: number) => ({
      ...it, totalPrice: (it.quantity || 0) * (it.unitPrice || 0), sortOrder: i,
    }));
    const totalAmount = items.reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
    return this.prisma.crmOrder.create({
      data: {
        orderCode: code,
        productId: dto.productId,
        productName: dto.productName,
        quoteId: dto.quoteId || null,
        customerId: dto.customerId || null,
        customerName: dto.customerName || null,
        totalAmount,
        quantity: dto.quantity || 1,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        notes: dto.notes,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async convertQuoteToOrder(dto: any) {
    const quote = await this.prisma.crmQuote.findUnique({ where: { id: dto.quoteId }, include: { items: true } });
    if (!quote) throw new NotFoundException('报价单不存在');
    let productName = '';
    if (quote.productId) {
      const product = await this.prisma.plmProduct.findUnique({ where: { id: quote.productId } });
      productName = product?.productName || '';
    }
    const code = await this.codingRule.generate('CRM_ORDER');
    const items = (quote.items || []).map((it: any, i: number) => ({
      materialCode: it.materialCode,
      materialName: it.materialName,
      specification: it.specification || '',
      unit: it.unit,
      quantity: dto.quantity || it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: (dto.quantity || it.quantity) * it.unitPrice,
      sortOrder: i,
    }));
    const totalAmount = items.reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
    const [order] = await this.prisma.$transaction([
      this.prisma.crmOrder.create({
        data: {
          orderCode: code,
          quoteId: dto.quoteId,
          productId: quote.productId,
          productName,
          customerId: dto.customerId || quote.customerId || null,
          customerName: quote.customerName || null,
          totalAmount,
          quantity: dto.quantity || 1,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          notes: dto.notes || null,
          items: { create: items },
        },
      }),
      this.prisma.crmQuote.update({
        where: { id: dto.quoteId },
        data: { status: 'converted' },
      }),
    ]);
    return order;
  }

  async updateOrder(id: string, dto: any) {
    await this.getOrder(id);
    if (dto.items) {
      await this.prisma.crmOrderItem.deleteMany({ where: { orderId: id } });
      dto.items = { create: dto.items.map((it: any, i: number) => ({
        ...it, totalPrice: (it.quantity || 0) * (it.unitPrice || 0), sortOrder: i,
      })) };
    }
    return this.prisma.crmOrder.update({ where: { id }, data: dto, include: { items: true } });
  }

  async deleteOrder(id: string) {
    return this.prisma.crmOrder.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async transitionOrder(id: string, status: string) {
    const order = await this.getOrder(id);
    this.sm.validateTransition(CRM_ORDER_TRANSITIONS, order.status, status);
    const updated = await this.prisma.crmOrder.update({
      where: { id }, data: { status }, include: { items: true },
    });

    // Chain 1 & 3: CRM Order Confirmed -> NPI tech review + Purchase order
    if (status === '已确认') {
      await this.eventBus.emit(CrossModuleEvents.CRM_ORDER_CONFIRMED, {
        orderId: order.id,
        orderCode: order.orderCode,
        productId: order.productId,
        productName: order.productName,
        customerId: order.customerId,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        quantity: order.quantity,
        items: order.items || [],
        notes: order.notes,
      }, 'crm');
    }
    return updated;
  }

  async getOrdersForCustomer(customerId: string) {
    return this.prisma.crmOrder.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  }

  // ========== Complaints ==========

  async getComplaints(keyword?: string, complaintType?: string, severity?: string, status?: string) {
    const where: any = {};
    if (complaintType) where.complaintType = complaintType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (keyword) where.OR = [{ title: { contains: keyword } }, { description: { contains: keyword } }];
    return this.prisma.crmComplaint.findMany({ where, orderBy: { createdAt: 'desc' }, include: { customer: true } });
  }

  async getComplaint(id: string) {
    const c = await this.prisma.crmComplaint.findUnique({ where: { id }, include: { customer: true, order: true } });
    if (!c) throw new NotFoundException('投诉单不存在');
    return c;
  }

  async createComplaint(dto: any) {
    const code = await this.codingRule.generate('CRM_COMPLAINT');
    return this.prisma.crmComplaint.create({ data: { ...dto, complaintCode: code } });
  }

  async updateComplaint(id: string, dto: any) {
    await this.getComplaint(id);
    return this.prisma.crmComplaint.update({ where: { id }, data: dto });
  }

  async deleteComplaint(id: string) {
    return this.prisma.crmComplaint.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async transitionComplaint(id: string, status: string) {
    await this.getComplaint(id);
    return this.prisma.crmComplaint.update({ where: { id }, data: { status } });
  }

  async getComplaintsForCustomer(customerId: string) {
    return this.prisma.crmComplaint.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  }

  // ========== Reconciliations ==========

  async getReconciliations(keyword?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where.OR = [{ reconciliationCode: { contains: keyword } }];
    return this.prisma.crmReconciliation.findMany({ where, orderBy: { createdAt: 'desc' }, include: { customer: true } });
  }

  async getReconciliation(id: string) {
    const r = await this.prisma.crmReconciliation.findUnique({ where: { id }, include: { customer: true, payments: true } });
    if (!r) throw new NotFoundException('对账单不存在');
    return r;
  }

  async createReconciliation(dto: any) {
    const code = await this.codingRule.generate('CRM_RECONCILIATION');
    return this.prisma.crmReconciliation.create({ data: { ...dto, reconciliationCode: code } });
  }

  async updateReconciliation(id: string, dto: any) {
    await this.getReconciliation(id);
    return this.prisma.crmReconciliation.update({ where: { id }, data: dto });
  }

  async deleteReconciliation(id: string) {
    return this.prisma.crmReconciliation.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async transitionReconciliation(id: string, status: string) {
    await this.getReconciliation(id);
    return this.prisma.crmReconciliation.update({ where: { id }, data: { status } });
  }

  async getReconciliationsForCustomer(customerId: string) {
    return this.prisma.crmReconciliation.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  }

  // ========== Payments ==========

  async getPayments(keyword?: string, customerId?: string, reconciliationId?: string) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (reconciliationId) where.reconciliationId = reconciliationId;
    if (keyword) where.OR = [{ paymentCode: { contains: keyword } }, { referenceNo: { contains: keyword } }];
    return this.prisma.crmPayment.findMany({ where, orderBy: { paymentDate: 'desc' }, include: { customer: true } });
  }

  async getPayment(id: string) {
    const p = await this.prisma.crmPayment.findUnique({ where: { id }, include: { customer: true } });
    if (!p) throw new NotFoundException('收款单不存在');
    return p;
  }

  async createPayment(dto: any) {
    const code = await this.codingRule.generate('CRM_PAYMENT');
    return this.prisma.crmPayment.create({
      data: { ...dto, paymentCode: code, paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date() },
    });
  }

  async updatePayment(id: string, dto: any) {
    await this.getPayment(id);
    return this.prisma.crmPayment.update({ where: { id }, data: dto });
  }

  async deletePayment(id: string) {
    return this.prisma.crmPayment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async transitionPayment(id: string, status: string) {
    await this.getPayment(id);
    return this.prisma.crmPayment.update({ where: { id }, data: { status } });
  }

  async getPaymentsForCustomer(customerId: string) {
    return this.prisma.crmPayment.findMany({ where: { customerId }, orderBy: { paymentDate: 'desc' } });
  }
}