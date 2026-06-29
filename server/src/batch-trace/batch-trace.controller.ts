import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { BatchTraceService } from './batch-trace.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('batch-trace')
export class BatchTraceController {
  constructor(private readonly s: BatchTraceService) {}

  @RequirePermission('batch-trace', 'batch-trace:write')
  @Post('batches')
  createBatch(@Body() dto: any) { return this.s.createBatch(dto); }

  @RequirePermission('batch-trace', 'batch-trace:read')
  @Get('batches')
  findAllBatches(@Query('materialId') mid?: string, @Query('keyword') kw?: string, @Query('status') st?: string) { return this.s.findAllBatches(mid, kw, st); }

  @RequirePermission('batch-trace', 'batch-trace:read')
  @Get('batches/:materialId/:batchNo')
  findOneBatch(@Param('materialId') mid: string, @Param('batchNo') bn: string) { return this.s.findOneBatch(mid, bn); }

  @RequirePermission('batch-trace', 'batch-trace:write')
  @Post('traces')
  addTrace(@Body() dto: any) { return this.s.addTrace(dto); }

  @RequirePermission('batch-trace', 'batch-trace:read')
  @Get('traces')
  getTraceChain(@Query('batchNo') bn?: string, @Query('materialId') mid?: string, @Query('sourceType') st?: string, @Query('sourceId') sid?: string) { return this.s.getTraceChain(bn, mid, st, sid); }

  @RequirePermission('batch-trace', 'batch-trace:read')
  @Get('traces/full/:batchNo')
  fullTrace(@Param('batchNo') bn: string) { return this.s.fullTrace(bn); }

  @RequirePermission('batch-trace', 'batch-trace:read')
  @Get('stats')
  getStats() { return this.s.getStats(); }
}
