import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { DRAWING_TRANSITIONS } from '../common/services/status-transitions';
import { CreateDrawingDto, NewDrawingVersionDto, UpdateDrawingDto } from './dto/drawing.dto';

@Injectable()
export class DrawingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
        private readonly sm: StatusMachineService,
  ) {}

  async create(dto: CreateDrawingDto) {
    const drawingCode = dto.drawingCode || await this.codingRule.generate('DRAWING');
    const initialVersion = 'V1.0';
    const drawing = await this.prisma.drawing.create({
      data: {
        drawingCode,
        drawingName: dto.drawingName,
        productId: dto.productId || null,
        category: dto.category || null,
        description: dto.description || null,
        latestVersion: initialVersion,
      },
    });

    await this.prisma.drawingVersion.create({
      data: {
        drawingId: drawing.id,
        version: initialVersion,
        docType: dto.docType || 'pdf',
        fileName: dto.fileName || '',
        filePath: dto.filePath || '',
        fileSize: dto.fileSize || 0,
        changeNote: 'Initial version',
        uploadBy: dto.uploadBy || 'system',
        isLatest: true,
      },
    });

    return this.findOne(drawing.id);
  }

  async findAll(productId?: string, status?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    return this.prisma.drawing.findMany({
      where,
      include: { versions: { orderBy: { createdAt: 'desc' } }, product: true },
      orderBy: { updatedAt: 'desc' },
    });
  }


  async transitionDrawing(id: string, nextStatus: string) {
    const drawing = await this.findOne(id);
    this.sm.validateTransition(DRAWING_TRANSITIONS, drawing.status, nextStatus);
    return this.prisma.drawing.update({
      where: { id }, data: { status: nextStatus },
      include: { versions: { orderBy: { createdAt: 'desc' } }, product: true },
    });
  }
  async findOne(id: string) {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id },
      include: { versions: { orderBy: { createdAt: 'desc' } }, product: true },
    });
    if (!drawing) throw new NotFoundException('图纸不存在');
    return drawing;
  }

  async update(id: string, dto: UpdateDrawingDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.productId !== undefined && dto.productId === '') data.productId = null;
    return this.prisma.drawing.update({
      where: { id },
      data,
      include: { versions: { orderBy: { createdAt: 'desc' } }, product: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.drawing.delete({ where: { id } });
  }

  async addVersion(drawingId: string, dto: NewDrawingVersionDto) {
    const drawing = await this.findOne(drawingId);

    const match = drawing.latestVersion.match(/^V(\d+)\.(\d+)$/);
    let newVersion: string;
    if (match) {
      const major = parseInt(match[1]);
      const minor = parseInt(match[2]) + 1;
      newVersion = `V${major}.` + minor;
    } else {
      throw new BadRequestException('版本格式无效');
    }

    await this.prisma.drawingVersion.updateMany({
      where: { drawingId },
      data: { isLatest: false },
    });

    await this.prisma.drawingVersion.create({
      data: {
        drawingId,
        version: newVersion,
        docType: dto.docType || 'pdf',
        fileName: dto.fileName || '',
        filePath: dto.filePath || '',
        fileSize: dto.fileSize || 0,
        changeNote: dto.changeNote || null,
        uploadBy: dto.uploadBy,
        isLatest: true,
      },
    });

    await this.prisma.drawing.update({
      where: { id: drawingId },
      data: { latestVersion: newVersion },
    });

    return this.findOne(drawingId);
  }

  async getVersions(drawingId: string) {
    await this.findOne(drawingId);
    return this.prisma.drawingVersion.findMany({
      where: { drawingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async compareVersions(drawingId: string, v1Id: string, v2Id: string) {
    const [ver1, ver2] = await Promise.all([
      this.prisma.drawingVersion.findUnique({ where: { id: v1Id } }),
      this.prisma.drawingVersion.findUnique({ where: { id: v2Id } }),
    ]);
    if (!ver1 || !ver2) throw new NotFoundException('版本不存在');
    return { version1: ver1, version2: ver2 };
  }
}
