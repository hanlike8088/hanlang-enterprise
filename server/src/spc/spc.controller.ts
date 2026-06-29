import { RequirePermission } from '../common/guards/permission.guard';
import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { SpcService } from './spc.service';
@Controller('spc')
export class SpcController {
  constructor(private readonly spcService: SpcService) {}
  // ========== Study CRUD ==========
  @RequirePermission('quality', 'spc:write')
  @Post('studies')
  async createStudy(@Body() body: any, @Req() req: any) {
    try {
      const user = req.user || {};
      return await this.spcService.createStudy({
        ...body,
        createdBy: user.name || user.username || 'system',
      });
    } catch (err) {
      throw new HttpException(err.message || '创建SPC研究失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @RequirePermission('quality', 'spc:read')
  @Get('studies')
  async getStudies(@Query('chartType') chartType?: string, @Query('status') status?: string, @Query('keyword') keyword?: string) {
    return this.spcService.getStudies(chartType, status, keyword);
  }
  @RequirePermission('quality', 'spc:read')
  @Get('studies/:id')
  async getStudy(@Param('id') id: string) {
    return this.spcService.getStudy(id);
  }
  @RequirePermission('quality', 'spc:write')
  @Put('studies/:id')
  async updateStudy(@Param('id') id: string, @Body() body: any) {
    return this.spcService.updateStudy(id, body);
  }
  @RequirePermission('quality', 'spc:write')
  @Delete('studies/:id')
  async deleteStudy(@Param('id') id: string) {
    return this.spcService.deleteStudy(id);
  }
  // ========== Measurements ==========
  @RequirePermission('quality', 'spc:write')
  @Post('studies/:id/measurements')
  async addMeasurement(@Param('id') studyId: string, @Body() body: any, @Req() req: any) {
    const user = req.user || {};
    return this.spcService.addMeasurement(studyId, {
      ...body,
      measuredBy: user.name || user.username || 'system',
    });
  }
  @RequirePermission('quality', 'spc:write')
  @Post('studies/:id/measurements/batch')
  async addMeasurementsBatch(@Param('id') studyId: string, @Body() body: any, @Req() req: any) {
    return this.spcService.addMeasurementsBatch(studyId, body.measurements || []);
  }
  @RequirePermission('quality', 'spc:read')
  @Get('studies/:id/measurements')
  async getMeasurements(@Param('id') studyId: string, @Query('subgroupNo') subgroupNo?: string) {
    return this.spcService.getMeasurements(studyId, subgroupNo ? parseInt(subgroupNo) : undefined);
  }
  @RequirePermission('quality', 'spc:write')
  @Delete('measurements/:id')
  async deleteMeasurement(@Param('id') id: string) {
    return this.spcService.deleteMeasurement(id);
  }
  // ========== Chart Computation ==========
  @RequirePermission('quality', 'spc:read')
  @Get('studies/:id/chart')
  async computeChart(@Param('id') studyId: string) {
    return this.spcService.computeChart(studyId);
  }
}