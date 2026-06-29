import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class DocumentControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  // ===== Document Approval =====
  async createApproval(data: {
    docType: string;
    docId: string;
    docCode?: string;
    docName: string;
    action?: string;
    requestedBy?: string;
    approver?: string;
    comment?: string;
  }) {
    const code = await this.codingRule.generate('DOC_APPROVAL');
    return this.prisma.documentApproval.create({ data: { ...data, approvalCode: code } });
  }

  async findAllApprovals(docType?: string, docId?: string, decision?: string) {
    const where: any = {};
    if (docType) where.docType = docType;
    if (docId) where.docId = docId;
    if (decision) where.decision = decision;
    return this.prisma.documentApproval.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  async approveDocument(id: string, dto: { approver: string; decision: string; comment?: string }) {
    return this.prisma.documentApproval.update({
      where: { id },
      data: { approver: dto.approver, decision: dto.decision, comment: dto.comment, approvedAt: new Date() },
    });
  }

  // ===== Document Distribution =====
  async createDistribution(data: {
    docType: string;
    docId: string;
    docName: string;
    recipient: string;
    recipientOrg?: string;
    createdBy?: string;
    remark?: string;
  }) {
    const code = await this.codingRule.generate('DOC_DIST');
    return this.prisma.documentDistribution.create({ data: { ...data, distributeCode: code } });
  }

  async findAllDistributions(docType?: string, docId?: string, recipient?: string, status?: string) {
    const where: any = {};
    if (docType) where.docType = docType;
    if (docId) where.docId = docId;
    if (recipient) where.recipient = recipient;
    if (status) where.status = status;
    return this.prisma.documentDistribution.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  async recallDistribution(id: string) {
    return this.prisma.documentDistribution.update({
      where: { id },
      data: { status: 'recalled', recalledAt: new Date() },
    });
  }

  // ===== Document Obsolete =====
  async createObsolete(data: {
    docType: string;
    docId: string;
    docName: string;
    replacedBy?: string;
    reason?: string;
    approvedBy?: string;
    remark?: string;
  }) {
    const code = await this.codingRule.generate('DOC_OBSOLETE');
    return this.prisma.documentObsolete.create({ data: { ...data, obsoleteCode: code } });
  }

  async findAllObsoletes(docType?: string, docId?: string) {
    const where: any = {};
    if (docType) where.docType = docType;
    if (docId) where.docId = docId;
    return this.prisma.documentObsolete.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  // ===== Document Change Record =====
  async createChangeRecord(data: {
    docType: string;
    docId: string;
    docName: string;
    changeType?: string;
    fromVersion?: string;
    toVersion?: string;
    changeNote: string;
    changedBy?: string;
    approvedBy?: string;
  }) {
    const code = await this.codingRule.generate('DOC_CHANGE');
    return this.prisma.documentChangeRecord.create({ data: { ...data, changeCode: code } });
  }

  async findAllChanges(docType?: string, docId?: string) {
    const where: any = {};
    if (docType) where.docType = docType;
    if (docId) where.docId = docId;
    return this.prisma.documentChangeRecord.findMany({
      where, orderBy: { changedAt: 'desc' }, take: 200,
    });
  }

  // ===== Stats =====
  async getStats() {
    const [approvalCount, distCount, obsoleteCount, changeCount, pendingApprovals] = await Promise.all([
      this.prisma.documentApproval.count(),
      this.prisma.documentDistribution.count(),
      this.prisma.documentObsolete.count(),
      this.prisma.documentChangeRecord.count(),
      this.prisma.documentApproval.count({ where: { decision: 'pending' } }),
    ]);
    return { approvalCount, distCount, obsoleteCount, changeCount, pendingApprovals };
  }
}
