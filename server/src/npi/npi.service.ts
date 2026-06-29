import { Injectable, NotFoundException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { NPI_PROJECT_TRANSITIONS, NPI_TRIAL_TRANSITIONS,
       NPI_ISSUE_TRANSITIONS, NPI_APPROVAL_TRANSITIONS } from '../common/services/status-transitions';
import { EventBusService } from '../common/services/event-bus.service';
import { CrossModuleEvents } from '../common/services/event-types';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { CreateTrialRunDto, UpdateTrialRunDto } from './dto/create-trial-run.dto';
import { CreateIssueDto, UpdateIssueDto } from './dto/create-issue.dto';
import { CreateApprovalDto, ReviewApprovalDto } from './dto/create-approval.dto';

@Injectable()
export class NpiService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
    private readonly sm: StatusMachineService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit() {
    // Chain 1: CRM Order Confirmed -> create NPI project for tech review
    this.eventBus.on(CrossModuleEvents.CRM_ORDER_CONFIRMED,
      async (event) => { await this.handleCrmOrderConfirmed(event.data); });
  }

  private async handleCrmOrderConfirmed(data: any) {
    if (!data.productId) return;
    const projectCode = await this.codingRule.generate('NPI_PROJECT');
    await this.prisma.npiProject.create({
      data: {
        projectCode,
        projectName: `Tech Review - ${data.productName || data.productId}`,
        productId: data.productId,
        status: 'Draft',
        priority: 'Medium',
        startDate: new Date(),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: `Order "${data.orderCode}" confirmed, tech review needed. Customer: ${data.customerName || ''}`,
      },
    });
  }

  // ---- Projects ----
  async createProject(dto: CreateProjectDto) {
    const projectCode = await this.codingRule.generate('NPI_PROJECT');
    return this.prisma.npiProject.create({
      data: { ...dto, projectCode, startDate: new Date(dto.startDate), targetDate: new Date(dto.targetDate) },
    });
  }

  async getProjects() {
    return this.prisma.npiProject.findMany({ orderBy: { createdAt: 'desc' }, include: { trialRuns: true, approvals: true } });
  }

  async transitionProject(id: string, nextStatus: string) {
    const project = await this.getProject(id);
    this.sm.validateTransition(NPI_PROJECT_TRANSITIONS, project.status, nextStatus);
    const result = await this.prisma.npiProject.update({
      where: { id },
      data: { status: nextStatus },
      include: { trialRuns: true, approvals: true },
    });

    // Chain 2: NPI Project Review Passed -> CRM quote
    if (nextStatus === 'ReviewPassed' || nextStatus === 'MassProduction') {
      await this.eventBus.emit(CrossModuleEvents.NPI_PROJECT_REVIEW_PASSED, {
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        productId: project.productId,
        status: nextStatus,
      }, 'npi');
    }

    return result;
  }

  async getProject(id: string) {
    const project = await this.prisma.npiProject.findUnique({
      where: { id },
      include: { trialRuns: true, approvals: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    await this.getProject(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.targetDate) data.targetDate = new Date(dto.targetDate);
    if (dto.actualEndDate) data.actualEndDate = new Date(dto.actualEndDate);
    return this.prisma.npiProject.update({ where: { id }, data });
  }

  async deleteProject(id: string) {
    await this.getProject(id);
    return this.prisma.npiProject.delete({ where: { id } });
  }

  // ---- Trial Runs ----
  async createTrialRun(dto: CreateTrialRunDto) {
    await this.getProject(dto.projectId);
    const trialCode = await this.codingRule.generate('NPI_TRIAL');
    return this.prisma.npiTrialRun.create({
      data: { ...dto, trialCode, startDate: new Date(dto.startDate), endDate: dto.endDate ? new Date(dto.endDate) : null },
    });
  }

  async getTrialRuns(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.npiTrialRun.findMany({ where, orderBy: { createdAt: 'desc' }, include: { issues: true } });
  }

  async transitionTrialRun(id: string, nextStatus: string) {
    const tr = await this.getTrialRun(id);
    this.sm.validateTransition(NPI_TRIAL_TRANSITIONS, tr.status, nextStatus);
    return this.prisma.npiTrialRun.update({
      where: { id },
      data: { status: nextStatus },
      include: { issues: true },
    });
  }

  async getTrialRun(id: string) {
    const tr = await this.prisma.npiTrialRun.findUnique({ where: { id }, include: { issues: true } });
    if (!tr) throw new NotFoundException('Trial run not found');
    return tr;
  }

  async updateTrialRun(id: string, dto: UpdateTrialRunDto) {
    await this.getTrialRun(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.npiTrialRun.update({ where: { id }, data });
  }

  // ---- Issues ----
  async createIssue(dto: CreateIssueDto) {
    await this.getTrialRun(dto.trialRunId);
    const issueCode = await this.codingRule.generate('NPI_ISSUE');
    return this.prisma.npiIssue.create({ data: { ...dto, issueCode } });
  }

  async getIssues(trialRunId?: string) {
    const where = trialRunId ? { trialRunId } : {};
    return this.prisma.npiIssue.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async transitionIssue(id: string, nextStatus: string) {
    const issue = await this.getIssue(id);
    this.sm.validateTransition(NPI_ISSUE_TRANSITIONS, issue.status, nextStatus);
    const data: any = { status: nextStatus };
    if (nextStatus === 'Resolved' && !issue.resolvedAt) {
      data.resolvedAt = new Date();
    }
    return this.prisma.npiIssue.update({ where: { id }, data });
  }

  async getIssue(id: string) {
    const issue = await this.prisma.npiIssue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async updateIssue(id: string, dto: UpdateIssueDto) {
    await this.getIssue(id);
    const data: any = { ...dto };
    if (dto.status === 'Resolved' && !data.resolvedAt) {
      data.resolvedAt = new Date();
    }
    return this.prisma.npiIssue.update({ where: { id }, data });
  }

  // ---- Approvals ----
  async createApproval(dto: CreateApprovalDto) {
    await this.getProject(dto.projectId);
    return this.prisma.npiApproval.create({ data: dto });
  }

  async getApprovals(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.npiApproval.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async transitionApproval(id: string, nextStatus: string, approver?: string, comment?: string) {
    const approval = await this.prisma.npiApproval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    this.sm.validateTransition(NPI_APPROVAL_TRANSITIONS, approval.status, nextStatus);
    return this.prisma.npiApproval.update({
      where: { id },
      data: { status: nextStatus, approver: approver || null, comment: comment || null, decidedAt: new Date() },
    });
  }

  async reviewApproval(id: string, dto: ReviewApprovalDto) {
    const approval = await this.prisma.npiApproval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    return this.prisma.npiApproval.update({
      where: { id },
      data: { status: dto.status, comment: dto.comment, approver: dto.approver, decidedAt: new Date() },
    });
  }
}
