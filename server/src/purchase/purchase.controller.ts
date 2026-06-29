import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('purchase')
export class PurchaseController {
  constructor(private readonly s: PurchaseService) {}

  @RequirePermission('purchase', 'order:write')
  @Post()
  create(@Body() dto: any) { return this.s.create(dto); }

  @RequirePermission('purchase', 'order:read')
  @Get()
  findAll(@Query('status') status?: string, @Query('supplierId') supplierId?: string, @Query('keyword') keyword?: string) {
    return this.s.findAll(status, supplierId, keyword);
  }

  @RequirePermission('purchase', 'order:read')
  @Get('warnings')
  getWarnings() { return this.s.getDeliveryWarnings(); }

  @RequirePermission('purchase', 'order:read')
  @Get('stats')
  getStats() { return this.s.getStats(); }

  @RequirePermission('purchase', 'order:read')
  @Get(':id')
  findOne(@Param('id') id: string) { return this.s.findOne(id); }

  @RequirePermission('purchase', 'order:write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.s.update(id, dto); }

  @RequirePermission('purchase', 'order:write')
  @Delete(':id')
  remove(@Param('id') id: string) { return this.s.remove(id); }

  @RequirePermission('purchase', 'order:write')
  @Post(':id/status')
  advanceStatus(@Param('id') id: string, @Body('status') status: string) { return this.s.advanceStatus(id, status); }

  @RequirePermission('purchase', 'receipt:write')
  @Post(':id/receipts')
  createReceipt(@Param('id') id: string, @Body() dto: any) { return this.s.createReceipt(id, dto); }

  @RequirePermission('purchase', 'receipt:read')
  @Get(':id/receipts')
  getReceipts(@Param('id') id: string) { return this.s.getReceipts(id); }

  @RequirePermission('purchase', 'order:write')
  @Post(':id/link-sale-order')
  linkSaleOrder(@Param('id') id: string, @Body('saleOrderId') saleOrderId: string) { return this.s.linkSaleOrder(id, saleOrderId); }

  @RequirePermission('purchase', 'order:write')
  @Delete('sale-order-link/:linkId')
  unlinkSaleOrder(@Param('linkId') id: string) { return this.s.unlinkSaleOrder(id); }

  @RequirePermission('purchase', 'order:read')
  @Get(':id/sale-orders')
  getLinkedSaleOrders(@Param('id') id: string) { return this.s.getLinkedSaleOrders(id); }
}