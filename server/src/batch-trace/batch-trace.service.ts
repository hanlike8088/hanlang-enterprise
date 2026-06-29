import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class BatchTraceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  // ===== MaterialBatch CRUD =====
  async createBatch(data: {
    materialId: string;
    batchNo: string;
    supplierId?: string;
    supplierName?: string;
    productionDate?: string;
    expiryDate?: string;
    quantity?: number;
    unit?: string;
  }) {
    const existing = await this.prisma.materialBatch.findUnique({
      where: { materialId_batchNo: { materialId: data.materialId, batchNo: data.batchNo } },
    });
    if (existing) throw new BadRequestException('批次号已存在');
    return this.prisma.materialBatch.create({
      data: {
        materialId: data.materialId,
        batchNo: data.batchNo,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        productionDate: data.productionDate ? new Date(data.productionDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        quantity: data.quantity ?? 0,
        unit: data.unit ?? 'pcs',
      },
    });
  }

  async findAllBatches(materialId?: string, keyword?: string, status?: string) {
    const where: any = {};
    if (materialId) where.materialId = materialId;
    if (status) where.status = status;
    if (keyword) where.OR = [
      { batchNo: { contains: keyword } },
      { supplierName: { contains: keyword } },
    ];
    return this.prisma.materialBatch.findMany({
      where,
      include: { material: { select: { materialCode: true, materialName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBatch(materialId: string, batchNo: string) {
    const batch = await this.prisma.materialBatch.findUnique({
      where: { materialId_batchNo: { materialId, batchNo } },
      include: {
        material: true,
        records: {
          orderBy: { createdAt: 'desc' },
          take: 200,
        },
      },
    });
    if (!batch) throw new NotFoundException('批次不存在');
    return batch;
  }

  // ===== BatchTrace =====
  async addTrace(data: {
    batchNo: string;
    materialId: string;
    materialName?: string;
    sourceType: string;
    sourceId?: string;
    sourceCode?: string;
    targetType?: string;
    targetId?: string;
    targetCode?: string;
    operation: string;
    quantity?: number;
    beforeQty?: number;
    afterQty?: number;
    operator?: string;
    remark?: string;
  }) {
    // Try to link to an existing material batch
    let materialBatchId: string | undefined;
    try {
      const mb = await this.prisma.materialBatch.findUnique({
        where: { materialId_batchNo: { materialId: data.materialId, batchNo: data.batchNo } },
      });
      if (mb) materialBatchId = mb.id;
    } catch (_) {}

    return this.prisma.batchTrace.create({
      data: {
        ...data,
        quantity: data.quantity ?? 0,
        beforeQty: data.beforeQty ?? 0,
        afterQty: data.afterQty ?? 0,
        materialBatchId,
      },
    });
  }

  async getTraceChain(batchNo?: string, materialId?: string, sourceType?: string, sourceId?: string, limit: number = 200) {
    const where: any = {};
    if (batchNo) where.batchNo = batchNo;
    if (materialId) where.materialId = materialId;
    if (sourceType) where.sourceType = sourceType;
    if (sourceId) where.sourceId = sourceId;
    return this.prisma.batchTrace.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { materialBatch: { select: { batchNo: true, supplierName: true, productionDate: true } } },
    });
  }

  // Full forward/backward trace for a batch
  async fullTrace(batchNo: string) {
    const forward = await this.prisma.batchTrace.findMany({
      where: { batchNo },
      orderBy: { createdAt: 'asc' },
    });

    // Get all related batchNos from traces touching same sourceIds
    const sourceIds = [...new Set(forward.filter(t => t.sourceId).map(t => t.sourceId))];
    const related: any[] = [];
    for (const sid of sourceIds) {
      if (!sid) continue;
      const others = await this.prisma.batchTrace.findMany({
        where: { sourceId: sid, batchNo: { not: batchNo } },
        select: { batchNo: true, operation: true, createdAt: true },
        distinct: ['batchNo'],
      });
      related.push(...others);
    }

    return { forward, related };
  }

  // Batch label printing
  async createLabel(data: { batchNo: string; productName?: string; productCode?: string }) {
    const existing = await this.prisma.batchLabel.findUnique({ where: { batchNo: data.batchNo } });
    if (existing) return existing;
    return this.prisma.batchLabel.create({ data });
  }

  async printLabel(batchNo: string, printedBy: string) {
    const label = await this.prisma.batchLabel.findUnique({ where: { batchNo } });
    if (!label) throw new NotFoundException('标签不存在');
    return this.prisma.batchLabel.update({
      where: { batchNo },
      data: { printedBy, printedAt: new Date() },
    });
  }

  async findLabel(batchNo: string) {
    const label = await this.prisma.batchLabel.findUnique({ where: { batchNo } });
    if (!label) throw new NotFoundException('标签不存在');
    return label;
  }

  // Stats for dashboard
  async getStats() {
    const [batchCount, traceCount, labelCount, activeBatches] = await Promise.all([
      this.prisma.materialBatch.count(),
      this.prisma.batchTrace.count(),
      this.prisma.batchLabel.count(),
      this.prisma.materialBatch.count({ where: { status: 'active' } }),
    ]);
    return { batchCount, traceCount, labelCount, activeBatches };
  }
}
