import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class MrpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  /**
   * Run MRP calculation: sales orders → BOM explode → stock check → purchase suggestions.
   * Returns a summary of the MRP run with all line items.
   */
  async runMrp(createdBy?: string) {
    const runCode = await this.codingRule.generate('MRP_RUN');

    // 1. Get all open sales orders (not completed / cancelled)
    const openOrders = await this.prisma.crmOrder.findMany({
      where: { status: { notIn: ['completed', 'cancelled'] } },
    });

    // 2. Build material demand map: materialId → aggregated demand
    const demandMap = new Map<
      string,
      { materialCode: string; materialName: string; unit: string; demand: number; orders: string[] }
    >();

    for (const order of openOrders) {
      // Get BOM for this order's product
      const product = await this.prisma.plmProduct.findUnique({
        where: { productCode: order.productId },
        include: { boms: true },
      });
      if (!product || !product.boms.length) continue;

      const orderQty = order.quantity || 1;

      for (const bom of product.boms) {
        const matId = bom.materialId;
        const bomQty = bom.quantity || 0;
        const demand = orderQty * bomQty;

        const existing = demandMap.get(matId);
        if (existing) {
          existing.demand += demand;
          if (!existing.orders.includes(order.orderCode)) {
            existing.orders.push(order.orderCode);
          }
        } else {
          // Look up material details
          const mat = await this.prisma.erpMaterial.findUnique({
            where: { id: matId },
          });
          demandMap.set(matId, {
            materialCode: mat?.materialCode || matId,
            materialName: mat?.materialName || bom.materialId,
            unit: mat?.unit || bom.unit || 'pcs',
            demand,
            orders: [order.orderCode],
          });
        }
      }
    }

    // 3. Create the MRP run record
    const run = await this.prisma.mrpRun.create({
      data: {
        runCode,
        status: 'running',
        totalDemand: 0,
        totalShortage: 0,
        createdBy,
      },
    });

    // 4. Compute each material's shortage and create items
    let totalDemand = 0;
    let totalShortage = 0;
    let itemsCount = 0;

    const items = [];
    for (const [matId, info] of demandMap.entries()) {
      // Get current stock
      const mat = await this.prisma.erpMaterial.findUnique({
        where: { id: matId },
      });
      const currentStock = mat?.stock || 0;
      const shortage = Math.max(0, info.demand - currentStock);
      const suggestedQty = Math.max(0, info.demand - currentStock + (mat?.safetyStock || 0));

      totalDemand += info.demand;
      totalShortage += shortage;

      const item = await this.prisma.mrpRunItem.create({
        data: {
          runId: run.id,
          materialId: matId,
          materialCode: info.materialCode,
          materialName: info.materialName,
          unit: info.unit,
          totalDemand: info.demand,
          currentStock,
          shortage,
          suggestedQty,
          status: shortage > 0 ? 'open' : 'sufficient',
          sourceOrders: info.orders.join(', '),
        },
      });
      items.push(item);
      itemsCount++;
    }

    // 5. Update run summary
    await this.prisma.mrpRun.update({
      where: { id: run.id },
      data: { status: 'completed', totalDemand, totalShortage, itemsCount },
    });

    return { run: { ...run, totalDemand, totalShortage, itemsCount }, items };
  }

  async findAllRuns() {
    return this.prisma.mrpRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findRunById(id: string) {
    const run = await this.prisma.mrpRun.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!run) throw new NotFoundException('MRP运算不存在');
    return run;
  }

  async deleteRun(id: string) {
    await this.prisma.mrpRun.delete({ where: { id } });
    return { ok: true };
  }
}
