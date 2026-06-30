import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { FeishuService } from '../feishu/feishu.service';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class AdminExtendedController {
  constructor(
    private readonly adminService: AdminService,
    private readonly feishuService: FeishuService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('workflow/transitions/:module/:status')
  getAvailableTransitions(@Param('module') module: string, @Param('status') status: string) {
    return this.adminService.getAvailableTransitions(module, status);
  }

  @Public()
  @Post('workflow/execute')
  async executeTransition(@Body() dto: any) {
    const result = await this.adminService.executeTransition(dto);

    // 异步通知，不阻塞
    try {
      if (dto.docType === 'purchase_order') {
        const po = await this.prisma.purchaseOrder.findUnique({
          where: { id: dto.docId },
          include: { supplier: true, items: true },
        });
        if (po) {
          await this.feishuService.sendPurchaseStatusCard({
            orderCode: po.orderCode,
            supplierName: po.supplier?.supplierName || '',
            oldStatus: dto.fromStatus,
            newStatus: result.toStatus,
            totalAmount: po.totalAmount || 0,
            operator: dto.requestedBy,
            items: po.items?.map(it => ({
              materialName: it.materialName,
              quantity: it.quantity,
              unit: it.unit,
            })),
          });
        }
      } else {
        await this.feishuService.sendText(
          '[' + dto.docType + '] ' + (dto.docCode || '') + ': ' + dto.fromStatus + ' -> ' + result.toStatus
        );
      }
    } catch(e) { /* notification is best-effort */ }

    return result;
  }

  @Public()
  @Get('workflow/summary/:module')
  getWorkflowSummary(@Param('module') module: string) {
    return this.adminService.getWorkflowSummary(module);
  }
}
