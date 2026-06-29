import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    username?: string;
    action: string;
    entity: string;
    entityId?: string;
    detail?: string;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({ data: params });
    } catch (err) {
      // Never let audit logging break the main request
      console.error('[AuditLog] Failed to write log:', err.message);
    }
  }

  async findAll(page = 1, pageSize = 50, filters?: { action?: string; entity?: string; username?: string }) {
    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.entity) where.entity = { contains: filters.entity };
    if (filters?.username) where.username = { contains: filters.username };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getStats() {
    const [total, createCount, updateCount, deleteCount] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { action: 'POST' } }),
      this.prisma.auditLog.count({ where: { action: { in: ['PUT', 'PATCH'] } } }),
      this.prisma.auditLog.count({ where: { action: 'DELETE' } }),
    ]);
    const recentActions = await this.prisma.auditLog.groupBy({
      by: ['entity'],
      _count: true,
      orderBy: { _count: { entity: 'desc' } },
      take: 20,
    });
    return { total, createCount, updateCount, deleteCount, topEntities: recentActions };
  }
}
