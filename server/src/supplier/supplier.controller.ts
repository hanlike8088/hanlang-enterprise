import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly s: SupplierService) {}

  @RequirePermission('supplier', 'supplier:write')
  @Post()
  create(@Body() dto: any) { return this.s.create(dto); }

  @RequirePermission('supplier', 'supplier:read')
  @Get()
  findAll(@Query('category') category?: string, @Query('status') status?: string, @Query('keyword') keyword?: string) {
    return this.s.findAll(category, status, keyword);
  }

  @RequirePermission('supplier', 'supplier:read')
  @Get('stats')
  getStats() { return this.s.getStats(); }

  @RequirePermission('supplier', 'supplier:read')
  @Get(':id')
  findOne(@Param('id') id: string) { return this.s.findOne(id); }

  @RequirePermission('supplier', 'supplier:write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.s.update(id, dto); }

  @RequirePermission('supplier', 'supplier:write')
  @Delete(':id')
  remove(@Param('id') id: string) { return this.s.remove(id); }

  @RequirePermission('supplier', 'supplier:write')
  @Post('sync-from-k3')
  syncFromK3() { return this.s.syncFromK3(); }

  @RequirePermission('supplier', 'qcds:write')
  @Post(':id/qcds')
  createQcds(@Param('id') id: string, @Body() dto: any) { return this.s.createQcdsScore(id, dto); }

  @RequirePermission('supplier', 'qcds:read')
  @Get(':id/qcds')
  getQcds(@Param('id') id: string) { return this.s.getQcdsScores(id); }

  @RequirePermission('supplier', 'approval:write')
  @Post(':id/approvals')
  createApproval(@Param('id') id: string, @Body() dto: any) { return this.s.createApproval(id, dto); }

  @RequirePermission('supplier', 'approval:read')
  @Get('approvals/:id/review')
  getApprovals(@Query('supplierId') supplierId?: string) { return this.s.getApprovals(supplierId); }

  @RequirePermission('supplier', 'approval:write')
  @Patch('approvals/:id/review')
  reviewApproval(@Param('id') id: string, @Body() dto: any) { return this.s.reviewApproval(id, dto); }
}