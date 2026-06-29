import { Controller, Get, Post, Body, HttpException, Logger, NotFoundException, Query } from '@nestjs/common';
import { K3CloudService } from './k3cloud.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequirePermission } from '../common/guards/permission.guard';

const logger = new Logger('K3CloudWrite');

function mustConfirm(dto: any, action: string) {
  if (dto.confirmed !== true) {
    logger.warn(`写操作未确认: ${action}`);
    throw new HttpException({
      message: `写操作需要确认。请添加 confirmed: true。如需试运行请使用 /dry-run 端点。操作: ${action}`,
      dryRunAvailable: true,
      action: action,
    }, 428);
  }
  logger.log(`执行写操作: ${action}`);
}

@Controller('k3cloud')
export class K3CloudController {
  constructor(private readonly k3: K3CloudService, private readonly prisma: PrismaService) {}

  @RequirePermission('k3cloud', 'view')
  @Get('login')
  async getLoginInfo() { return this.k3.getLoginInfo(); }

  @RequirePermission('k3cloud', 'view')
  @Get('materials')
  async getMaterials(@Query('startRow') startRow?: string) { return this.k3.getMaterials(undefined, parseInt(startRow || '0')); }

  @RequirePermission('k3cloud', 'view')
  @Get('departments')
  async getDepartments() { return this.k3.getDepartments(); }

  @RequirePermission('k3cloud', 'view')
  @Get('boms')
  async getBoms() { return this.k3.getBoms(); }

  @RequirePermission('k3cloud', 'view')
  @Get('work-orders')
  async getWorkOrders() { return this.k3.getWorkOrders(); }

  @RequirePermission('k3cloud', 'view')
  @Get('customers')
  async getCustomers() { return this.k3.getCustomers(); }

  @RequirePermission('k3cloud', 'view')
  @Get('query')
  async query(@Query('formId') formId: string, @Query('fields') fields: string, @Query('filter') filter: string) {
    return this.k3.executeBillQuery(formId, fields || 'FNumber,FName', filter || '', 500);
  }

  @RequirePermission('k3cloud', 'view')
  @Get('suppliers')
  async getSuppliers() { return this.k3.getSuppliers(); }

  // ---- 单据操作 ----
  @RequirePermission('k3cloud', 'view')
  @Post('view')
  async view(@Body() dto: { formId: string; number?: string; id?: string }) {
    return this.k3.view(dto.formId, dto.number, dto.id);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('save/dry-run')
  async saveDryRun(@Body() dto: { formId: string; model: any }) {
    return { message: 'dry-run 通过，参数正确', formId: dto.formId, model: dto.model };
  }

  @RequirePermission('k3cloud', 'write')
  @Post('save')
  async save(@Body() dto: { formId: string; model: any; needUpDateFields?: string[]; confirmed?: boolean }) {
    mustConfirm(dto, 'save ' + dto.formId);
    return this.k3.save(dto.formId, dto.model, dto.needUpDateFields);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('submit')
  async submit(@Body() dto: { formId: string; numbers: string[]; confirmed?: boolean }) {
    mustConfirm(dto, 'submit ' + dto.formId);
    return this.k3.submit(dto.formId, dto.numbers);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('audit')
  async audit(@Body() dto: { formId: string; numbers: string[]; confirmed?: boolean }) {
    mustConfirm(dto, 'audit ' + dto.formId);
    return this.k3.audit(dto.formId, dto.numbers);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('unaudit')
  async unAudit(@Body() dto: { formId: string; numbers: string[]; confirmed?: boolean }) {
    mustConfirm(dto, 'unaudit ' + dto.formId);
    return this.k3.unAudit(dto.formId, dto.numbers);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('delete')
  async delete(@Body() dto: { formId: string; numbers: string[]; confirmed?: boolean }) {
    mustConfirm(dto, 'delete ' + dto.formId);
    return this.k3.delete(dto.formId, dto.numbers);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('batch-save')
  async batchSave(@Body() dto: { formId: string; models: any[]; batchCount?: number; confirmed?: boolean }) {
    mustConfirm(dto, 'batch-save ' + dto.formId);
    return this.k3.batchSave(dto.formId, dto.models, dto.batchCount);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('create-material')
  async createMaterial(@Body() dto: { FNumber: string; FName: string; FSpecification?: string; confirmed?: boolean }) {
    mustConfirm(dto, 'create-material');
    return this.k3.createMaterial(dto);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('create-work-order')
  async createWorkOrder(@Body() dto: { FBillNo?: string; FQty: number; FMaterialId: { FNumber: string }; confirmed?: boolean }) {
    mustConfirm(dto, 'create-work-order');
    return this.k3.createWorkOrder(dto);
  }

  @RequirePermission('k3cloud', 'write')
  @Post('sync-ap')
  async syncAp(@Body() dto: { reconciliationId: string; confirmed?: boolean }) {
    mustConfirm(dto, 'sync-ap 同步应付账款到金蝶');
    const rec = await this.prisma.apReconciliation.findUnique({
      where: { id: dto.reconciliationId },
      include: { supplier: true, payments: true },
    });
    if (!rec) throw new NotFoundException('对账记录不存在');

    const model = {
      FBillNo: rec.reconCode,
      FDate: rec.confirmedAt || rec.createdAt,
      FSupplierId: { FNumber: rec.supplier.supplierCode },
      FAmountFor: rec.invoiceAmount,
      FAmount: rec.invoiceAmount - (rec.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0),
      FPAYAMOUNTFOR: rec.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0,
      FREMARK: '三单匹配同步 - 订单金额:' + rec.orderAmount + ' 入库金额:' + rec.receiptAmount + ' 发票金额:' + rec.invoiceAmount,
    };

    const result = await this.k3.save('AP_OtherPayable', model);
    logger.log('应付账款已同步至金蝶: ' + rec.reconCode);
    return { message: '同步成功', reconCode: rec.reconCode, k3Result: result };
  }
}