import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { K3CloudService } from '../k3cloud/k3cloud.service';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { ERP_MATERIAL_TRANSITIONS, ERP_WORK_ORDER_TRANSITIONS } from '../common/services/status-transitions';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/create-material.dto';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/create-work-order.dto';

@Injectable()
export class ErpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
        private readonly sm: StatusMachineService,
    private readonly k3cloud: K3CloudService,
  ) {}

  async createMaterial(dto: CreateMaterialDto) {
    const materialCode = await this.codingRule.generate('ERP_MATERIAL');
    return this.prisma.erpMaterial.create({ data: { ...dto, materialCode } });
  }

  async getMaterials(keyword?: string) {
    const where: any = {};
    if (keyword) {
      where.OR = [
        { materialCode: { contains: keyword } },
        { materialName: { contains: keyword } },
      ];
    }
    return this.prisma.erpMaterial.findMany({ where, orderBy: { createdAt: 'desc' } });
  }


  async transitionMaterial(id: string, nextStatus: string) {
    const material: any = await this.getMaterial(id);
    this.sm.validateTransition(ERP_MATERIAL_TRANSITIONS, material.status, nextStatus);
    return this.prisma.erpMaterial.update({ where: { id }, data: { status: nextStatus } });
  }
  async getMaterial(id: string) {
    const material = await this.prisma.erpMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('物料不存在');
    return material;
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    await this.getMaterial(id);
    return this.prisma.erpMaterial.update({ where: { id }, data: dto });
  }

  async deleteMaterial(id: string) {
    await this.getMaterial(id);
    return this.prisma.erpMaterial.delete({ where: { id } });
  }


  /** 从金蝶同步物料数据 */
  async syncMaterialsFromK3() {
    const logger = new Logger('ErpSync');
    logger.log('开始从金蝶同步物料...');
    const result = await this.k3cloud.getMaterials();
    const rows = (result?.Result || result || []) as any[];
    if (!Array.isArray(rows) || rows.length === 0) {
      logger.warn('金蝶返回物料数据为空');
      return { synced: 0, skipped: 0, total: 0, message: '金蝶返回物料数据为空' };
    }
    const existing = await this.prisma.erpMaterial.findMany({ select: { materialCode: true } });
    const existingCodes = new Set(existing.map(m => m.materialCode));
    let synced = 0; let skipped = 0;
    for (const row of rows) {
      const code = row[0] as string;
      const name = row[1] as string;
      const spec = (row[2] as string) || '';
      if (!code || !name) continue;
      if (existingCodes.has(code)) { skipped++; continue; }
      try {
        await this.prisma.erpMaterial.create({
          data: { materialCode: code, materialName: name, spec, category: '原材料', unit: 'pcs', stock: 0, safetyStock: 0 },
        });
        synced++;
      } catch (e) {
        logger.warn('创建物料失败: ' + code + ' - ' + (e as any)?.message);
      }
    }
    logger.log('物料同步完成: 新增 ' + synced + ', 跳过 ' + skipped);
    return { synced, skipped, total: rows.length };
  }

  async createWorkOrder(dto: CreateWorkOrderDto) {
    const orderCode = await this.codingRule.generate('ERP_WORK_ORDER');
    return this.prisma.erpWorkOrder.create({
      data: { ...dto, orderCode, startDate: new Date(dto.startDate), endDate: dto.endDate ? new Date(dto.endDate) : null },
    });
  }

  async getWorkOrders(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.erpWorkOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
  }


  async transitionWorkOrder(id: string, nextStatus: string) {
    const wo = await this.getWorkOrder(id);
    this.sm.validateTransition(ERP_WORK_ORDER_TRANSITIONS, wo.status, nextStatus);
    return this.prisma.erpWorkOrder.update({ where: { id }, data: { status: nextStatus } });
  }
  async getWorkOrder(id: string) {
    const wo = await this.prisma.erpWorkOrder.findUnique({ where: { id } });
    if (!wo) throw new NotFoundException('工单不存在');
    return wo;
  }

  async updateWorkOrder(id: string, dto: UpdateWorkOrderDto) {
    await this.getWorkOrder(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.erpWorkOrder.update({ where: { id }, data });
  }

  async deleteWorkOrder(id: string) {
    await this.getWorkOrder(id);
    return this.prisma.erpWorkOrder.delete({ where: { id } });
  }
}
