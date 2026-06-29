import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  // ===== 仓库 CRUD =====
  async createWarehouse(data: any) {
    const code = await this.codingRule.generate('WH_WAREHOUSE');
    return this.prisma.warehouse.create({ data: { ...data, warehouseCode: code } });
  }

  async findAllWarehouses() {
    return this.prisma.warehouse.findMany({ include: { _count: { select: { locations: true, inventories: true } } } });
  }

  async findOneWarehouse(id: string) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id }, include: { locations: true, inventories: { include: { location: true } } } });
    if (!wh) throw new NotFoundException('仓库不存在');
    return wh;
  }

  async updateWarehouse(id: string, data: any) {
    await this.findOneWarehouse(id);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async removeWarehouse(id: string) {
    await this.findOneWarehouse(id);
    return this.prisma.warehouse.delete({ where: { id } });
  }

  // ===== 库位 CRUD =====
  async createLocation(warehouseId: string, data: any) {
    await this.findOneWarehouse(warehouseId);
    const code = await this.codingRule.generate('WH_LOCATION');
    return this.prisma.warehouseLocation.create({ data: { ...data, warehouseId, locationCode: code } });
  }

  async findLocations(warehouseId: string) {
    return this.prisma.warehouseLocation.findMany({ where: { warehouseId }, include: { _count: { select: { inventories: true } } } });
  }

  async updateLocation(id: string, data: any) {
    return this.prisma.warehouseLocation.update({ where: { id }, data });
  }

  async removeLocation(id: string) {
    return this.prisma.warehouseLocation.delete({ where: { id } });
  }

  // ===== 出入库操作 =====
  async stockIn(data: { warehouseId: string; locationId?: string; materialId: string; materialName: string; materialCode?: string; batchNo?: string; quantity: number; operator?: string; reference?: string }) {
    if (data.quantity <= 0) throw new BadRequestException('数量必须大于0');
    const { warehouseId, locationId, materialId, materialName, materialCode, batchNo, quantity, operator, reference } = data;
    const existing = await this.prisma.warehouseInventory.findUnique({ where: { warehouseId_materialId: { warehouseId, materialId } } });
    const beforeQty = existing?.quantity || 0;
    const afterQty = beforeQty + quantity;
    await this.prisma.warehouseInventory.upsert({
      where: { warehouseId_materialId: { warehouseId, materialId } },
      create: { warehouseId, locationId, materialId, materialName, materialCode, quantity, batchNo, updatedAt: new Date() },
      update: { quantity: afterQty, batchNo, updatedAt: new Date() },
    });
    await this.prisma.inventoryRecord.create({
      data: { materialId, warehouse: warehouseId, type: '入库', batchNo, quantity, beforeQty, afterQty, reference, operator },
    });
    return { beforeQty, afterQty };
  }

  async stockOut(data: { warehouseId: string; materialId: string; materialName: string; materialCode?: string; batchNo?: string; quantity: number; operator?: string; reference?: string }) {
    if (data.quantity <= 0) throw new BadRequestException('数量必须大于0');
    const { warehouseId, materialId, materialName, materialCode, batchNo, quantity, operator, reference } = data;
    const existing = await this.prisma.warehouseInventory.findUnique({ where: { warehouseId_materialId: { warehouseId, materialId } } });
    const beforeQty = existing?.quantity || 0;
    if (beforeQty < quantity) throw new BadRequestException('库存不足，当前库存: ' + beforeQty);
    const afterQty = beforeQty - quantity;
    await this.prisma.warehouseInventory.update({
      where: { warehouseId_materialId: { warehouseId, materialId } },
      data: { quantity: afterQty, updatedAt: new Date() },
    });
    await this.prisma.inventoryRecord.create({
      data: { materialId, warehouse: warehouseId, type: '出库', batchNo, quantity: -quantity, beforeQty, afterQty, reference, operator },
    });
    return { beforeQty, afterQty };
  }

  async getInventory(warehouseId?: string, materialId?: string, keyword?: string, abcClass?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (materialId) where.materialId = materialId;
    if (abcClass) where.abcClass = abcClass;
    if (keyword) where.OR = [
      { materialName: { contains: keyword } },
      { materialCode: { contains: keyword } },
    ];
    return this.prisma.warehouseInventory.findMany({
      where,
      include: { warehouse: { select: { warehouseName: true, warehouseCode: true } }, location: { select: { locationName: true, locationCode: true } } },
      orderBy: { materialName: 'asc' },
    });
  }

  async getInventoryRecords(wid?: string, materialId?: string, type?: string, limit: number = 50) {
    const where: any = {};
    if (wid) where.warehouse = wid;
    if (materialId) where.materialId = materialId;
    if (type) where.type = type;
    return this.prisma.inventoryRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit });
  }

  async getStockWarnings() {
    const inventories = await this.prisma.warehouseInventory.findMany({
      where: { safetyStock: { gt: 0 } },
      include: { warehouse: { select: { warehouseName: true } } },
    });
    return inventories.filter(inv => inv.quantity <= inv.safetyStock);
  }

  async updateAbcClass(id: string, abcClass: string) {
    if (!['A', 'B', 'C'].includes(abcClass)) throw new BadRequestException('分类必须是 A/B/C');
    return this.prisma.warehouseInventory.update({ where: { id }, data: { abcClass } });
  }

  async getAbcDistribution() {
    const result = await this.prisma.warehouseInventory.groupBy({ by: ['abcClass'], _count: true, _sum: { quantity: true } });
    return result;
  }

  async getStats() {
    const [warehouseCount, locationCount, invCount, totalQty, todayIn, todayOut] = await Promise.all([
      this.prisma.warehouse.count(),
      this.prisma.warehouseLocation.count(),
      this.prisma.warehouseInventory.count(),
      this.prisma.warehouseInventory.aggregate({ _sum: { quantity: true } }),
      this.prisma.inventoryRecord.aggregate({ where: { type: '入库', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { quantity: true } }),
      this.prisma.inventoryRecord.aggregate({ where: { type: '出库', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { quantity: true } }),
    ]);
    return { warehouseCount, locationCount, invCount, totalQty: totalQty._sum.quantity || 0, todayIn: todayIn._sum.quantity || 0, todayOut: Math.abs(todayOut._sum.quantity || 0) };
  }

  // ===== FIFO 批次库存方法 =====
  async getBatchInventories(warehouseId?: string, materialId?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (materialId) where.materialId = materialId;
    return this.prisma.batchInventory.findMany({
      where,
      include: {
        warehouse: { select: { warehouseName: true, warehouseCode: true } },
        location: { select: { locationName: true, locationCode: true } },
      },
      orderBy: { receivedDate: 'asc' },
    });
  }

  async getFifoAging(warehouseId?: string, daysThreshold: number = 90) {
    const where: any = { status: 'available', quantity: { gt: 0 } };
    if (warehouseId) where.warehouseId = warehouseId;
    const batches = await this.prisma.batchInventory.findMany({
      where,
      include: {
        warehouse: { select: { warehouseName: true } },
      },
      orderBy: { receivedDate: 'asc' },
    });
    const now = new Date();
    return batches.map(b => {
      const ageDays = Math.floor((now.getTime() - new Date(b.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
      return { ...b, ageDays, aging: ageDays > 180 ? '超期' : ageDays > daysThreshold ? '预警' : '正常' };
    });
  }

  async stockInWithBatch(data: { warehouseId: string; locationId?: string; materialId: string; materialName: string; materialCode?: string; batchNo?: string; quantity: number; operator?: string; reference?: string }) {
    if (data.quantity <= 0) throw new BadRequestException('数量必须大于0');
    const { warehouseId, locationId, materialId, materialName, materialCode, batchNo, quantity, operator, reference } = data;

    // 汇总库存更新
    const existing = await this.prisma.warehouseInventory.findUnique({ where: { warehouseId_materialId: { warehouseId, materialId } } });
    const beforeQty = existing?.quantity || 0;
    const afterQty = beforeQty + quantity;
    await this.prisma.warehouseInventory.upsert({
      where: { warehouseId_materialId: { warehouseId, materialId } },
      create: { warehouseId, locationId, materialId, materialName, materialCode, quantity, batchNo, updatedAt: new Date() },
      update: { quantity: afterQty, updatedAt: new Date() },
    });

    // 批次库存更新
    const effectiveBatchNo = batchNo || `DEF-${Date.now()}`;
    const existingBatch = await this.prisma.batchInventory.findUnique({
      where: { warehouseId_materialId_batchNo: { warehouseId, materialId, batchNo: effectiveBatchNo } },
    });
    if (existingBatch) {
      await this.prisma.batchInventory.update({
        where: { warehouseId_materialId_batchNo: { warehouseId, materialId, batchNo: effectiveBatchNo } },
        data: { quantity: existingBatch.quantity + quantity, updatedAt: new Date() },
      });
    } else {
      await this.prisma.batchInventory.create({
        data: { warehouseId, locationId, materialId, materialName, materialCode, batchNo: effectiveBatchNo, quantity, receivedDate: new Date(), status: 'available' },
      });
    }

    // 出入库记录
    await this.prisma.inventoryRecord.create({
      data: { materialId, warehouse: warehouseId, type: '入库', batchNo: effectiveBatchNo, quantity, beforeQty, afterQty, reference, operator },
    });

    return { beforeQty, afterQty, batchNo: effectiveBatchNo };
  }

  async stockOutFifo(data: { warehouseId: string; materialId: string; materialName: string; materialCode?: string; quantity: number; operator?: string; reference?: string }): Promise<{ beforeQty: number; afterQty: number; fifoPicks: { batchNo: string; pickedQty: number; receivedDate: Date; remainingQty: number }[] }> {
    if (data.quantity <= 0) throw new BadRequestException('数量必须大于0');
    const { warehouseId, materialId, materialName, materialCode, quantity, operator, reference } = data;

    // 汇总库存检查
    const existing = await this.prisma.warehouseInventory.findUnique({ where: { warehouseId_materialId: { warehouseId, materialId } } });
    const beforeQty = existing?.quantity || 0;
    if (beforeQty < quantity) throw new BadRequestException('库存不足，当前库存: ' + beforeQty);

    // FIFO 批次选取
    const batches = await this.prisma.batchInventory.findMany({
      where: { warehouseId, materialId, status: 'available', quantity: { gt: 0 } },
      orderBy: { receivedDate: 'asc' },
    });

    let remaining = quantity;
    const fifoPicks: { batchNo: string; pickedQty: number; receivedDate: Date; remainingQty: number }[] = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const pickQty = Math.min(remaining, batch.quantity);
      remaining -= pickQty;
      const newBatchQty = batch.quantity - pickQty;
      await this.prisma.batchInventory.update({
        where: { id: batch.id },
        data: { quantity: newBatchQty, status: newBatchQty === 0 ? 'depleted' : 'available', updatedAt: new Date() },
      });
      fifoPicks.push({ batchNo: batch.batchNo, pickedQty: pickQty, receivedDate: batch.receivedDate, remainingQty: newBatchQty });
    }

    if (remaining > 0) throw new BadRequestException('FIFO分配异常: 批次库存不足');

    const afterQty = beforeQty - quantity;
    await this.prisma.warehouseInventory.update({
      where: { warehouseId_materialId: { warehouseId, materialId } },
      data: { quantity: afterQty, updatedAt: new Date() },
    });

    const batchDesc = fifoPicks.map(p => `${p.batchNo}(${p.pickedQty})`).join(',');
    await this.prisma.inventoryRecord.create({
      data: { materialId, warehouse: warehouseId, type: '出库', batchNo: batchDesc.substring(0, 200), quantity: -quantity, beforeQty, afterQty, reference, operator },
    });

    return { beforeQty, afterQty, fifoPicks };
  }

}
