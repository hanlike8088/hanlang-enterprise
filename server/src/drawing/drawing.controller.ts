import { Controller, Get, Post, Put, Delete, Param, Body, Query, Patch } from '@nestjs/common';
import { DrawingService } from './drawing.service';
import { CreateDrawingDto, NewDrawingVersionDto, UpdateDrawingDto } from './dto/drawing.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('drawings')
export class DrawingController {
  constructor(private readonly drawingService: DrawingService) {}

  @RequirePermission('drawing', 'drawing:read')
  @Get()
  findAll(@Query('productId') productId?: string, @Query('status') status?: string) {
    return this.drawingService.findAll(productId, status);
  }

  @RequirePermission('drawing', 'drawing:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drawingService.findOne(id);
  }

  @RequirePermission('drawing', 'drawing:write')
  @Post()
  create(@Body() dto: CreateDrawingDto) {
    return this.drawingService.create(dto);
  }

  @RequirePermission('drawing', 'drawing:write')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDrawingDto) {
    return this.drawingService.update(id, dto);
  }

  @RequirePermission('drawing', 'drawing:write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.drawingService.remove(id);
  }

  @RequirePermission('drawing', 'drawing:write')
  @Patch(':id/transition')
  transitionDrawing(@Param('id') id: string, @Body('status') status: string) {
    return this.drawingService.transitionDrawing(id, status);
  }

  @RequirePermission('drawing', 'drawing:write')
  @Post(':id/versions')
  addVersion(@Param('id') drawingId: string, @Body() dto: NewDrawingVersionDto) {
    return this.drawingService.addVersion(drawingId, dto);
  }

  @RequirePermission('drawing', 'drawing:read')
  @Get(':id/versions')
  getVersions(@Param('id') drawingId: string) {
    return this.drawingService.getVersions(drawingId);
  }

  @RequirePermission('drawing', 'drawing:read')
  @Get(':id/versions/compare')
  compareVersions(@Param('id') drawingId: string, @Query('v1') v1: string, @Query('v2') v2: string) {
    return this.drawingService.compareVersions(drawingId, v1, v2);
  }
}
