import { Injectable, NotFoundException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { PLM_PRODUCT_TRANSITIONS, PLM_BOM_TRANSITIONS, PLM_DOCUMENT_TRANSITIONS } from '../common/services/status-transitions';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PlmService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit() {
    // Chain 6: Equipment Anomaly -> PLM technical change document
    this.eventBus.on(CrossModuleEvents.EQUIPMENT_ANOMALY_DETECTED,
      async (event) => { await this.handleEquipmentAnomaly(event.data); });
  }

  private async handleEquipmentAnomaly(data: any) {
    // Look up the equipment name for document context
    let equipmentName = data.equipmentName || '';
    if (!equipmentName && data.equipmentId) {
      try {
        const eq = await this.prisma.equipment.findUnique({
          where: { id: data.equipmentId },
          select: { equipmentName: true },
        });
        if (eq) equipmentName = eq.equipmentName;
      } catch { /* lookup failure is non-fatal */ }
    }

    const code = await this.codingRule.generate('PLM_DOCUMENT');
    await this.prisma.plmDocument.create({
      data: {
        docCode: code,
        docName: `设备异常技术变更 - ${equipmentName || '未知设备'}`,
        docType: '技术变更',
        filePath: '',
        fileSize: 0,
        status: '草稿',
        version: 'V1.0',
      },
    });

    console.log(
      `[EventBus] 设备异常检测 -> 自动创建PLM技术变更文档: ${code} (设备: ${equipmentName || data.equipmentId})`,
    );
  }

  // ========== Products ==========

  async getProducts() {
    return this.prisma.plmProduct.findMany({
      orderBy: { createdAt: 'desc' },
      include: { boms: true, documents: true },
    });
  }

  async getProduct(id: string) {
    const p = await this.prisma.plmProduct.findUnique({
      where: { id }, include: { boms: true, documents: true },
    });
    if (!p) throw new NotFoundException('产品不存在');
    return p;
  }

  async createProduct(dto: any) {
    // 使用 DTO 中的 productCode（前端已通过 getNextProductCode 生成），不再覆盖
    // const code = await this.codingRule.generate(PLM_PRODUCT); // 已废弃：与 getNextProductCode 冲突
    return this.prisma.plmProduct.create({ data: dto });
  }

  async updateProduct(id: string, dto: any) {
    await this.getProduct(id);
    return this.prisma.plmProduct.update({ where: { id }, data: dto });
  }

  async deleteProduct(id: string) {
    await this.getProduct(id);
    return this.prisma.plmProduct.delete({ where: { id } });
  }

  async transitionProduct(id: string, status: string) {
    const p = await this.getProduct(id);
    this.sm.validateTransition(PLM_PRODUCT_TRANSITIONS, p.status, status);
    return this.prisma.plmProduct.update({ where: { id }, data: { status } });
  }

  // ========== BOMs ==========

  async getBoms(productId?: string) {
    const where = productId ? { productId } : {};
    return this.prisma.plmBom.findMany({ where, orderBy: { createdAt: 'desc' }, include: { product: true } });
  }

  async getBom(id: string) {
    const bom = await this.prisma.plmBom.findUnique({ where: { id }, include: { product: true } });
    if (!bom) throw new NotFoundException('BOM不存在');
    return bom;
  }

  async createBom(dto: any) {
    const code = await this.codingRule.generate('PLM_BOM');
    return this.prisma.plmBom.create({ data: { ...dto, bomCode: code } });
  }

  async updateBom(id: string, dto: any) {
    await this.getBom(id);
    return this.prisma.plmBom.update({ where: { id }, data: dto });
  }

  async deleteBom(id: string) {
    await this.getBom(id);
    return this.prisma.plmBom.delete({ where: { id } });
  }

  async transitionBom(id: string, status: string) {
    const b = await this.getBom(id);
    this.sm.validateTransition(PLM_BOM_TRANSITIONS, b.status, status);
    return this.prisma.plmBom.update({ where: { id }, data: { status } });
  }

  // ========== Documents ==========

  async getDocuments(productId?: string, docType?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (docType) where.docType = docType;
    return this.prisma.plmDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getDocument(id: string) {
    const doc = await this.prisma.plmDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('文档不存在');
    return doc;
  }

  async createDocument(dto: any) {
    const code = dto.docCode || await this.codingRule.generate('PLM_DOCUMENT');
    return this.prisma.plmDocument.create({ data: { ...dto, docCode: code } });
  }

  async updateDocument(id: string, dto: any) {
    await this.getDocument(id);
    return this.prisma.plmDocument.update({ where: { id }, data: dto });
  }

  async deleteDocument(id: string) {
    await this.getDocument(id);
    return this.prisma.plmDocument.delete({ where: { id } });
  }

  async transitionDocument(id: string, status: string) {
    const d = await this.getDocument(id);
    this.sm.validateTransition(PLM_DOCUMENT_TRANSITIONS, d.status, status);
    return this.prisma.plmDocument.update({ where: { id }, data: { status } });
  }

  async getPatents(patentType?: string) {
    const where: any = { docType: '专利' };
    if (patentType) where.patentType = patentType;
    return this.prisma.plmDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getExpiringPatents(days: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.prisma.plmDocument.findMany({
      where: {
        docType: '专利',
        expirationDate: { lte: cutoff, gte: new Date() },
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  // ========== Patent Import ==========

  async importPatents(sourceDir?: string) {
    const srcDir = sourceDir || 'E:\\公司专利';
    const destBase = path.join(process.cwd(), 'uploads', 'patents');
    if (!fs.existsSync(destBase)) fs.mkdirSync(destBase, { recursive: true });

    let files: string[] = [];
    try {
      files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    } catch {
      return { imported: 0, skipped: 0, errors: 0, total: 0, message: `Cannot read source directory: ${srcDir}` };
    }

    const existing = await this.prisma.plmDocument.findMany({
      where: { docType: '专利' },
      select: { docCode: true },
    });
    const existingNames = new Set(existing.map(d => d.docCode));

    let imported = 0, skipped = 0, errors = 0;

    for (const fileName of files) {
      const baseName = path.parse(fileName).name;
      const docCode = `PAT-${baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '')}`;

      if (existingNames.has(docCode)) { skipped++; continue; }

      try {
        const srcFile = path.join(srcDir, fileName);
        const destFile = path.join(destBase, fileName);
        fs.copyFileSync(srcFile, destFile);
        const stat = fs.statSync(destFile);

        let patentType = '发明专利';
        if (fileName.includes('实用')) patentType = '实用新型';
        if (fileName.includes('外观')) patentType = '外观设计';

        await this.prisma.plmDocument.create({
          data: {
            docCode,
            docName: baseName,
            docType: '专利',
            patentType,
            filePath: destFile,
            fileSize: stat.size,
            status: '已发布',
            version: 'V1.0',
          },
        });
        imported++;
      } catch (e) {
        errors++;
      }
    }

    return { imported, skipped, errors, total: files.length, message: `Imported ${imported} patents, skipped ${skipped}, errors ${errors}` };
  }

  // ========== Next Product Code ==========

  async getNextProductCode(): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PRD-${ym}-`;

    const last = await this.prisma.plmProduct.findFirst({
      where: { productCode: { startsWith: prefix } },
      orderBy: { productCode: 'desc' },
      select: { productCode: true },
    });

    let seq = 1;
    if (last?.productCode) {
      const num = parseInt(last.productCode.split('-').pop() || '0', 10);
      if (!isNaN(num)) seq = num + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  // Search erp materials
  async searchMaterials(q: string) {
    if (!q || q.trim().length === 0) return [];
    const keyword = q.trim();
    return this.prisma.erpMaterial.findMany({
      where: {
        materialType: '成品',
        OR: [
          { materialCode: { contains: keyword, mode: 'insensitive' } },
          { materialName: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        materialCode: true,
        materialName: true,
        spec: true,
        category: true,
        unit: true,
      },
      take: 20,
      orderBy: { materialCode: 'asc' },
    });
  }

}
