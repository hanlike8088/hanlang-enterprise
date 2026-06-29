import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { K3CloudService } from '../k3cloud/k3cloud.service';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly k3cloud: K3CloudService,
  ) {}

  async generateReconciliation(purchaseOrderId: string, invoiceAmount: number) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true, receipts: true, supplier: true },
    });
    if (!po) throw new NotFoundException('采购订单不存在');
    const orderAmount = po.totalAmount || 0;
    const receiptAmount = po.receipts?.reduce((sum: number, r: any) => sum + (r.quantity * (po.items[0]?.unitPrice || 0)), 0) || 0;
    const diffAmount = invoiceAmount - orderAmount;
    const code = await this.codingRule.generate('FINANCE_RECON');
    const status = Math.abs(diffAmount) < 0.01 ? '已匹配' : '有差异';
    const diffType = diffAmount !== 0 ? (diffAmount > 0 ? '金额差异' : '金额差异') : null;
    return this.prisma.apReconciliation.create({
      data: {
        reconCode: code,
        purchaseOrderId,
        supplierId: po.supplierId,
        orderAmount,
        receiptAmount,
        invoiceAmount,
        status,
        diffType,
        diffAmount: Math.round(diffAmount * 100) / 100,
      },
    });
  }

  async findAllReconciliations(status?: string, supplierId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    return this.prisma.apReconciliation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { supplierName: true, supplierCode: true } }, payments: true },
    });
  }

  async findOneReconciliation(id: string) {
    const rec = await this.prisma.apReconciliation.findUnique({ where: { id }, include: { supplier: true, payments: true } });
    if (!rec) throw new NotFoundException('对账记录不存在');
    return rec;
  }

  async confirmReconciliation(id: string, confirmedBy: string) {
    await this.findOneReconciliation(id);
    return this.prisma.apReconciliation.update({ where: { id }, data: { status: '已确认', confirmedBy, confirmedAt: new Date() } });
  }

  async getAgingAnalysis() {
    const reconciliations = await this.prisma.apReconciliation.findMany({
      where: { status: { notIn: ['已付款'] } },
      include: { supplier: { select: { supplierName: true, supplierCode: true } }, payments: true },
    });
    const now = new Date();
    const aging = {
      notDue: [] as any[],
      within30: [] as any[],
      within60: [] as any[],
      within90: [] as any[],
      over90: [] as any[],
    };
    for (const rec of reconciliations) {
      const invoiceAmount = rec.invoiceAmount;
      const paidAmount = rec.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
      const balance = invoiceAmount - paidAmount;
      if (balance <= 0) continue;
      const dayDiff = Math.floor((now.getTime() - new Date(rec.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const entry = { ...rec, balance };
      if (dayDiff <= 0) aging.notDue.push(entry);
      else if (dayDiff <= 30) aging.within30.push(entry);
      else if (dayDiff <= 60) aging.within60.push(entry);
      else if (dayDiff <= 90) aging.within90.push(entry);
      else aging.over90.push(entry);
    }
    return aging;
  }

  async createPayment(reconciliationId: string, data: any) {
    await this.findOneReconciliation(reconciliationId);
    const code = await this.codingRule.generate('FINANCE_PAYMENT');
    return this.prisma.apPayment.create({
      data: { ...data, reconciliationId, paymentCode: code, paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date() },
    });
  }

  async getPayments(reconciliationId?: string) {
    const where = reconciliationId ? { reconciliationId } : {};
    return this.prisma.apPayment.findMany({ where, orderBy: { paymentDate: 'desc' }, include: { reconciliation: { select: { reconCode: true, invoiceAmount: true, supplier: { select: { supplierName: true } } } } } });
  }

  async removePayment(id: string) {
    return this.prisma.apPayment.delete({ where: { id } });
  }

  async markAsPaid(reconciliationId: string) {
    const payments = await this.prisma.apPayment.findMany({ where: { reconciliationId } });
    const rec = await this.findOneReconciliation(reconciliationId);
    const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0);
    if (totalPaid >= rec.invoiceAmount) {
      return this.prisma.apReconciliation.update({ where: { id: reconciliationId }, data: { status: '已付款' } });
    }
    return rec;
  }

  async getDifferenceWarnings() {
    return this.prisma.apReconciliation.findMany({ where: { status: '有差异' }, include: { supplier: { select: { supplierName: true, supplierCode: true } }, payments: true } });
  }

  async getStats() {
    const [totalRecs, pendingRecs, diffRecs, totalPayments, totalPaid] = await Promise.all([
      this.prisma.apReconciliation.count(),
      this.prisma.apReconciliation.count({ where: { status: '待对账' } }),
      this.prisma.apReconciliation.count({ where: { status: '有差异' } }),
      this.prisma.apPayment.count(),
      this.prisma.apPayment.aggregate({ _sum: { amount: true } }),
    ]);
    return { totalRecs, pendingRecs, diffRecs, totalPayments, totalPaid: totalPaid._sum.amount || 0 };
  }

  async generatePaymentPlan() {
    const reconciliations = await this.prisma.apReconciliation.findMany({
      where: { status: { in: ['已确认', '已匹配'] } },
      include: {
        supplier: { select: { supplierName: true, supplierCode: true, paymentTerms: true } },
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const now = new Date();
    const plans: any[] = [];
    for (const rec of reconciliations) {
      const totalPaid = rec.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
      const remaining = rec.invoiceAmount - totalPaid;
      if (remaining <= 0) continue;
      const termsDays = parseInt(rec.supplier?.paymentTerms || '0') || 30;
      const dueDate = new Date(rec.createdAt.getTime() + termsDays * 24 * 60 * 60 * 1000);
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      plans.push({
        reconCode: rec.reconCode,
        supplierName: rec.supplier?.supplierName,
        supplierCode: rec.supplier?.supplierCode,
        paymentTerms: rec.supplier?.paymentTerms || '未设置',
        invoiceAmount: rec.invoiceAmount,
        paidAmount: totalPaid,
        remaining: Math.round(remaining * 100) / 100,
        dueDate: dueDate.toISOString(),
        daysLeft,
        status: daysLeft < 0 ? '已逾期' : daysLeft <= 7 ? '即将到期' : '正常',
      });
    }
    plans.sort((a, b) => a.daysLeft - b.daysLeft);
    return plans;
  }

  
  /** 从金蝶读取应付数据 */
  async fetchApFromK3() {
    const logger = new Logger('FinanceK3Sync');
    logger.log('开始从金蝶读取应付账款数据...');
    try {
      const result = await this.k3cloud.executeBillQuery('AP_OtherPayable', 'FBillNo,FDate,FAmountFor,FAmount,FPAYAMOUNTFOR,FREMARK', '', 100);
      const rows = (result?.Result || result || []) as any[];
      if (!Array.isArray(rows) || rows.length === 0) {
        return { data: [], total: 0, message: '金蝶返回应付数据为空' };
      }
      const data = rows.slice(0, 50).map((row: any[]) => ({
        billNo: row[0],
        date: row[1],
        amountFor: row[2],
        amount: row[3],
        paidAmountFor: row[4],
        remark: row[5],
      }));
      logger.log('金蝶应付数据读取完成: ' + data.length + ' 条');
      return { data, total: rows.length };
    } catch (e) {
      logger.error('读取金蝶应付数据失败: ' + (e as any)?.message);
      throw e;
    }
  }

  async generateStatement(supplierId: string, period?: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId }, select: { supplierName: true, supplierCode: true } });
    if (!supplier) throw new NotFoundException('供应商不存在');
    const where: any = { supplierId };
    const reconciliations = await this.prisma.apReconciliation.findMany({
      where,
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
    let totalInvoice = 0;
    let totalPaid = 0;
    const items = reconciliations.map(rec => {
      const paid = rec.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
      const balance = rec.invoiceAmount - paid;
      totalInvoice += rec.invoiceAmount;
      totalPaid += paid;
      return {
        reconCode: rec.reconCode,
        orderAmount: rec.orderAmount,
        receiptAmount: rec.receiptAmount,
        invoiceAmount: rec.invoiceAmount,
        paidAmount: paid,
        balance: Math.round(balance * 100) / 100,
        status: rec.status,
        createdAt: rec.createdAt,
      };
    });
    return {
      supplier,
      period: period || '全部',
      totalInvoice: Math.round(totalInvoice * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalBalance: Math.round((totalInvoice - totalPaid) * 100) / 100,
      items,
      generatedAt: new Date().toISOString(),
    };
  }
}
