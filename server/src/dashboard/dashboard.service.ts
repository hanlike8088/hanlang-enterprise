import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      // Admin
      orgCount, positionCount, employeeCount, roleCount,
      // NPI
      projectCount, trialRunCount, issueCount, openIssueCount, pendingApprovalCount,
      projectStatusStats, recentProjects,
      // PLM
      productCount, bomCount, docCount, drawingCount, drawingVersionCount,
      // CRM
      customerCount, contactCount, quoteCount, orderCount, complaintCount,
      orderOpenCount, reconciliationCount, paymentCount,
      // Supplier
      supplierCount, supplierQcdsCount,
      // Purchase
      poCount, poReceiptCount,
      // Warehouse
      warehouseCount, locationCount, inventoryCount,
      // Finance
      apRecCount, apPaymentCount,
      // Equipment
      equipCount, tpmPlanCount, tpmRecordCount, maintPlanCount, repairCount, sparePartCount,
      // Quality
      inspStandardCount, incomingMatCount, inspRecordCount, ncrCount, capaCount, gaugeCount,
      // ERP
      materialCount, workOrderCount,
      // Sampling
      swCount,
      // Recent activity
      recentNpiProjects, recentCrmOrders, recentPurchaseOrders, recentRepairs,
    ] = await Promise.all([
      this.prisma.adminOrganization.count(),
      this.prisma.adminPosition.count(),
      this.prisma.adminEmployee.count(),
      this.prisma.adminRole.count(),
      this.prisma.npiProject.count(),
      this.prisma.npiTrialRun.count(),
      this.prisma.npiIssue.count(),
      this.prisma.npiIssue.count({ where: { status: { in: ['pending', 'in_review'] } } }),
      this.prisma.npiApproval.count({ where: { status: 'pending' } }),
      this.prisma.npiProject.groupBy({ by: ['status'], _count: true }),
      this.prisma.npiProject.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, projectCode: true, projectName: true, status: true, updatedAt: true } }),
      this.prisma.plmProduct.count(),
      this.prisma.plmBom.count(),
      this.prisma.plmDocument.count(),
      this.prisma.drawing.count(),
      this.prisma.drawingVersion.count(),
      this.prisma.crmCustomer.count(),
      this.prisma.crmContactRecord.count(),
      this.prisma.crmQuote.count(),
      this.prisma.crmOrder.count(),
      this.prisma.crmComplaint.count(),
      this.prisma.crmOrder.count({ where: { status: { in: ['pending_confirm', 'confirmed', 'in_production'] } } }),
      this.prisma.crmReconciliation.count(),
      this.prisma.crmPayment.count(),
      this.prisma.supplier.count(),
      this.prisma.supplierQcdsScore.count(),
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrderReceipt.count(),
      this.prisma.warehouse.count(),
      this.prisma.warehouseLocation.count(),
      this.prisma.warehouseInventory.count(),
      this.prisma.apReconciliation.count(),
      this.prisma.apPayment.count(),
      this.prisma.equipment.count(),
      this.prisma.tpmCheckPlan.count(),
      this.prisma.tpmCheckRecord.count(),
      this.prisma.maintenancePlan.count(),
      this.prisma.repairRequest.count(),
      this.prisma.sparePart.count(),
      this.prisma.inspectionStandard.count(),
      this.prisma.incomingMaterial.count(),
      this.prisma.inspectionRecord.count(),
      this.prisma.ncrReport.count(),
      this.prisma.capaReport.count(),
      this.prisma.gaugeInstrument.count(),
      this.prisma.erpMaterial.count(),
      this.prisma.erpWorkOrder.count(),
      this.prisma.samplingWorkOrder.count(),
      this.prisma.npiProject.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, projectCode: true, projectName: true, status: true, updatedAt: true } }),
      this.prisma.crmOrder.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, orderCode: true, customerId: true, status: true, totalAmount: true, updatedAt: true } }),
      this.prisma.purchaseOrder.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, orderCode: true, supplierId: true, status: true, totalAmount: true, updatedAt: true } }),
      this.prisma.repairRequest.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, requestCode: true, equipmentId: true, status: true, updatedAt: true } }),
    ]);

    return {
      admin: { orgCount, positionCount, employeeCount, roleCount },
      npi: {
        projectCount, trialRunCount, issueCount, openIssueCount, pendingApprovalCount,
        projectStatusDistribution: projectStatusStats,
        recentProjects: recentNpiProjects,
      },
      plm: { productCount, bomCount, docCount, drawingCount, drawingVersionCount },
      crm: {
        customerCount, contactCount, quoteCount, orderCount, complaintCount,
        orderOpenCount, reconciliationCount, paymentCount,
        recentOrders: recentCrmOrders,
      },
      supplier: { supplierCount, supplierQcdsCount },
      purchase: { poCount, poReceiptCount, recentOrders: recentPurchaseOrders },
      warehouse: { warehouseCount, locationCount, inventoryCount },
      finance: { apRecCount, apPaymentCount },
      equipment: { equipCount, tpmPlanCount, tpmRecordCount, maintPlanCount, repairCount, sparePartCount, recentRepairs },
      quality: { inspStandardCount, incomingMatCount, inspRecordCount, ncrCount, capaCount, gaugeCount },
      erp: { materialCount, workOrderCount },
      sampling: { swCount },
      summary: {
        totalModules: 14,
        totalProjects: projectCount,
        openIssues: openIssueCount,
        pendingApprovals: pendingApprovalCount,
        activeOrders: orderOpenCount,
        activeRepairs: repairCount,
      },
    };
  }

  async getModuleDetail(module: string) {
    switch (module) {
      case 'npi':
        return {
          projects: await this.prisma.npiProject.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, select: { id: true, projectCode: true, projectName: true, status: true, updatedAt: true } }),
          trialRuns: await this.prisma.npiTrialRun.findMany({ take: 10, orderBy: { updatedAt: 'desc' } }),
          issues: await this.prisma.npiIssue.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, where: { status: { in: ['pending', 'in_review'] } } }),
          approvals: await this.prisma.npiApproval.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, where: { status: 'pending' } }),
        };
      case 'crm':
        return {
          customers: await this.prisma.crmCustomer.findMany({ take: 10, orderBy: { updatedAt: 'desc' } }),
          orders: await this.prisma.crmOrder.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, select: { id: true, orderCode: true, customerId: true, status: true, totalAmount: true, updatedAt: true } }),
          quotes: await this.prisma.crmQuote.findMany({ take: 10, orderBy: { updatedAt: 'desc' } }),
          complaints: await this.prisma.crmComplaint.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, where: { status: { not: 'closed' } } }),
        };
      case 'quality':
        return {
          ncrList: await this.prisma.ncrReport.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, where: { status: { not: 'closed' } } }),
          capaList: await this.prisma.capaReport.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, where: { status: { not: 'closed' } } }),
          inspectionRecords: await this.prisma.inspectionRecord.findMany({ take: 10, orderBy: { inspectedAt: 'desc' } }),
        };
      case 'equipment':
        return {
          equipment: await this.prisma.equipment.findMany({ take: 10, orderBy: { updatedAt: 'desc' } }),
          repairs: await this.prisma.repairRequest.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, where: { status: { not: 'completed' } }, select: { id: true, requestCode: true, equipmentId: true, status: true, updatedAt: true } }),
          tpmChecks: await this.prisma.tpmCheckRecord.findMany({ take: 10, orderBy: { checkedAt: 'desc' } }),
        };
      case 'purchase':
        return {
          orders: await this.prisma.purchaseOrder.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, select: { id: true, orderCode: true, supplierId: true, status: true, totalAmount: true, updatedAt: true } }),
          receipts: await this.prisma.purchaseOrderReceipt.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
        };
      default:
        return { message: "Module '" + module + "' detail not implemented" };
    }
  }

  async getEventChain() {
    return {
      chains: [
        { id: 1, source: 'CRM', target: 'NPI', trigger: 'crm:order:confirmed', description: '销售订单已确认 -> 自动创建NPI项目+技术评审' },
        { id: 2, source: 'NPI', target: 'CRM', trigger: 'npi:project:review-passed', description: '项目评审通过 -> 自动创建报价单（含物料清单）' },
        { id: 3, source: 'CRM', target: 'Purchase', trigger: 'crm:order:confirmed', description: '销售订单已确认 -> 自动创建采购订单' },
        { id: 4, source: 'Purchase', target: 'Quality', trigger: 'purchase:receipt:completed', description: '采购收货 -> 自动创建来料检验记录' },
        { id: 5, source: 'Quality', target: 'Supplier', trigger: 'quality:ncr:created', description: 'NCR created -> QCDS score warning' },
        { id: 6, source: 'Equipment', target: 'PLM', trigger: 'equipment:anomaly:detected', description: 'TPM anomaly -> auto-create technical change document' },
      ],
    };
  }

  /**
   * Financial dashboard: AR / AP / Cost summary.
   */
  async getFinanceDashboard() {
    const now = new Date();

    // === AR (Accounts Receivable) ===
    const arBalanceResult = await this.prisma.crmReconciliation.aggregate({
      _sum: { balance: true },
      where: { status: { not: 'completed' } },
    });
    const arTotal = arBalanceResult._sum.balance ?? 0;

    const arCollectedResult = await this.prisma.crmPayment.aggregate({
      _sum: { amount: true },
      where: { status: { not: 'voided' } },
    });
    const arCollected = arCollectedResult._sum.amount ?? 0;

    const overdueArResult = await this.prisma.crmReconciliation.aggregate({
      _sum: { balance: true },
      where: { balance: { gt: 0 }, paymentDueDate: { lt: now }, status: { not: 'completed' } },
    });
    const arOverdue = overdueArResult._sum.balance ?? 0;

    const arOverdueCount = await this.prisma.crmReconciliation.count({
      where: { balance: { gt: 0 }, paymentDueDate: { lt: now }, status: { not: 'completed' } },
    });

    const arStatusGroups = await this.prisma.crmReconciliation.groupBy({
      by: ['status'], _count: true, _sum: { balance: true },
    });

    // === AP (Accounts Payable) ===
    const apBalanceResult = await this.prisma.apReconciliation.aggregate({
      _sum: { invoiceAmount: true },
    });
    const apTotal = apBalanceResult._sum.invoiceAmount ?? 0;

    const apPaidResult = await this.prisma.apPayment.aggregate({ _sum: { amount: true } });
    const apPaid = apPaidResult._sum.amount ?? 0;

    const apDiffCount = await this.prisma.apReconciliation.count({ where: { diffAmount: { not: 0 } } });
    const apDiffResult = await this.prisma.apReconciliation.aggregate({
      _sum: { diffAmount: true }, where: { diffAmount: { not: 0 } },
    });
    const apDiffTotal = apDiffResult._sum.diffAmount ?? 0;

    const apStatusGroups = await this.prisma.apReconciliation.groupBy({
      by: ['status'], _count: true, _sum: { invoiceAmount: true },
    });

    // === Revenue & Cost ===
    const revenueResult = await this.prisma.crmOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ['completed', 'shipped', 'delivered'] } },
    });
    const revenue = revenueResult._sum.totalAmount ?? 0;

    const totalOrderAmountResult = await this.prisma.crmOrder.aggregate({
      _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } },
    });
    const totalOrderAmount = totalOrderAmountResult._sum.totalAmount ?? 0;

    const purchaseCostResult = await this.prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } },
    });
    const purchaseCost = purchaseCostResult._sum.totalAmount ?? 0;

    const grossProfit = revenue - purchaseCost;
    const profitMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';

    const apPaymentMethods = await this.prisma.apPayment.groupBy({
      by: ['paymentMethod'], _count: true, _sum: { amount: true },
    });

    const recentApPayments = await this.prisma.apPayment.findMany({
      take: 5, orderBy: { paymentDate: 'desc' },
      select: { id: true, paymentCode: true, amount: true, paymentDate: true, paymentMethod: true,
        supplier: { select: { id: true, supplierName: true } } },
    });

    const recentArPayments = await this.prisma.crmPayment.findMany({
      take: 5, orderBy: { paymentDate: 'desc' },
      select: { id: true, paymentCode: true, amount: true, paymentDate: true, paymentMethod: true,
        customer: { select: { id: true, customerName: true } } },
    });

    return {
      ar: {
        total: arTotal, collected: arCollected, overdue: arOverdue,
        overdueCount: arOverdueCount, outstanding: arTotal,
        statusBreakdown: arStatusGroups.map(g => ({ status: g.status, count: g._count, balance: g._sum.balance ?? 0 })),
        recentPayments: recentArPayments,
      },
      ap: {
        total: apTotal, paid: apPaid, outstanding: apTotal - apPaid,
        diffCount: apDiffCount, diffTotal: apDiffTotal,
        statusBreakdown: apStatusGroups.map(g => ({ status: g.status, count: g._count, amount: g._sum.invoiceAmount ?? 0 })),
        paymentMethods: apPaymentMethods.map(g => ({ method: g.paymentMethod, count: g._count, amount: g._sum.amount ?? 0 })),
        recentPayments: recentApPayments,
      },
      revenue: { completed: revenue, totalPipeline: totalOrderAmount, purchaseCost, grossProfit, profitMargin: profitMargin + '%' },
    };
  }

  /**
   * Cross-module supply chain overview.
   */
  async getSupplyChainOverview() {
    const [crmOrderStatus, poStatus, crmCount] = await Promise.all([
      this.prisma.crmOrder.groupBy({ by: ['status'], _count: true, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.groupBy({ by: ['status'], _count: true, _sum: { totalAmount: true } }),
      this.prisma.crmOrder.count(),
    ]);

    const linkedOrderIds = await this.prisma.purchaseOrderSaleOrder.findMany({
      select: { saleOrderId: true }, distinct: ['saleOrderId'],
    });
    const linkedOrderCount = linkedOrderIds.length;

    const poIds = (await this.prisma.purchaseOrder.findMany({ select: { id: true } })).map(p => p.id);
    const poWithReceiptIds = (await this.prisma.purchaseOrderReceipt.findMany({
      where: { orderId: { in: poIds } }, select: { orderId: true }, distinct: ['orderId'],
    })).map(r => r.orderId);
    const posWithoutReceipt = poIds.filter(id => !poWithReceiptIds.includes(id)).length;

    return {
      sales: {
        totalOrders: crmCount, linkedToPurchase: linkedOrderCount, unlinked: crmCount - linkedOrderCount,
        statusBreakdown: crmOrderStatus.map(g => ({ status: g.status, count: g._count, amount: g._sum.totalAmount ?? 0 })),
      },
      purchase: {
        totalOrders: await this.prisma.purchaseOrder.count(),
        pendingDelivery: posWithoutReceipt, received: poWithReceiptIds.length,
        statusBreakdown: poStatus.map(g => ({ status: g.status, count: g._count, amount: g._sum.totalAmount ?? 0 })),
      },
      production: {
        totalWorkOrders: await this.prisma.erpWorkOrder.count(),
        pending: await this.prisma.erpWorkOrder.count({ where: { status: 'pending' } }),
        inProgress: await this.prisma.erpWorkOrder.count({ where: { status: 'in_progress' } }),
        completed: await this.prisma.erpWorkOrder.count({ where: { status: 'completed' } }),
      },
     chainSummary: {
       totalLinkedOrders: linkedOrderCount,
       chainGaps: { noPurchaseOrder: crmCount - linkedOrderCount, noReceipt: posWithoutReceipt },
     },
   };
 }

  /**
   * P1-5: Quality KPI Dashboard — 质量目标 + 客诉趋势 + 过程KPI
   * For ISO 9.3 management review.
   */
  async getQualityKpiDashboard() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const objectives = await this.prisma.qualityObjective.findMany({
      where: { periodYear: year, periodMonth: month, status: 'active' },
      orderBy: { category: 'asc' },
    });

    const complaintsRaw = await this.prisma.crmComplaint.groupBy({
      by: ['createdAt'], _count: true,
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });

    const complaintByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) complaintByMonth[m] = 0;
    for (const c of complaintsRaw) {
      const m = new Date(c.createdAt).getMonth() + 1;
      complaintByMonth[m] = (complaintByMonth[m] || 0) + c._count;
    }

    const complaintByType = await this.prisma.crmComplaint.groupBy({
      by: ['complaintType'], _count: true,
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });

    const complaintBySeverity = await this.prisma.crmComplaint.groupBy({
      by: ['severity'], _count: true,
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });

    const ncrTotal = await this.prisma.ncrReport.count();
    const ncrOpen = await this.prisma.ncrReport.count({ where: { status: { notIn: ['已关闭', 'closed'] } } });
    const ncrByDefect = await this.prisma.ncrReport.groupBy({ by: ['defectType'], _count: true });

    const capaTotal = await this.prisma.capaReport.count();
    const capaClosed = await this.prisma.capaReport.count({ where: { status: { in: ['已验证', '已关闭', 'closed'] } } });
    const capaCloseRate = capaTotal > 0 ? (capaClosed / capaTotal * 100) : 100;

    const oqcTotal = await this.prisma.outgoingInspection.count({ where: { status: '已完成' } });
    const oqcPassed = await this.prisma.outgoingInspection.count({ where: { result: '合格', status: '已完成' } });
    const oqcPassRate = oqcTotal > 0 ? (oqcPassed / oqcTotal * 100) : 100;

    const iqcTotal = await this.prisma.incomingMaterial.count({ where: { status: { in: ['已完成', '已入库'] } } });
    const iqcPassed = await this.prisma.incomingMaterial.count({ where: { status: { in: ['已完成', '已入库'] }, disposition: null } });
    const iqcPassRate = iqcTotal > 0 ? (iqcPassed / iqcTotal * 100) : 100;

    const ordersDelivered = await this.prisma.crmOrder.count({ where: { status: { in: ['delivered', 'completed'] } } });
    const ordersOnTime = await this.prisma.crmOrder.count({
      where: { status: { in: ['delivered', 'completed'] }, deliveryDate: { not: null } },
    });
    const otifRate = ordersDelivered > 0 ? (ordersOnTime / ordersDelivered * 100) : 100;

    const trainingTotal = await this.prisma.trainingRecord.count();
    const trainingThisYear = await this.prisma.trainingRecord.count({
      where: { trainingDate: { gte: new Date(`${year}-01-01`) } },
    });
    const expiringQualifications = await this.prisma.qualification.count({
      where: { expiryDate: { gte: now, lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } },
    });

    const supplierRatings = await this.prisma.supplier.groupBy({ by: ['rating'], _count: true });

    return {
      objectives,
      complaints: {
        byMonth: Object.entries(complaintByMonth).map(([m, count]) => ({ month: parseInt(m), count })),
        byType: complaintByType.map(g => ({ type: g.complaintType, count: g._count })),
        bySeverity: complaintBySeverity.map(g => ({ severity: g.severity, count: g._count })),
        total: await this.prisma.crmComplaint.count(),
        openCount: await this.prisma.crmComplaint.count({ where: { status: { notIn: ['resolved', 'closed'] } } }),
      },
      quality: {
        ncr: { total: ncrTotal, open: ncrOpen, byDefectType: ncrByDefect.map(g => ({ type: g.defectType, count: g._count })) },
        capa: { total: capaTotal, closed: capaClosed, closeRate: parseFloat(capaCloseRate.toFixed(1)) },
        oqcPassRate: parseFloat(oqcPassRate.toFixed(1)),
        iqcPassRate: parseFloat(iqcPassRate.toFixed(1)),
        otifRate: parseFloat(otifRate.toFixed(1)),
      },
      training: {
        totalRecords: trainingTotal,
        thisYear: trainingThisYear,
        expiringQualifications,
      },
      suppliers: { ratings: supplierRatings.map(g => ({ rating: g.rating, count: g._count })) },
      snapshotDate: now.toISOString(),
    };
  }

  /**
   * P1-5: Management review summary — lightweight snapshot for dashboard card.
   */
  async getManagementReviewSummary() {
    const year = new Date().getFullYear();
    const [complaintCount, openNcr, openCapa, oqcTotal, oqcPassed, trainingCount] = await Promise.all([
      this.prisma.crmComplaint.count({ where: { createdAt: { gte: new Date(`${year}-01-01`) } } }),
      this.prisma.ncrReport.count({ where: { status: { notIn: ['已关闭', 'closed'] } } }),
      this.prisma.capaReport.count({ where: { status: { in: ['待实施', '实施中'] } } }),
      this.prisma.outgoingInspection.count({ where: { status: '已完成' } }),
      this.prisma.outgoingInspection.count({ where: { result: '合格', status: '已完成' } }),
      this.prisma.trainingRecord.count({ where: { trainingDate: { gte: new Date(`${year}-01-01`) } } }),
    ]);
    return {
      year,
      complaintCount,
      openNcr,
      openCapa,
      oqcPassRate: oqcTotal > 0 ? parseFloat((oqcPassed / oqcTotal * 100).toFixed(1)) : 100,
      trainingCount,
    };
  }
}
