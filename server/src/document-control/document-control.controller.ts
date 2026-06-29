import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { DocumentControlService } from './document-control.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('document-control')
export class DocumentControlController {
  constructor(private readonly s: DocumentControlService) {}

  @RequirePermission('document-control', 'document-control:write')
  @Post('approvals') createApproval(@Body() dto: any) { return this.s.createApproval(dto); }
  @RequirePermission('document-control', 'document-control:read')
  @Get('approvals') findAllApprovals(@Query('docType') dt?: string, @Query('docId') di?: string, @Query('decision') d?: string) { return this.s.findAllApprovals(dt, di, d); }
  @RequirePermission('document-control', 'document-control:write')
  @Patch('approvals/:id') approveDocument(@Param('id') id: string, @Body() dto: any) { return this.s.approveDocument(id, dto); }

  @RequirePermission('document-control', 'document-control:write')
  @Post('distributions') createDistribution(@Body() dto: any) { return this.s.createDistribution(dto); }
  @RequirePermission('document-control', 'document-control:read')
  @Get('distributions') findAllDistributions(@Query('docType') dt?: string, @Query('docId') di?: string, @Query('recipient') r?: string, @Query('status') st?: string) { return this.s.findAllDistributions(dt, di, r, st); }
  @RequirePermission('document-control', 'document-control:write')
  @Patch('distributions/:id/recall') recallDistribution(@Param('id') id: string) { return this.s.recallDistribution(id); }

  @RequirePermission('document-control', 'document-control:write')
  @Post('obsoletes') createObsolete(@Body() dto: any) { return this.s.createObsolete(dto); }
  @RequirePermission('document-control', 'document-control:read')
  @Get('obsoletes') findAllObsoletes(@Query('docType') dt?: string, @Query('docId') di?: string) { return this.s.findAllObsoletes(dt, di); }

  @RequirePermission('document-control', 'document-control:write')
  @Post('changes') createChangeRecord(@Body() dto: any) { return this.s.createChangeRecord(dto); }
  @RequirePermission('document-control', 'document-control:read')
  @Get('changes') findAllChanges(@Query('docType') dt?: string, @Query('docId') di?: string) { return this.s.findAllChanges(dt, di); }

  @RequirePermission('document-control', 'document-control:read')
  @Get('stats') getStats() { return this.s.getStats(); }
}
