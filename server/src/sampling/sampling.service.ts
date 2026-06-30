import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';
import { StatusMachineService } from '../common/services/status-machine.service';
import { SAMPLING_WO_TRANSITIONS } from '../common/services/status-transitions';
import { CreateSamplingOrderDto, UpdateSamplingOrderDto, ApproveOrderDto, AssignOrderDto } from './dto/sampling-order.dto';

@Injectable()
export class SamplingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
        private readonly sm: StatusMachineService,
  ) {}

  async create(dto: CreateSamplingOrderDto, orgId?: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const orderCode = await this.codingRule.generate('SAMPLING_WO');
        return await this.prisma.samplingWorkOrder.create({
          data: { ...dto, orderCode, deadline: new Date(dto.deadline) },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 2) continue;
        throw err;
      }
    }
    throw new Error('打样工单创建失败');
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.samplingWorkOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const order = await this.prisma.samplingWorkOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('打样工单不存在');
    return order;
  }

  async update(id: string, dto: UpdateSamplingOrderDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.deadline) data.deadline = new Date(dto.deadline);
    if (dto.status === 'in_progress' && !data.actualStartDate) {
      data.actualStartDate = new Date();
    }
    if (dto.status === 'completed') {
      data.actualEndDate = new Date();
    }
    return this.prisma.samplingWorkOrder.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.samplingWorkOrder.delete({ where: { id } });
  }

  async approve(id: string, dto: ApproveOrderDto) {
    const order = await this.findOne(id);
    this.sm.validateTransition(SAMPLING_WO_TRANSITIONS, order.status, 'approved');
    return this.prisma.samplingWorkOrder.update({
      where: { id },
      data: { status: 'approved', approver: dto.approver, approverComment: dto.comment || 'Approved', approvedAt: new Date() },
    });
  }

  async reject(id: string, dto: ApproveOrderDto) {
    const order = await this.findOne(id);
    this.sm.validateTransition(SAMPLING_WO_TRANSITIONS, order.status, 'rejected');
    return this.prisma.samplingWorkOrder.update({
      where: { id },
      data: { status: 'rejected', approver: dto.approver, approverComment: dto.comment || 'Rejected', approvedAt: new Date() },
    });
  }

  async assign(id: string, dto: AssignOrderDto) {
    const order = await this.findOne(id);
    this.sm.validateTransition(SAMPLING_WO_TRANSITIONS, order.status, 'assigned');
    return this.prisma.samplingWorkOrder.update({
      where: { id },
      data: { status: 'assigned', assignee: dto.assignee, assignedAt: new Date(), progressNote: dto.comment || null },
    });
  }

  async startProgress(id: string) {
    const order = await this.findOne(id);
    this.sm.validateTransition(SAMPLING_WO_TRANSITIONS, order.status, 'in_progress');
    return this.prisma.samplingWorkOrder.update({
      where: { id },
      data: { status: 'in_progress', actualStartDate: order.actualStartDate || new Date() },
    });
  }

  async pauseProgress(id: string, reason: string) {
    await this.findOne(id);
    return this.prisma.samplingWorkOrder.update({
      where: { id },
      data: { status: 'exception_paused', exceptionReason: reason },
    });
  }

  async completeProgress(id: string) {
    await this.findOne(id);
    return this.prisma.samplingWorkOrder.update({
      where: { id },
      data: { status: 'completed', actualEndDate: new Date() },
    });
  }

  async getStats() {
    const total = await this.prisma.samplingWorkOrder.count();
    const byStatus = await this.prisma.samplingWorkOrder.groupBy({
      by: ['status'], _count: { status: true },
    });
    const overdue = await this.prisma.samplingWorkOrder.count({
      where: { deadline: { lt: new Date() }, status: { notIn: ['completed', 'rejected'] } },
    });
    return { total, byStatus, overdue };
  }
}
