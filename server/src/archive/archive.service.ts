import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);
  constructor(private readonly prisma: PrismaService) {}

  async listRuns() {
    return this.prisma.archiveRun.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async archive(entityType: string, olderThanMonths: number, triggeredBy?: string) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - olderThanMonths);
    let count = 0;
    try {
      switch (entityType) {
        case 'sampling_work_orders': count = await this.archiveCompleted(this.prisma.samplingWorkOrder, cutoff); break;
        case 'purchase_orders': count = await this.archiveClosed(this.prisma.purchaseOrder, cutoff); break;
        case 'crm_orders': count = await this.archiveClosed(this.prisma.crmOrder, cutoff); break;
        case 'manufacturing_orders': count = await this.archiveClosed(this.prisma.manufacturingOrder, cutoff); break;
        case 'maintenance_work_orders': count = await this.archiveClosed(this.prisma.maintenanceWorkOrder, cutoff); break;
        case 'notifications': count = await this.archiveNotifications(cutoff); break;
        default: throw new Error(`Unknown entity type: ${entityType}`);
      }
      const run = await this.prisma.archiveRun.create({
        data: { entityType, olderThan: cutoff, recordsCount: count, status: 'completed', triggeredBy },
      });
      this.logger.log(`Archived ${count} ${entityType} records`);
      return run;
    } catch (err: any) {
      this.logger.error(`Archive failed: ${err.message}`);
      return this.prisma.archiveRun.create({
        data: { entityType, olderThan: cutoff, recordsCount: 0, status: 'failed', error: err.message, triggeredBy },
      });
    }
  }

  private async archiveCompleted(model: any, cutoff: Date): Promise<number> {
    const result = await model.deleteMany({ where: { status: 'completed', updatedAt: { lt: cutoff } } });
    return result.count;
  }
  private async archiveClosed(model: any, cutoff: Date): Promise<number> {
    const result = await model.deleteMany({ where: { status: { in: ['closed', 'completed'] }, updatedAt: { lt: cutoff } } });
    return result.count;
  }
  private async archiveNotifications(cutoff: Date): Promise<number> {
    const result = await this.prisma.notification.deleteMany({ where: { isRead: true, createdAt: { lt: cutoff } } });
    return result.count;
  }
}
