import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly s: EquipmentService) {}

  // ==================== Module 1: 设备台账 ====================
  @RequirePermission('equipment', 'equipment:write')
  @Post()
  createEquipment(@Body() dto: any) { return this.s.createEquipment(dto); }

  @RequirePermission('equipment', 'equipment:read')
  @Get('stats')
  getStats() { return this.s.getEquipmentStats(); }

  @RequirePermission('equipment', 'equipment:read')
  @Get('patents')
  getPatents() { return this.s.getPatents(); }

  @RequirePermission('equipment', 'equipment:write')
  @Patch('documents/:docId')
  updateDocument(@Param('docId') id: string, @Body() dto: any) { return this.s.updateDocument(id, dto); }

  @RequirePermission('equipment', 'equipment:write')
  @Delete('documents/:docId')
  deleteDocument(@Param('docId') id: string) { return this.s.deleteDocument(id); }

  // ==================== Module 2: TPM点检 ====================
  @RequirePermission('equipment', 'check:write')
  @Patch('check-standards/:stdId')
  updateCheckStandard(@Param('stdId') id: string, @Body() dto: any) { return this.s.updateCheckStandard(id, dto); }

  @RequirePermission('equipment', 'check:write')
  @Delete('check-standards/:stdId')
  deleteCheckStandard(@Param('stdId') id: string) { return this.s.deleteCheckStandard(id); }

  @RequirePermission('equipment', 'check:read')
  @Get('check-plans/today')
  getTodayCheckPlans() { return this.s.getTodayCheckPlans(); }

  @RequirePermission('equipment', 'check:read')
  @Get('check-plans')
  getCheckPlans(
    @Query('equipmentId') equipmentId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) { return this.s.getCheckPlans(equipmentId, status, date); }

  @RequirePermission('equipment', 'check:write')
  @Post('check-plans/:planId/execute')
  executeCheck(@Param('planId') planId: string, @Body() dto: any) { return this.s.executeCheck(planId, dto); }

  @RequirePermission('equipment', 'check:read')
  @Get('check-records')
  getCheckRecords(@Query('planId') planId?: string, @Query('equipmentId') equipmentId?: string) {
    return this.s.getCheckRecords(planId, equipmentId);
  }

  // ==================== 保养管理 ====================
  @RequirePermission('equipment', 'maintenance:read')
  @Get('maintenance-plans')
  getMaintenancePlans(@Query('equipmentId') equipmentId?: string, @Query('status') status?: string) {
    return this.s.getMaintenancePlans(equipmentId, status);
  }

  @RequirePermission('equipment', 'maintenance:write')
  @Patch('maintenance-plans/:planId')
  updateMaintenancePlan(@Param('planId') id: string, @Body() dto: any) { return this.s.updateMaintenancePlan(id, dto); }

  @RequirePermission('equipment', 'maintenance:write')
  @Delete('maintenance-plans/:planId')
  deleteMaintenancePlan(@Param('planId') id: string) { return this.s.deleteMaintenancePlan(id); }

  @RequirePermission('equipment', 'maintenance:write')
  @Post('maintenance-work-orders')
  createMaintenanceWorkOrder(@Body() dto: any) { return this.s.createMaintenanceWorkOrder(dto); }

  @RequirePermission('equipment', 'maintenance:read')
  @Get('maintenance-work-orders')
  getMaintenanceWorkOrders(@Query('equipmentId') equipmentId?: string, @Query('status') status?: string) {
    return this.s.getMaintenanceWorkOrders(equipmentId, status);
  }

  @RequirePermission('equipment', 'maintenance:write')
  @Patch('maintenance-work-orders/:woId')
  updateMaintenanceWorkOrder(@Param('woId') id: string, @Body() dto: any) {
    return this.s.updateMaintenanceWorkOrder(id, dto);
  }

  @RequirePermission('equipment', 'maintenance:write')
  @Delete('maintenance-work-orders/:woId')
  deleteMaintenanceWorkOrder(@Param('woId') id: string) { return this.s.deleteMaintenanceWorkOrder(id); }

  // ==================== Module 3: 维修管理 ====================
  @RequirePermission('equipment', 'repair:write')
  @Post('repair-requests')
  createRepairRequest(@Body() dto: any) { return this.s.createRepairRequest(dto); }

  @RequirePermission('equipment', 'repair:read')
  @Get('repair-requests')
  getRepairRequests(@Query('equipmentId') equipmentId?: string, @Query('status') status?: string) {
    return this.s.getRepairRequests(equipmentId, status);
  }

  @RequirePermission('equipment', 'repair:read')
  @Get('repair-stats')
  getRepairStats() { return this.s.getRepairStats(); }

  // ==================== Module 4: 备品备件 ====================
  @RequirePermission('equipment', 'sparepart:write')
  @Post('spare-parts')
  createSparePart(@Body() dto: any) { return this.s.createSparePart(dto); }

  @RequirePermission('equipment', 'sparepart:read')
  @Get('spare-parts')
  findAllSpareParts(@Query('keyword') keyword?: string, @Query('category') category?: string) {
    return this.s.findAllSpareParts(keyword, category);
  }

  @RequirePermission('equipment', 'sparepart:read')
  @Get('spare-parts/warnings')
  getSparePartWarnings() { return this.s.getSparePartWarnings(); }

  @RequirePermission('equipment', 'sparepart:read')
  @Get('spare-parts/suggestions')
  getPurchaseSuggestions() { return this.s.getPurchaseSuggestions(); }

  @RequirePermission('equipment', 'sparepart:write')
  @Post('spare-parts/stock-in')
  stockIn(@Body() dto: any) { return this.s.stockIn(dto); }

  @RequirePermission('equipment', 'sparepart:write')
  @Post('spare-parts/stock-out')
  stockOut(@Body() dto: any) { return this.s.stockOut(dto); }

  @RequirePermission('equipment', 'sparepart:read')
  @Get('spare-parts-records')
  getSparePartRecords(@Query('partId') partId?: string, @Query('type') type?: string) {
    return this.s.getSparePartRecords(partId, type);
  }

  // ==================== Wildcard :id routes ====================
  @RequirePermission('equipment', 'equipment:read')
  @Get()
  findAllEquipments(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) { return this.s.findAllEquipments(keyword, status, category); }

  @RequirePermission('equipment', 'equipment:read')
  @Get(':id')
  findEquipment(@Param('id') id: string) { return this.s.findEquipment(id); }

  @RequirePermission('equipment', 'equipment:write')
  @Patch(':id')
  updateEquipment(@Param('id') id: string, @Body() dto: any) { return this.s.updateEquipment(id, dto); }

  @RequirePermission('equipment', 'equipment:write')
  @Delete(':id')
  deleteEquipment(@Param('id') id: string) { return this.s.deleteEquipment(id); }

  @RequirePermission('equipment', 'equipment:read')
  @Get(':id/documents')
  getDocuments(@Param('id') id: string) { return this.s.getDocuments(id); }

  @RequirePermission('equipment', 'equipment:write')
  @Post(':id/documents')
  createDocument(@Param('id') id: string, @Body() dto: any) { return this.s.createDocument(id, dto); }

  @RequirePermission('equipment', 'check:write')
  @Post(':id/check-standards')
  createCheckStandard(@Param('id') id: string, @Body() dto: any) { return this.s.createCheckStandard(id, dto); }

  @RequirePermission('equipment', 'check:read')
  @Get(':id/check-standards')
  getCheckStandards(@Param('id') id: string) { return this.s.getCheckStandards(id); }

  @RequirePermission('equipment', 'check:write')
  @Post(':id/check-plans/generate')
  generateCheckPlans(@Param('id') id: string, @Body() dto: any) {
    return this.s.generateCheckPlans(id, dto.days || 7);
  }

  @RequirePermission('equipment', 'maintenance:write')
  @Post(':id/maintenance-plans')
  createMaintenancePlan(@Param('id') id: string, @Body() dto: any) { return this.s.createMaintenancePlan(id, dto); }

  // Module 3 wildcards
  @RequirePermission('equipment', 'repair:read')
  @Get('repair-requests/:id')
  findRepairRequest(@Param('id') id: string) { return this.s.findRepairRequest(id); }

  @RequirePermission('equipment', 'repair:write')
  @Post('repair-requests/:id/dispatch')
  dispatchRepair(@Param('id') id: string, @Body() dto: any) { return this.s.dispatchRepair(id, dto); }

  @RequirePermission('equipment', 'repair:write')
  @Post('repair-work-orders/:id/start')
  startRepair(@Param('id') id: string) { return this.s.startRepair(id); }

  @RequirePermission('equipment', 'repair:write')
  @Post('repair-work-orders/:id/complete')
  completeRepair(@Param('id') id: string, @Body() dto: any) { return this.s.completeRepair(id, dto); }

  @RequirePermission('equipment', 'repair:write')
  @Post('repair-work-orders/:id/verify')
  verifyRepair(@Param('id') id: string, @Body() dto: any) { return this.s.verifyRepair(id, dto); }

  // Module 4 wildcards
  @RequirePermission('equipment', 'sparepart:read')
  @Get('spare-parts/:id')
  findSparePart(@Param('id') id: string) { return this.s.findSparePart(id); }

  @RequirePermission('equipment', 'sparepart:write')
  @Patch('spare-parts/:id')
  updateSparePart(@Param('id') id: string, @Body() dto: any) { return this.s.updateSparePart(id, dto); }

  @RequirePermission('equipment', 'sparepart:write')
  @Delete('spare-parts/:id')
  deleteSparePart(@Param('id') id: string) { return this.s.deleteSparePart(id); }
}