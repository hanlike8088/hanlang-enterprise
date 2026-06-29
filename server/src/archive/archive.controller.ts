import { Controller, Get, Post, Body } from '@nestjs/common';
import { ArchiveService } from './archive.service';

@Controller('archives')
export class ArchiveController {
  constructor(private readonly svc: ArchiveService) {}
  @Get('runs') async listRuns() { return this.svc.listRuns(); }
  @Post('run') async archive(
    @Body() body: { entityType: string; olderThanMonths: number; triggeredBy?: string }
  ) { return this.svc.archive(body.entityType, body.olderThanMonths, body.triggeredBy); }
}
