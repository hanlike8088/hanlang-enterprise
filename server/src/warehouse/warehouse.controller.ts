import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly s: WarehouseService) {}
  @RequirePermission('warehouse', 'warehouse:write')
  @Post() createWarehouse(@Body() dto: any) { return this.s.createWarehouse(dto); }
  @RequirePermission('warehouse', 'warehouse:read')
  @Get() findAllWarehouses() { return this.s.findAllWarehouses(); }
  @RequirePermission('warehouse', 'inventory:read')
  @Get('inventory') getInventory(@Query('warehouseId') wid?: string, @Query('materialId') mid?: string, @Query('keyword') kw?: string, @Query('abcClass') abc?: string) { return this.s.getInventory(wid, mid, kw, abc); }
  @RequirePermission('warehouse', 'inventory:read')
  @Get('records') getRecords(@Query('warehouseId') wid?: string, @Query('materialId') mid?: string, @Query('type') type?: string, @Query('limit') limit?: string) { return this.s.getInventoryRecords(wid, mid, type, limit ? parseInt(limit) : 50); }
  @RequirePermission('warehouse', 'inventory:read')
  @Get('warnings') getStockWarnings() { return this.s.getStockWarnings(); }
  @RequirePermission('warehouse', 'inventory:read')
  @Get('abc') getAbcDistribution() { return this.s.getAbcDistribution(); }
  @RequirePermission('warehouse', 'warehouse:read')
  @Get('stats') getStats() { return this.s.getStats(); }
  @RequirePermission('warehouse', 'warehouse:read')
  @Get(':id') findOneWarehouse(@Param('id') id: string) { return this.s.findOneWarehouse(id); }
  @RequirePermission('warehouse', 'warehouse:write')
  @Patch(':id') updateWarehouse(@Param('id') id: string, @Body() dto: any) { return this.s.updateWarehouse(id, dto); }
  @RequirePermission('warehouse', 'warehouse:write')
  @Delete(':id') removeWarehouse(@Param('id') id: string) { return this.s.removeWarehouse(id); }
  @RequirePermission('warehouse', 'location:write')
  @Post(':id/locations') createLocation(@Param('id') id: string, @Body() dto: any) { return this.s.createLocation(id, dto); }
  @RequirePermission('warehouse', 'location:read')
  @Get(':id/locations') findLocations(@Param('id') id: string) { return this.s.findLocations(id); }
  @RequirePermission('warehouse', 'location:write')
  @Patch('locations/:lid') updateLocation(@Param('lid') id: string, @Body() dto: any) { return this.s.updateLocation(id, dto); }
  @RequirePermission('warehouse', 'location:write')
  @Delete('locations/:lid') removeLocation(@Param('lid') id: string) { return this.s.removeLocation(id); }
  @RequirePermission('warehouse', 'inventory:write')
  @Post('stock-in') stockIn(@Body() dto: any) { return this.s.stockIn(dto); }
  @RequirePermission('warehouse', 'inventory:write')
  @Post('stock-out') stockOut(@Body() dto: any) { return this.s.stockOut(dto); }
  @RequirePermission('warehouse', 'inventory:write')
@Patch('inventory/:iid/abc') updateAbcClass(@Param('iid') id: string, @Body('abcClass') abcClass: string) { return this.s.updateAbcClass(id, abcClass); }
  // FIFO Åú´Î¿â´æ
  @RequirePermission('warehouse', 'inventory:read')
  @Get('batch-inventory') getBatchInventories(@Query('warehouseId') wid?: string, @Query('materialId') mid?: string) { return this.s.getBatchInventories(wid, mid); }
  @RequirePermission('warehouse', 'inventory:read')
  @Get('fifo-aging') getFifoAging(@Query('warehouseId') wid?: string, @Query('daysThreshold') dt?: string) { return this.s.getFifoAging(wid, dt ? parseInt(dt) : 90); }
  @RequirePermission('warehouse', 'inventory:write')
  @Post('stock-in-fifo') stockInWithBatch(@Body() dto: any) { return this.s.stockInWithBatch(dto); }
  @RequirePermission('warehouse', 'inventory:write')
  @Post('stock-out-fifo') stockOutFifo(@Body() dto: any) { return this.s.stockOutFifo(dto); }
}