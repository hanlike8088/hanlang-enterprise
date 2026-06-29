import { Controller, Get, Query, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TraceService } from './trace.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private traceService: TraceService,
  ) {}

  @RequirePermission('dashboard', 'view')
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @RequirePermission('dashboard', 'view')
  @Get('comprehensive')
  getComprehensive() {
    return this.dashboardService.getStats();
  }

  @RequirePermission('dashboard', 'view')
  @Get('trace')
  trace(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.traceService.trace(entityType, entityId);
  }

  @RequirePermission('dashboard', 'view')
  @Get('event-chain')
  getEventChain() {
    return this.dashboardService.getEventChain();
  }

  @RequirePermission('dashboard', 'view')
  @Get('module/:module')
  getModuleDetail(@Param('module') module: string) {
    return this.dashboardService.getModuleDetail(module);
  }
  @RequirePermission('dashboard', 'view')
  @Get('finance')
  getFinanceDashboard() {
    return this.dashboardService.getFinanceDashboard();
  }

  @RequirePermission('dashboard', 'view')
  @Get('supply-chain')
  getSupplyChainOverview() {
    return this.dashboardService.getSupplyChainOverview();
  }

 @RequirePermission('dashboard', 'view')
 @Get('order-chain/:orderId')
 getOrderChain(@Param('orderId') orderId: string) {
    return this.traceService.traceOrderFullChain(orderId);
  }

  @RequirePermission('dashboard', 'view')
  @Get('quality-kpi')
  getQualityKpiDashboard() {
    return this.dashboardService.getQualityKpiDashboard();
  }

  @RequirePermission('dashboard', 'view')
  @Get('management-review')
  getManagementReviewSummary() {
    return this.dashboardService.getManagementReviewSummary();
  }
}
