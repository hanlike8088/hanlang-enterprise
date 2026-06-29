import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { CostService } from './cost.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('cost')
export class CostController {
  constructor(private readonly s: CostService) {}

  @RequirePermission('cost', 'cost:write')
  @Post('sheets') createSheet(@Body() dto: any) { return this.s.createCostSheet(dto); }

  @RequirePermission('cost', 'cost:read')
  @Get('sheets') findAllSheets(@Query('productId') pid?: string, @Query('period') period?: string) { return this.s.findAllSheets(pid, period); }

  @RequirePermission('cost', 'cost:read')
  @Get('sheets/:id') findOneSheet(@Param('id') id: string) { return this.s.findOneSheet(id); }

  @RequirePermission('cost', 'cost:write')
  @Delete('sheets/:id') deleteSheet(@Param('id') id: string) { return this.s.deleteSheet(id); }

  @RequirePermission('cost', 'cost:read')
  @Get('quick-compare') quickCompare(@Query('productId') pid: string) { return this.s.quickCompare(pid); }

  @RequirePermission('cost', 'cost:read')
  @Get('calculate-standard') calculateStandard(@Query('productId') pid: string) { return this.s.calculateStandardCost(pid); }

  @RequirePermission('cost', 'cost:read')
  @Get('trend') getCostTrend(
    @Query('productId') pid?: string,
    @Query('periodFrom') from?: string,
    @Query('periodTo') to?: string,
    @Query('limit') limit?: string,
  ) { return this.s.getCostTrend(pid, from, to, limit ? parseInt(limit) : 12); }

  @RequirePermission('cost', 'cost:read')
  @Get('price-history/:materialId') getPriceHistory(@Param('materialId') mid: string) { return this.s.getMaterialPriceHistory(mid); }

  @RequirePermission('cost', 'cost:read')
  @Get('summary') getCostSummary() { return this.s.getCostSummary(); }
}