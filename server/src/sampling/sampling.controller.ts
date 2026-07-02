import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { SamplingService } from './sampling.service';
import { CreateSamplingOrderDto, UpdateSamplingOrderDto, ApproveOrderDto, AssignOrderDto } from './dto/sampling-order.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('sampling')
export class SamplingController {
  constructor(private readonly samplingService: SamplingService) {}

  @RequirePermission('sampling', 'order:write')
  @Post() create(@Body() dto: CreateSamplingOrderDto, @Req() req: any) { return this.samplingService.create(dto, req.user?.orgId); }
  @RequirePermission('sampling', 'order:read')
  @Get() findAll(@Req() req: any, @Query('status') status?: string) { return this.samplingService.findAll(status); }
  @RequirePermission('sampling', 'order:read')
  @Get('stats') getStats() { return this.samplingService.getStats(); }
  @RequirePermission('sampling', 'order:read')
  @Get(':id') findOne(@Param('id') id: string) { return this.samplingService.findOne(id); }
  @RequirePermission('sampling', 'order:write')
  @Put(':id') update(@Param('id') id: string, @Body() dto: UpdateSamplingOrderDto) { return this.samplingService.update(id, dto); }
  @RequirePermission('sampling', 'order:write')
  @Delete(':id') delete(@Param('id') id: string) { return this.samplingService.delete(id); }
  @RequirePermission('sampling', 'order:write')
  @Post(':id/approve') approve(@Param('id') id: string, @Body() dto: ApproveOrderDto) { return this.samplingService.approve(id, dto); }
  @RequirePermission('sampling', 'order:write')
  @Post(':id/reject') reject(@Param('id') id: string, @Body() dto: ApproveOrderDto) { return this.samplingService.reject(id, dto); }
  @RequirePermission('sampling', 'order:write')
  @Post(':id/assign') assign(@Param('id') id: string, @Body() dto: AssignOrderDto) { return this.samplingService.assign(id, dto); }
  @RequirePermission('sampling', 'order:write')
  @Post(':id/start') startProgress(@Param('id') id: string) { return this.samplingService.startProgress(id); }
  @RequirePermission('sampling', 'order:write')
  @Post(':id/pause') pauseProgress(@Param('id') id: string, @Body('reason') reason: string) { return this.samplingService.pauseProgress(id, reason); }
  @RequirePermission('sampling', 'order:write')
  @Post(':id/complete') completeProgress(@Param('id') id: string) { return this.samplingService.completeProgress(id); }
}