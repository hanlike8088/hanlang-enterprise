import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class CostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  // 从 BOM 计算产品标准物料成本
  async calculateStandardCost(productId: string) {
    const product = await this.prisma.plmProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('产品不存在');

    const boms = await this.prisma.plmBom.findMany({ where: { productId, status: 'active' } });
    if (boms.length === 0) throw new BadRequestException('该产品无有效 BOM');

    const items: any[] = [];
    let totalStandard = 0;

    for (const bom of boms) {
      const material = await this.prisma.erpMaterial.findUnique({ where: { id: bom.materialId } });
      const standardPrice = material?.price ?? 0;
      const standardTotal = bom.quantity * standardPrice;
      totalStandard += standardTotal;
      items.push({
        materialId: bom.materialId,
        materialName: material?.materialName ?? bom.materialId,
        materialCode: material?.materialCode,
        bomQuantity: bom.quantity,
        unit: bom.unit,
        standardPrice,
        standardTotal,
        sourceType: 'BOM',
        sourceId: bom.id,
      });
    }

    return { productId, productName: product.productName, productCode: product.productCode, items, totalStandard };
  }

  // 从采购订单获取物料实际采购成本（加权平均）
  // 改进匹配：按 materialCode > materialName 双层匹配
  async getActualCosts(productId: string) {
    const boms = await this.prisma.plmBom.findMany({ where: { productId, status: 'active' } });
    const materialIds = [...new Set(boms.map(b => b.materialId))];

    const actualMap: Record<string, { totalQty: number; totalAmount: number; avgPrice: number }> = {};

    // 一次查询所有 PO 行项，避免 N+1
    const allPoItems = await this.prisma.purchaseOrderItem.findMany({
      where: { materialName: { not: '' } },
    });

    for (const mid of materialIds) {
      const material = await this.prisma.erpMaterial.findUnique({ where: { id: mid } });
      if (!material) {
        actualMap[mid] = { totalQty: 0, totalAmount: 0, avgPrice: 0 };
        continue;
      }

      // 按 materialCode 精确匹配，降级为 materialName
      const matchingItems = allPoItems.filter(pi =>
        pi.materialName === material.materialCode || pi.materialName === material.materialName
      );

      let totalQty = 0;
      let totalAmount = 0;
      for (const item of matchingItems) {
        totalQty += item.quantity || 0;
        totalAmount += (item.totalPrice || 0) || (item.unitPrice || 0) * (item.quantity || 0);
      }
      actualMap[mid] = {
        totalQty,
        totalAmount,
        avgPrice: totalQty > 0 ? totalAmount / totalQty : 0,
      };
    }

    return actualMap;
  }

  // 创建成本核算表
  async createCostSheet(data: { productId: string; productName: string; productCode?: string; period?: string }) {
    const { productId, productName, productCode, period } = data;

    // 标准成本
    const stdResult = await this.calculateStandardCost(productId);

    // 实际成本
    const actualMap = await this.getActualCosts(productId);

    // 合并计算
    const items: any[] = [];
    let totalStandard = 0;
    let totalActual = 0;

    for (const item of stdResult.items) {
      const actual = actualMap[item.materialId] || { avgPrice: 0, totalQty: 0, totalAmount: 0 };
      const actualPrice = actual.avgPrice;
      const actualTotal = item.bomQuantity * actualPrice;

      totalStandard += item.standardTotal;
      totalActual += actualTotal;

      items.push({
        materialId: item.materialId,
        materialName: item.materialName,
        materialCode: item.materialCode,
        bomQuantity: item.bomQuantity,
        unit: item.unit,
        standardPrice: item.standardPrice,
        standardTotal: item.standardTotal,
        actualPrice,
        actualTotal,
        variance: actualTotal - item.standardTotal,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
      });
    }

    const variance = totalActual - totalStandard;
    const variancePct = totalStandard > 0 ? (variance / totalStandard) * 100 : 0;

    const sheetCode = await this.codingRule.generate('COST_SHEET');

    return this.prisma.costSheet.create({
      data: {
        sheetCode,
        productId,
        productName,
        productCode,
        standardCost: totalStandard,
        actualCost: totalActual,
        variance,
        variancePct,
        period: period || new Date().toISOString().slice(0, 7),
        status: 'calculated',
        items: {
          create: items.map(i => ({
            materialId: i.materialId,
            materialName: i.materialName,
            materialCode: i.materialCode,
            bomQuantity: i.bomQuantity,
            unit: i.unit,
            standardPrice: i.standardPrice,
            standardTotal: i.standardTotal,
            actualPrice: i.actualPrice,
            actualTotal: i.actualTotal,
            variance: i.variance,
            sourceType: i.sourceType,
            sourceId: i.sourceId,
          })),
        },
      },
      include: { items: true },
    });
  }

  // 查询成本核算表
  async findAllSheets(productId?: string, period?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (period) where.period = period;
    return this.prisma.costSheet.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOneSheet(id: string) {
    const sheet = await this.prisma.costSheet.findUnique({ where: { id }, include: { items: true } });
    if (!sheet) throw new NotFoundException('成本核算表不存在');
    return sheet;
  }

  // 快速计算（不保存）
  async quickCompare(productId: string) {
    const stdResult = await this.calculateStandardCost(productId);
    const actualMap = await this.getActualCosts(productId);

    const items = stdResult.items.map(item => {
      const actual = actualMap[item.materialId] || { avgPrice: 0 };
      const actualTotal = item.bomQuantity * actual.avgPrice;
      return {
        ...item,
        actualPrice: actual.avgPrice,
        actualTotal,
        variance: actualTotal - item.standardTotal,
      };
    });

    const totalStandard = stdResult.totalStandard;
    const totalActual = items.reduce((sum, i) => sum + i.actualTotal, 0);
    const variance = totalActual - totalStandard;
    const variancePct = totalStandard > 0 ? (variance / totalStandard) * 100 : 0;

    return {
      productId: stdResult.productId,
      productName: stdResult.productName,
      productCode: stdResult.productCode,
      standardCost: totalStandard,
      actualCost: totalActual,
      variance,
      variancePct,
      items,
    };
  }

  // 成本趋势分析：按产品+期间对比标准/实际/差异
  async getCostTrend(productId?: string, periodFrom?: string, periodTo?: string, limit = 12) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (periodFrom || periodTo) {
      where.period = {};
      if (periodFrom) where.period.gte = periodFrom;
      if (periodTo) where.period.lte = periodTo;
    }

    const sheets = await this.prisma.costSheet.findMany({
      where,
      orderBy: { period: 'asc' },
      take: limit,
    });

    const trendMap: Record<string, any> = {};
    for (const s of sheets) {
      const key = `${s.productId}|${s.period}`;
      if (!trendMap[key]) {
        trendMap[key] = {
          period: s.period,
          productId: s.productId,
          productName: s.productName,
          standardCost: s.standardCost,
          actualCost: s.actualCost,
          variance: s.variance,
          variancePct: s.variancePct,
          sheetId: s.id,
        };
      }
    }

    const trends = Object.values(trendMap);
    // 计算环比变化
    for (let i = 1; i < trends.length; i++) {
      const prev = trends[i - 1] as any;
      const curr = trends[i] as any;
      curr.prevStandardCost = prev.standardCost;
      curr.prevActualCost = prev.actualCost;
      curr.standardChange = prev.standardCost > 0 ? ((curr.standardCost - prev.standardCost) / prev.standardCost * 100) : 0;
      curr.actualChange = prev.actualCost > 0 ? ((curr.actualCost - prev.actualCost) / prev.actualCost * 100) : 0;
    }

    return trends;
  }

  // 物料价格历史追踪
  async getMaterialPriceHistory(materialId: string, limit = 20) {
    const material = await this.prisma.erpMaterial.findUnique({ where: { id: materialId } });
    if (!material) throw new NotFoundException('物料不存在');

    const items = await this.prisma.costSheetItem.findMany({
      where: { materialId },
      include: { sheet: true },
      orderBy: { sheet: { period: 'asc' } },
      take: limit,
    });

    const history = items.map(item => ({
      period: item.sheet.period,
      productName: item.sheet.productName,
      standardPrice: item.standardPrice,
      actualPrice: item.actualPrice,
      variance: item.variance,
      sheetId: item.sheetId,
    }));

    return {
      materialId: material.id,
      materialName: material.materialName,
      materialCode: material.materialCode,
      currentPrice: material.price,
      history,
    };
  }

  // 全部产品汇总成本概览
  async getCostSummary() {
    const sheets = await this.prisma.costSheet.findMany({
      orderBy: { period: 'desc' },
      take: 100,
    });

    const byProduct: Record<string, { productName: string; sheets: any[]; latestStandard: number; latestActual: number; avgVariancePct: number }> = {};

    for (const s of sheets) {
      if (!byProduct[s.productId]) {
        byProduct[s.productId] = { productName: s.productName, sheets: [], latestStandard: 0, latestActual: 0, avgVariancePct: 0 };
      }
      byProduct[s.productId].sheets.push(s);
    }

    const summary = Object.entries(byProduct).map(([productId, data]) => {
      const sorted = data.sheets.sort((a, b) => b.period.localeCompare(a.period));
      const latest = sorted[0];
      const avgVariancePct = sorted.length > 0 ? sorted.reduce((sum, s) => sum + Math.abs(s.variancePct), 0) / sorted.length : 0;

      return {
        productId,
        productName: data.productName,
        latestPeriod: latest?.period || '-',
        latestStandardCost: latest?.standardCost || 0,
        latestActualCost: latest?.actualCost || 0,
        latestVariance: latest?.variance || 0,
        latestVariancePct: latest?.variancePct || 0,
        avgAbsVariancePct: avgVariancePct,
        sheetCount: sorted.length,
      };
    });

    return summary;
  }

  async deleteSheet(id: string) {
    await this.findOneSheet(id);
    return this.prisma.costSheet.delete({ where: { id } });
  }
}
