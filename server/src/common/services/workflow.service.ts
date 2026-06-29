import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface InitiateApprovalParams {
  module: string;
  docType: string;
  docId: string;
  docCode?: string;
  fromStatus: string;
  toStatus: string;
  requestedBy?: string;
}

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a workflow transition definition by module + state codes.
   */
  async findTransition(module: string, fromStatus: string, toStatus: string) {
    return this.prisma.adminWorkflowTransition.findFirst({
      where: {
        module,
        fromState: { stateCode: fromStatus },
        toState: { stateCode: toStatus },
      },
      include: { fromState: true, toState: true },
    });
  }

  /**
   * Initiate an approval request.
   * Validates that a workflow transition exists, then creates a pending ApprovalRecord.
   */
  async initiateApproval(params: InitiateApprovalParams) {
    const { module, docType, docId, docCode, fromStatus, toStatus, requestedBy } = params;

    const transition = await this.findTransition(module, fromStatus, toStatus);
    if (!transition) {
      throw new BadRequestException(
        `No workflow transition for '${module}': '${fromStatus}' -> '${toStatus}'`,
      );
    }

    const approvalCode =
      `APR-${module.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return this.prisma.approvalRecord.create({
      data: {
        approvalCode,
        module,
        docType,
        docId,
        docCode,
        fromStatus,
        toStatus,
        requestedBy,
        status: 'pending',
        transitionId: transition.id,
      },
      include: { transition: { include: { fromState: true, toState: true } } },
    });
  }

  /**
   * Approve a pending approval record.
   */
  async approve(approvalId: string, approver: string, comment?: string) {
    const record = await this.prisma.approvalRecord.findUnique({ where: { id: approvalId } });
    if (!record) throw new NotFoundException('Approval record not found');
    if (record.status !== 'pending') throw new BadRequestException('Approval already processed');

    return this.prisma.approvalRecord.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        decision: 'approved',
        approver,
        approvedAt: new Date(),
        comment: comment ?? record.comment,
      },
      include: { transition: { include: { fromState: true, toState: true } } },
    });
  }

  /**
   * Reject a pending approval record.
   */
  async reject(approvalId: string, approver: string, comment?: string) {
    const record = await this.prisma.approvalRecord.findUnique({ where: { id: approvalId } });
    if (!record) throw new NotFoundException('Approval record not found');
    if (record.status !== 'pending') throw new BadRequestException('Approval already processed');

    return this.prisma.approvalRecord.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        decision: 'rejected',
        approver,
        approvedAt: new Date(),
        comment: comment ?? record.comment,
      },
      include: { transition: { include: { fromState: true, toState: true } } },
    });
  }

  /**
   * Get pending approvals across all modules.
   */
  async getPendingApprovals() {
    return this.prisma.approvalRecord.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'desc' },
      include: { transition: { include: { fromState: true, toState: true } } },
    });
  }

  /**
   * Get approval history for a specific document.
   */
  async getApprovalHistory(docId: string) {
    return this.prisma.approvalRecord.findMany({
      where: { docId },
      orderBy: { requestedAt: 'desc' },
      include: { transition: { include: { fromState: true, toState: true } } },
    });
  }

  /**
   * Get a single approval record by id.
   */
  async getApproval(id: string) {
    const record = await this.prisma.approvalRecord.findUnique({
      where: { id },
      include: { transition: { include: { fromState: true, toState: true } } },
    });
    if (!record) throw new NotFoundException('Approval record not found');
    return record;
  }
}
