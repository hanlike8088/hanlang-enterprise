import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { QualityService } from './quality.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('quality')
export class QualityController {
  constructor(private readonly svc: QualityService) {}

  // ========== 检验标准 ==========
  @RequirePermission('quality', 'standard:write')
  @Post('standards') 
  // ========== 质量目标 (P1-5) ==========
  @RequirePermission('quality', 'objective:write')
  @Post('objectives') createObjective(@Body() d: any) { return this.svc.createObjective(d); }
  @RequirePermission('quality', 'objective:read')
  @Get('objectives') getObjectives(@Query('year') y?: string, @Query('month') m?: string, @Query('category') c?: string, @Query('status') s?: string) { return this.svc.getObjectives(y ? parseInt(y) : undefined, m ? parseInt(m) : undefined, c, s); }
  @RequirePermission('quality', 'objective:read')
  @Get('objectives/:id') getObjective(@Param('id') id: string) { return this.svc.getObjective(id); }
  @RequirePermission('quality', 'objective:write')
  @Patch('objectives/:id') updateObjective(@Param('id') id: string, @Body() d: any) { return this.svc.updateObjective(id, d); }
  @RequirePermission('quality', 'objective:write')
  @Delete('objectives/:id') deleteObjective(@Param('id') id: string) { return this.svc.deleteObjective(id); }
  createStandard(@Body() d: any) { return this.svc.createStandard(d); }
  @RequirePermission('quality', 'standard:read')
  @Get('standards') getStandards(@Query('materialId') mid?: string) { return this.svc.getStandards(mid); }
  @RequirePermission('quality', 'standard:write')
  @Patch('standards/:id') updateStandard(@Param('id') id: string, @Body() d: any) { return this.svc.updateStandard(id, d); }
  @RequirePermission('quality', 'standard:write')
  @Delete('standards/:id') deleteStandard(@Param('id') id: string) { return this.svc.deleteStandard(id); }

  // ========== 来料检验 IQC ==========
  @RequirePermission('quality', 'incoming:write')
  @Post('incoming') createIncoming(@Body() d: any) { return this.svc.createIncoming(d); }
  @RequirePermission('quality', 'incoming:read')
  @Get('incoming') getIncomings(@Query('status') s?: string, @Query('purchaseOrderId') p?: string, @Query('keyword') k?: string) { return this.svc.getIncomings(s, p, k); }
  @RequirePermission('quality', 'incoming:read')
  @Get('incoming/stats') getIqcStats() { return this.svc.getIqcStats(); }
  @RequirePermission('quality', 'incoming:read')
  @Get('incoming/:id') getIncoming(@Param('id') id: string) { return this.svc.getIncoming(id); }
  @RequirePermission('quality', 'incoming:write')
  @Patch('incoming/:id') updateIncoming(@Param('id') id: string, @Body() d: any) { return this.svc.updateIncoming(id, d); }
  @RequirePermission('quality', 'incoming:write')
  @Post('incoming/:id/records') createRecord(@Param('id') id: string, @Body() d: any) { return this.svc.createRecord(id, d); }
  @RequirePermission('quality', 'incoming:write')
  @Post('incoming/:id/submit') submitInspection(@Param('id') id: string, @Body() d: { items: any[]; inspector: string }) { return this.svc.submitInspection(id, d.items, d.inspector); }
  @RequirePermission('quality', 'incoming:write')
  @Post('incoming/:id/disposition') createDisposition(@Param('id') id: string, @Body() d: any) { return this.svc.createDisposition(id, d); }

  // ========== 首件检验 IPQC ==========
  @RequirePermission('quality', 'firstpiece:write')
  @Post('first-piece') createFirstPiece(@Body() d: any) { return this.svc.createFirstPiece(d); }
  @RequirePermission('quality', 'firstpiece:read')
  @Get('first-piece') getFirstPieces(@Query('status') s?: string) { return this.svc.getFirstPieces(s); }
  @RequirePermission('quality', 'firstpiece:write')
  @Patch('first-piece/:id') updateFirstPiece(@Param('id') id: string, @Body() d: any) { return this.svc.updateFirstPiece(id, d); }

  // ========== 巡检 ==========
  @RequirePermission('quality', 'patrol:write')
  @Post('patrol-plans/generate') generatePatrolPlans(@Body() d: { days?: number }) { return this.svc.generatePatrolPlans(d.days || 7); }
  @RequirePermission('quality', 'patrol:read')
  @Get('patrol-plans') getPatrolPlans(@Query('status') s?: string, @Query('date') date?: string) { return this.svc.getPatrolPlans(s, date); }
  @RequirePermission('quality', 'patrol:read')
  @Get('patrol-plans/today') getTodayPatrolPlans() { return this.svc.getTodayPatrolPlans(); }
  @RequirePermission('quality', 'patrol:write')
  @Post('patrol-plans/:id/execute') executePatrolCheck(@Param('id') id: string, @Body() d: any) { return this.svc.executePatrolCheck(id, d); }
  @RequirePermission('quality', 'patrol:read')
  @Get('patrol-records') getPatrolRecords(@Query('planId') p?: string) { return this.svc.getPatrolRecords(p); }

  // ========== 出货检验 OQC ==========
  @RequirePermission('quality', 'outgoing:write')
  @Post('outgoing') createOutgoing(@Body() d: any) { return this.svc.createOutgoing(d); }
  @RequirePermission('quality', 'outgoing:read')
  @Get('outgoing') getOutgoings(@Query('status') s?: string, @Query('keyword') k?: string) { return this.svc.getOutgoings(s, k); }
  @RequirePermission('quality', 'outgoing:read')
  @Get('outgoing/:id') getOutgoing(@Param('id') id: string) { return this.svc.getOutgoing(id); }
  @RequirePermission('quality', 'outgoing:write')
  @Patch('outgoing/:id') updateOutgoing(@Param('id') id: string, @Body() d: any) { return this.svc.updateOutgoing(id, d); }

  // ========== NCR 不合格品 ==========
  @RequirePermission('quality', 'ncr:write')
  @Post('ncr') createNcr(@Body() d: any) { return this.svc.createNcr(d); }
  @RequirePermission('quality', 'ncr:read')
  @Get('ncr') getNcrs(@Query('status') s?: string, @Query('source') src?: string) { return this.svc.getNcrs(s, src); }
  @RequirePermission('quality', 'ncr:read')
  @Get('ncr/:id') getNcr(@Param('id') id: string) { return this.svc.getNcr(id); }
  @RequirePermission('quality', 'ncr:write')
  @Patch('ncr/:id/review') reviewNcr(@Param('id') id: string, @Body() d: any) { return this.svc.reviewNcr(id, d); }

  // ========== CAPA 纠正预防 ==========
  @RequirePermission('quality', 'capa:write')
  @Post('capa') createCapa(@Body() d: any) { return this.svc.createCapa(d); }
  @RequirePermission('quality', 'capa:read')
  @Get('capa') getCapas(@Query('ncrId') n?: string, @Query('status') s?: string) { return this.svc.getCapas(n, s); }
  @RequirePermission('quality', 'capa:write')
  @Patch('capa/:id') updateCapa(@Param('id') id: string, @Body() d: any) { return this.svc.updateCapa(id, d); }

  // ========== 量具/仪器 ==========
  @RequirePermission('quality', 'gauge:write')
  @Post('gauges') createGauge(@Body() d: any) { return this.svc.createGauge(d); }
  @RequirePermission('quality', 'gauge:read')
  @Get('gauges') getGauges(@Query('status') s?: string, @Query('keyword') k?: string) { return this.svc.getGauges(s, k); }
  @RequirePermission('quality', 'gauge:read')
  @Get('gauges/warnings') getGaugeWarnings() { return this.svc.getGaugeWarnings(); }
  @RequirePermission('quality', 'gauge:read')
  @Get('gauges/:id') getGauge(@Param('id') id: string) { return this.svc.getGauge(id); }
  @RequirePermission('quality', 'gauge:write')
  @Patch('gauges/:id') updateGauge(@Param('id') id: string, @Body() d: any) { return this.svc.updateGauge(id, d); }
  @RequirePermission('quality', 'gauge:write')
  @Delete('gauges/:id') deleteGauge(@Param('id') id: string) { return this.svc.deleteGauge(id); }
  @RequirePermission('quality', 'gauge:write')
  @Post('gauges/:id/calibrations') createCalibration(@Param('id') id: string, @Body() d: any) { return this.svc.createCalibration(id, d); }

  // ========== 品质统计 ==========
  @RequirePermission('quality', 'stats:read')
  @Get('stats') getQualityStats() { return this.svc.getQualityStats(); }
}