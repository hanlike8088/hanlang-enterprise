import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('audit')
export class AuditController {
  constructor(
    private readonly s: AuditService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @RequirePermission('audit', 'audit:write')
  @Post('plans') createPlan(@Body() dto: any) { return this.s.createPlan(dto); }

  @RequirePermission('audit', 'audit:read')
  @Get('plans') findAllPlans(@Query('year') y?: string, @Query('status') st?: string) { return this.s.findAllPlans(y ? parseInt(y) : undefined, st); }

  @RequirePermission('audit', 'audit:read')
  @Get('plans/:id') findPlanById(@Param('id') id: string) { return this.s.findPlanById(id); }

  @RequirePermission('audit', 'audit:write')
  @Patch('plans/:id') updatePlan(@Param('id') id: string, @Body() dto: any) { return this.s.updatePlan(id, dto); }

  @RequirePermission('audit', 'audit:write')
  @Delete('plans/:id') deletePlan(@Param('id') id: string) { return this.s.deletePlan(id); }

  @RequirePermission('audit', 'audit:write')
  @Post('checklists') createChecklist(@Body() dto: any) { return this.s.createChecklist(dto); }

  @RequirePermission('audit', 'audit:read')
  @Get('checklists') findAllChecklists(@Query('planId') pid?: string) { return this.s.findAllChecklists(pid); }

  @RequirePermission('audit', 'audit:write')
  @Patch('checklists/:id') updateChecklist(@Param('id') id: string, @Body() dto: any) { return this.s.updateChecklist(id, dto); }

  @RequirePermission('audit', 'audit:write')
  @Delete('checklists/:id') deleteChecklist(@Param('id') id: string) { return this.s.deleteChecklist(id); }

  @RequirePermission('audit', 'audit:write')
  @Post('findings') createFinding(@Body() dto: any) { return this.s.createFinding(dto); }

  @RequirePermission('audit', 'audit:read')
  @Get('findings') findAllFindings(@Query('planId') pid?: string, @Query('status') st?: string, @Query('severity') sv?: string) { return this.s.findAllFindings(pid, st, sv); }

  @RequirePermission('audit', 'audit:write')
  @Patch('findings/:id') updateFinding(@Param('id') id: string, @Body() dto: any) { return this.s.updateFinding(id, dto); }

  @RequirePermission('audit', 'audit:write')
  @Delete('findings/:id') deleteFinding(@Param('id') id: string) { return this.s.deleteFinding(id); }

  @RequirePermission('audit', 'audit:read')
  @Get('stats') getAuditStats() { return this.s.getAuditStats(); }

  // ==================== System Audit Log (P8) ====================

  @RequirePermission('audit', 'audit:read')
  @Get('system-logs')
  async getSystemLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('username') username?: string
  ) {
    return this.auditLogService.findAll(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 50,
      { action, entity, username }
    );
  }

  @RequirePermission('audit', 'audit:read')
  @Get('system-logs/stats')
  async getSystemLogStats() {
    return this.auditLogService.getStats();
  }
}