import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ErpService } from './erp.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/create-material.dto';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/create-work-order.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('erp')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  @RequirePermission('erp', 'material:write')
  @Post('sync-materials-from-k3')
  syncMaterialsFromK3() { return this.erpService.syncMaterialsFromK3(); }

  @RequirePermission('erp', 'material:read')
  @Get('materials')
  getMaterials(@Query('keyword') keyword?: string) {
    return this.erpService.getMaterials(keyword);
  }

  @RequirePermission('erp', 'material:read')
  @Get('materials/:id')
  getMaterial(@Param('id') id: string) {
    return this.erpService.getMaterial(id);
  }

  @RequirePermission('erp', 'material:write')
  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.erpService.createMaterial(dto);
  }

  @RequirePermission('erp', 'material:write')
  @Patch('materials/:id')
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.erpService.updateMaterial(id, dto);
  }

  @RequirePermission('erp', 'material:write')
  @Delete('materials/:id')
  deleteMaterial(@Param('id') id: string) {
    return this.erpService.deleteMaterial(id);
  }

  @RequirePermission('erp', 'material:write')
  @Patch('materials/:id/transition')
  transitionMaterial(@Param('id') id: string, @Body('status') status: string) {
    return this.erpService.transitionMaterial(id, status);
  }

  @RequirePermission('erp', 'work-order:read')
  @Get('work-orders')
  getWorkOrders(@Query('status') status?: string) {
    return this.erpService.getWorkOrders(status);
  }

  @RequirePermission('erp', 'work-order:read')
  @Get('work-orders/:id')
  getWorkOrder(@Param('id') id: string) {
    return this.erpService.getWorkOrder(id);
  }

  @RequirePermission('erp', 'work-order:write')
  @Post('work-orders')
  createWorkOrder(@Body() dto: CreateWorkOrderDto) {
    return this.erpService.createWorkOrder(dto);
  }

  @RequirePermission('erp', 'work-order:write')
  @Patch('work-orders/:id')
  updateWorkOrder(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.erpService.updateWorkOrder(id, dto);
  }

  @RequirePermission('erp', 'work-order:write')
  @Delete('work-orders/:id')
  deleteWorkOrder(@Param('id') id: string) {
    return this.erpService.deleteWorkOrder(id);
  }

  @RequirePermission('erp', 'work-order:write')
  @Patch('work-orders/:id/transition')
  transitionWorkOrder(@Param('id') id: string, @Body('status') status: string) {
    return this.erpService.transitionWorkOrder(id, status);
  }
}