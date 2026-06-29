import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MrpService } from './mrp.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('mrp')
export class MrpController {
  constructor(private readonly s: MrpService) {}

  @RequirePermission('mrp', 'mrp:run')
  @Post('run')
  runMrp(@Body('createdBy') createdBy?: string) {
    return this.s.runMrp(createdBy);
  }

  @RequirePermission('mrp', 'mrp:read')
  @Get('runs')
  findAllRuns() {
    return this.s.findAllRuns();
  }

  @RequirePermission('mrp', 'mrp:read')
  @Get('runs/:id')
  findRunById(@Param('id') id: string) {
    return this.s.findRunById(id);
  }

  @RequirePermission('mrp', 'mrp:write')
  @Delete('runs/:id')
  deleteRun(@Param('id') id: string) {
    return this.s.deleteRun(id);
  }
}
