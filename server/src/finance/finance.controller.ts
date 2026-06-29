import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('finance')
export class FinanceController {
  constructor(private readonly s: FinanceService) {}
  @RequirePermission('finance', 'reconciliation:write')
  @Post('reconciliations') generateReconciliation(@Body('purchaseOrderId') poId: string, @Body('invoiceAmount') invAmt: number) { return this.s.generateReconciliation(poId, invAmt); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('reconciliations') findAllReconciliations(@Query('status') status?: string, @Query('supplierId') supplierId?: string) { return this.s.findAllReconciliations(status, supplierId); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('reconciliations/:id') findOneReconciliation(@Param('id') id: string) { return this.s.findOneReconciliation(id); }
  @RequirePermission('finance', 'reconciliation:write')
  @Post('reconciliations/:id/confirm') confirmReconciliation(@Param('id') id: string, @Body('confirmedBy') confirmedBy: string) { return this.s.confirmReconciliation(id, confirmedBy); }
  @RequirePermission('finance', 'reconciliation:read')
  
  @RequirePermission('finance', 'reconciliation:read')
  @Get('ap-from-k3')
  fetchApFromK3() { return this.s.fetchApFromK3(); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('aging') getAgingAnalysis() { return this.s.getAgingAnalysis(); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('differences') getDifferenceWarnings() { return this.s.getDifferenceWarnings(); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('stats') getStats() { return this.s.getStats(); }
  @RequirePermission('finance', 'payment:write')
  @Post('payments') createPayment(@Body() dto: any) { return this.s.createPayment(dto.reconciliationId, dto); }
  @RequirePermission('finance', 'payment:read')
  @Get('payments') getPayments(@Query('reconciliationId') rid?: string) { return this.s.getPayments(rid); }
  @RequirePermission('finance', 'payment:write')
  @Delete('payments/:id') removePayment(@Param('id') id: string) { return this.s.removePayment(id); }
  @RequirePermission('finance', 'reconciliation:write')
  @Post('reconciliations/:id/paid') markAsPaid(@Param('id') id: string) { return this.s.markAsPaid(id); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('payment-plan') getPaymentPlan() { return this.s.generatePaymentPlan(); }
  @RequirePermission('finance', 'reconciliation:read')
  @Get('statements/:supplierId') getStatement(@Param('supplierId') sid: string, @Query('period') period?: string) { return this.s.generateStatement(sid, period); }
}