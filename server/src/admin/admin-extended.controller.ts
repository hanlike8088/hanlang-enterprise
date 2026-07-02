import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminExtendedController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get('workflow/transitions/:module/:status')
  getAvailableTransitions(@Param('module') module: string, @Param('status') status: string) {
    return this.adminService.getAvailableTransitions(module, status);
  }

  @Public()
  @Post('workflow/execute')
  executeTransition(@Body() dto: any) {
    return this.adminService.executeTransition(dto);
  }

  @Public()
  @Get('workflow/summary/:module')
  getWorkflowSummary(@Param('module') module: string) {
    return this.adminService.getWorkflowSummary(module);
  }
}
