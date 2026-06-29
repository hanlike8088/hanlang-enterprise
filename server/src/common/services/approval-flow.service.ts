import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from './event-bus.service';
import { StatusMachineService } from './status-machine.service';

@Injectable()
export class ApprovalFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly statusMachine: StatusMachineService,
  ) {}

  async createApproval(params: {
    module: string;
    docType: string;
    docId: string;
    docCode?: string;
    fromStatus: string;
    toStatus: string;
    requestedBy?: string;
  }) {
    const transition = await this.prisma.adminWorkflowTransition.findFirst({
      where: {
        module: params.module,
        fromState: { stateCode: params.fromStatus },
        toState: { stateCode: params.toStatus },
      },
    });
    const code = await this._generateCode(params.module);
    return this.prisma.approvalRecord.create({
      data: {
        approvalCode: code,
        module: params.module,
        docType: params.docType,
        docId: params.docId,
        docCode: params.docCode,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        requestedBy: params.requestedBy,
        status: 'pending',
        transitionId: transition?.id || '',
      },
    });
  }

  async approve(approvalId: string, approver: string, comment?: string) {
    const record = await this.prisma.approvalRecord.update({
      where: { id: approvalId },
      data: { status: 'approved', approver, comment, approvedAt: new Date() },
    });
    await this.eventBus.emit('approval:approved', {
      approvalId: record.id,
      module: record.module,
      docId: record.docId,
      docCode: record.docCode,
      toStatus: record.toStatus,
    }, 'approval:' + record.module);
    return record;
  }

  async reject(approvalId: string, approver: string, comment?: string) {
    return this.prisma.approvalRecord.update({
      where: { id: approvalId },
      data: { status: 'rejected', approver, comment, approvedAt: new Date() },
    });
  }

  async getPendingApprovals(module?: string) {
    const where: any = { status: 'pending' };
    if (module) where.module = module;
    return this.prisma.approvalRecord.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getHistory(module?: string, limit = 50) {
    const where: any = {};
    if (module) where.module = module;
    return this.prisma.approvalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async _generateCode(module: string): Promise<string> {
    const prefix = module.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const count = await this.prisma.approvalRecord.count({
      where: { module, createdAt: { gte: new Date(year, 0, 1) } },
    });
    return prefix + '-APR-' + year + '-' + String(count + 1).padStart(4, '0');
  }
}
