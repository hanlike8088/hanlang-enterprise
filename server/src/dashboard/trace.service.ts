import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cross-module traceability: given an entity, find upstream and downstream
 * records linked through foreign keys and known business relationships.
 */
@Injectable()
export class TraceService {
  constructor(private prisma: PrismaService) {}

  async trace(entityType: string, entityId: string) {
    const result: TraceResult = {
      entityType,
      entityId,
      chains: [],
    };

    switch (entityType) {
      case 'crmOrder':
        result.chains.push(await this.traceCrmOrder(entityId));
        break;
      case 'npiProject':
        result.chains.push(await this.traceNpiProject(entityId));
        break;
      case 'purchaseOrder':
        result.chains.push(await this.tracePurchaseOrder(entityId));
        break;
      case 'repairRequest':
        result.chains.push(await this.traceRepairRequest(entityId));
        break;
      case 'ncrReport':
        result.chains.push(await this.traceNcrReport(entityId));
        break;
      default:
        result.error = "Trace not supported for entity type '" + entityType + "'";
    }

    return result;
  }

  private async traceCrmOrder(orderId: string): Promise<TraceChain> {
    const chain: TraceChain = { name: 'CRM Order Trace', nodes: [] };

    const order = await this.prisma.crmOrder.findUnique({
      where: { id: orderId },
      select: { id: true, orderCode: true, customerId: true, status: true, createdAt: true },
    });
    if (!order) return { ...chain, error: '订单不存在' };

    chain.nodes.push({ label: 'CRM Order', id: order.id, detail: { orderCode: order.orderCode, status: order.status } });

    const quotes = await this.prisma.crmQuote.findMany({
      where: { customerId: order.customerId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    for (const q of quotes) {
      chain.nodes.push({ label: 'CRM Quote', id: q.id, detail: { quoteCode: (q as any).quoteCode, status: (q as any).status } });
    }

    const poLinks = await this.prisma.purchaseOrderSaleOrder.findMany({
      where: { saleOrderId: orderId },
    });
    for (const link of poLinks) {
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { id: link.purchaseOrderId },
        select: { id: true, orderCode: true, status: true, supplierId: true },
      });
      if (po) {
        chain.nodes.push({ label: '采购订单', id: po.id, detail: { orderCode: po.orderCode, status: po.status } });
        const receipts = await this.prisma.purchaseOrderReceipt.findMany({
          where: { orderId: po.id },
          take: 5,
        });
        for (const r of receipts) {
          chain.nodes.push({ label: 'PO Receipt', id: r.id, detail: { receiptCode: (r as any).receiptCode, result: (r as any).result } });
        }
      }
    }

    const npiProjects = await this.prisma.npiProject.findMany({
      where: { projectCode: { contains: order.orderCode } },
      take: 5,
      select: { id: true, projectCode: true, projectName: true, status: true },
    });
    for (const p of npiProjects) {
      chain.nodes.push({ label: 'NPI Project', id: p.id, detail: { projectCode: p.projectCode, status: p.status } });
    }

    return chain;
  }

  private async traceNpiProject(projectId: string): Promise<TraceChain> {
    const chain: TraceChain = { name: 'NPI Project Trace', nodes: [] };

    const project = await this.prisma.npiProject.findUnique({
      where: { id: projectId },
      select: { id: true, projectCode: true, projectName: true, status: true, productId: true },
    });
    if (!project) return { ...chain, error: '项目不存在' };

    chain.nodes.push({ label: 'NPI Project', id: project.id, detail: { projectCode: project.projectCode, status: project.status } });

    const trials = await this.prisma.npiTrialRun.findMany({
      where: { projectId },
      take: 5,
      select: { id: true, trialCode: true, status: true },
    });
    for (const t of trials) {
      chain.nodes.push({ label: 'NPI TrialRun', id: t.id, detail: { trialCode: t.trialCode, status: t.status } });
    }

    const issues = await this.prisma.npiIssue.findMany({
      where: { projectId },
      take: 5,
      select: { id: true, issueCode: true, title: true, status: true },
    });
    for (const i of issues) {
      chain.nodes.push({ label: 'NPI Issue', id: i.id, detail: { issueCode: i.issueCode, title: i.title, status: i.status } });
    }

    const approvals = await this.prisma.npiApproval.findMany({
      where: { projectId },
      take: 5,
      select: { id: true, approver: true, status: true, comment: true },
    });
    for (const a of approvals) {
      chain.nodes.push({ label: 'NPI Approval', id: a.id, detail: { approver: a.approver, status: a.status } });
    }

    if (project.productId) {
      const product = await this.prisma.plmProduct.findUnique({
        where: { id: project.productId },
        select: { id: true, productCode: true, productName: true },
      });
      if (product) {
        chain.nodes.push({ label: 'PLM Product', id: product.id, detail: { productCode: product.productCode, productName: product.productName } });
      }
    }

    return chain;
  }

  private async tracePurchaseOrder(poId: string): Promise<TraceChain> {
    const chain: TraceChain = { name: 'Purchase Order Trace', nodes: [] };

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: { id: true, orderCode: true, supplierId: true, status: true },
    });
    if (!po) return { ...chain, error: '采购订单不存在' };

    chain.nodes.push({ label: '采购订单', id: po.id, detail: { orderCode: po.orderCode, status: po.status } });

    if (po.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: po.supplierId },
        select: { id: true, supplierName: true, supplierCode: true },
      });
      if (supplier) {
        chain.nodes.push({ label: '供应商', id: supplier.id, detail: { name: supplier.supplierName, code: supplier.supplierCode } });
      }
    }

    const receipts = await this.prisma.purchaseOrderReceipt.findMany({
      where: { orderId: poId },
      take: 5,
    });
    for (const r of receipts) {
      chain.nodes.push({ label: 'PO Receipt', id: r.id, detail: { receiptCode: (r as any).receiptCode, result: (r as any).result } });
    }

    const soLinks = await this.prisma.purchaseOrderSaleOrder.findMany({
      where: { purchaseOrderId: poId },
    });
    for (const link of soLinks) {
      const so = await this.prisma.crmOrder.findUnique({
        where: { id: link.saleOrderId },
        select: { id: true, orderCode: true, customerId: true, status: true },
      });
      if (so) {
        chain.nodes.push({ label: 'CRM Order', id: so.id, detail: { orderCode: so.orderCode, status: so.status } });
      }
    }

    return chain;
  }

  private async traceRepairRequest(repairId: string): Promise<TraceChain> {
    const chain: TraceChain = { name: 'Repair Request Trace', nodes: [] };

    const repair = await this.prisma.repairRequest.findUnique({
      where: { id: repairId },
      select: { id: true, requestCode: true, equipmentId: true, status: true },
    });
    if (!repair) return { ...chain, error: '维修工单不存在' };

    chain.nodes.push({ label: '维修工单', id: repair.id, detail: { requestCode: repair.requestCode, status: repair.status } });

    if (repair.equipmentId) {
      const equip = await this.prisma.equipment.findUnique({
        where: { id: repair.equipmentId },
        select: { id: true, equipmentCode: true, equipmentName: true, status: true },
      });
      if (equip) {
        chain.nodes.push({ label: '设备', id: equip.id, detail: { code: equip.equipmentCode, name: equip.equipmentName, status: equip.status } });
      }
    }

    return chain;
  }

  private async traceNcrReport(ncrId: string): Promise<TraceChain> {
    const chain: TraceChain = { name: 'NCR Report Trace', nodes: [] };

    const ncr = await this.prisma.ncrReport.findUnique({
      where: { id: ncrId },
      select: { id: true, ncrCode: true, source: true, sourceId: true, status: true, severity: true, productName: true },
    });
    if (!ncr) return { ...chain, error: '不合格报告不存在' };

    chain.nodes.push({ label: 'NCR Report', id: ncr.id, detail: { ncrCode: ncr.ncrCode, status: ncr.status, severity: ncr.severity } });

    if (ncr.sourceId) {
      const incoming = await this.prisma.incomingMaterial.findUnique({
        where: { id: ncr.sourceId },
        select: { id: true, batchNo: true, purchaseOrderId: true, status: true },
      });
      if (incoming) {
        chain.nodes.push({ label: '来料', id: incoming.id, detail: { batchNo: incoming.batchNo, status: incoming.status } });
        if (incoming.purchaseOrderId) {
          const po = await this.prisma.purchaseOrder.findUnique({
            where: { id: incoming.purchaseOrderId },
            select: { supplierId: true },
          });
          if (po?.supplierId) {
            const supplier = await this.prisma.supplier.findUnique({
              where: { id: po.supplierId },
              select: { id: true, supplierName: true, supplierCode: true },
            });
            if (supplier) {
              chain.nodes.push({ label: '供应商', id: supplier.id, detail: { name: supplier.supplierName, code: supplier.supplierCode } });
              const scores = await this.prisma.supplierQcdsScore.findMany({
                where: { supplierId: supplier.id },
                take: 5,
                orderBy: { createdAt: 'desc' },
              });
              for (const s of scores) {
                chain.nodes.push({ label: 'QCDS Score', id: s.id, detail: s as any });
              }
            }
          }
        }
      }
    }

    const capa = await this.prisma.capaReport.findFirst({
      where: { ncrId },
      select: { id: true, capaCode: true, status: true },
    });
    if (capa) {
      chain.nodes.push({ label: 'CAPA Report', id: capa.id, detail: { capaCode: (capa as any).capaCode, status: (capa as any).status } });
    }

    return chain;
  }

  /**
   * Full order chain trace: Sales -> Purchase -> Production -> Shipment -> AR
   */
  async traceOrderFullChain(orderId: string): Promise<TraceResult> {
    const result: TraceResult = { entityType: 'crmOrder', entityId: orderId, chains: [] };
    const order = await this.prisma.crmOrder.findUnique({ where: { id: orderId } });
    if (!order) { result.error = '订单不存在'; return result; }

    const salesChain: TraceChain = { name: 'Sales -> Purchase -> Receipt', nodes: [] };
    salesChain.nodes.push({ label: 'CRM Order (Sales)', id: order.id, detail: { orderCode: order.orderCode, status: order.status, totalAmount: order.totalAmount, createdAt: order.createdAt } });

    const quotes = await this.prisma.crmQuote.findMany({ where: { customerId: order.customerId ?? undefined }, take: 3, orderBy: { createdAt: 'desc' } });
    for (const q of quotes) { salesChain.nodes.push({ label: 'CRM Quote', id: q.id, detail: { quoteCode: (q as any).quoteCode, status: (q as any).status } }); }

    const poLinks = await this.prisma.purchaseOrderSaleOrder.findMany({ where: { saleOrderId: orderId } });
    for (const link of poLinks) {
      const po = await this.prisma.purchaseOrder.findUnique({ where: { id: link.purchaseOrderId } });
      if (po) {
        salesChain.nodes.push({ label: '采购订单', id: po.id, detail: { orderCode: po.orderCode, status: po.status, totalAmount: po.totalAmount, expectedDate: po.expectedDate } });
        if (po.supplierId) {
          const supplier = await this.prisma.supplier.findUnique({ where: { id: po.supplierId }, select: { id: true, supplierName: true, supplierCode: true } });
          if (supplier) { salesChain.nodes.push({ label: '供应商', id: supplier.id, detail: { name: supplier.supplierName, code: supplier.supplierCode } }); }
        }
        const receipts = await this.prisma.purchaseOrderReceipt.findMany({ where: { orderId: po.id } });
        for (const r of receipts) {
          salesChain.nodes.push({ label: 'PO Receipt', id: r.id, detail: { receiptCode: (r as any).receiptCode, result: (r as any).result, quantity: (r as any).quantity } });
        }
        }
      }

    result.chains.push(salesChain);

    const prodChain: TraceChain = { name: 'NPI -> Production', nodes: [] };
    const npiProjects = await this.prisma.npiProject.findMany({ where: { projectCode: { contains: order.orderCode } }, take: 5, select: { id: true, projectCode: true, projectName: true, status: true, productId: true } });
    for (const p of npiProjects) {
      prodChain.nodes.push({ label: 'NPI Project', id: p.id, detail: { projectCode: p.projectCode, projectName: p.projectName, status: p.status } });
      if (p.productId) {
        const product = await this.prisma.plmProduct.findUnique({ where: { id: p.productId }, select: { id: true, productCode: true, productName: true } });
        if (product) { prodChain.nodes.push({ label: 'PLM Product', id: product.id, detail: { productCode: product.productCode, productName: product.productName } }); }
      }
      const trials = await this.prisma.npiTrialRun.findMany({ where: { projectId: p.id }, take: 5 });
      for (const t of trials) { prodChain.nodes.push({ label: 'NPI TrialRun', id: t.id, detail: { trialCode: (t as any).trialCode, status: (t as any).status } }); }
    }
    if (prodChain.nodes.length > 0) { result.chains.push(prodChain); }

    const finChain: TraceChain = { name: 'Financial (AR)', nodes: [] };
    const recons = await this.prisma.crmReconciliation.findMany({ where: { orderId }, select: { id: true, reconciliationCode: true, totalAmount: true, paidAmount: true, balance: true, status: true, paymentDueDate: true } });
    for (const rec of recons) {
      finChain.nodes.push({ label: 'AR Reconciliation', id: rec.id, detail: { reconCode: rec.reconciliationCode, totalAmount: rec.totalAmount, paidAmount: rec.paidAmount, balance: rec.balance, status: rec.status, dueDate: rec.paymentDueDate } });
      const payments = await this.prisma.crmPayment.findMany({ where: { reconciliationId: rec.id } });
      for (const pay of payments) { finChain.nodes.push({ label: 'AR Payment', id: pay.id, detail: { paymentCode: pay.paymentCode, amount: pay.amount, method: pay.paymentMethod, date: pay.paymentDate } }); }
    }
    if (finChain.nodes.length > 0) { result.chains.push(finChain); }

    return result;
  }
}

export interface TraceNode {
  label: string;
  id: string;
  detail: Record<string, any>;
}

export interface TraceChain {
  name: string;
  nodes: TraceNode[];
  error?: string;
}

export interface TraceResult {
  entityType: string;
  entityId: string;
  chains: TraceChain[];
  error?: string;
}