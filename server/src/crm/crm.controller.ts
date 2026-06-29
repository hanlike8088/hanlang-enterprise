import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateContactRecordDto, UpdateContactRecordDto } from './dto/create-customer.dto';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/create-quote.dto';
import { CreateOrderDto, UpdateOrderDto, ConvertQuoteToOrderDto } from './dto/create-order.dto';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/create-complaint.dto';
import { CreateReconciliationDto, UpdateReconciliationDto } from './dto/create-reconciliation.dto';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // === Customers ===
  @RequirePermission('crm', 'customer:write')
  @Post('sync-customers-from-k3')
  syncCustomersFromK3() { return this.crmService.syncCustomersFromK3(); }

  @RequirePermission('crm', 'customer:read')
  @Get('customers')
  getCustomers(@Query('keyword') keyword?: string, @Query('category') category?: string) {
    return this.crmService.getCustomers(keyword, category);
  }

  @RequirePermission('crm', 'customer:read')
  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.crmService.getCustomer(id);
  }

  @RequirePermission('crm', 'customer:write')
  @Post('customers')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.crmService.createCustomer(dto);
  }

  @RequirePermission('crm', 'customer:write')
  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.crmService.updateCustomer(id, dto);
  }

  @RequirePermission('crm', 'customer:write')
  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.crmService.deleteCustomer(id);
  }

  // === Contact Records ===
  @RequirePermission('crm', 'contact:read')
  @Get('customers/:customerId/contacts')
  getContactRecords(@Param('customerId') customerId: string) {
    return this.crmService.getContactRecords(customerId);
  }

  @RequirePermission('crm', 'contact:write')
  @Post('contacts')
  createContactRecord(@Body() dto: CreateContactRecordDto) {
    return this.crmService.createContactRecord(dto);
  }

  @RequirePermission('crm', 'contact:write')
  @Patch('contacts/:id')
  updateContactRecord(@Param('id') id: string, @Body() dto: UpdateContactRecordDto) {
    return this.crmService.updateContactRecord(id, dto);
  }

  @RequirePermission('crm', 'contact:write')
  @Delete('contacts/:id')
  deleteContactRecord(@Param('id') id: string) {
    return this.crmService.deleteContactRecord(id);
  }

  // === Quotes ===
  @RequirePermission('crm', 'quote:read')
  @Get('quotes')
  getQuotes(@Query('keyword') keyword?: string, @Query('status') status?: string) {
    return this.crmService.getQuotes(keyword, status);
  }

  @RequirePermission('crm', 'quote:read')
  @Get('quotes/:id')
  getQuote(@Param('id') id: string) {
    return this.crmService.getQuote(id);
  }

  @RequirePermission('crm', 'quote:write')
  @Post('quotes')
  createQuote(@Body() dto: CreateQuoteDto) {
    return this.crmService.createQuote(dto);
  }

  @RequirePermission('crm', 'quote:write')
  @Patch('quotes/:id')
  updateQuote(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.crmService.updateQuote(id, dto);
  }

  @RequirePermission('crm', 'quote:write')
  @Delete('quotes/:id')
  deleteQuote(@Param('id') id: string) {
    return this.crmService.deleteQuote(id);
  }

  @RequirePermission('crm', 'quote:write')
  @Patch('quotes/:id/transition')
  transitionQuote(@Param('id') id: string, @Body('status') status: string) {
    return this.crmService.transitionQuote(id, status);
  }

  @RequirePermission('crm', 'quote:read')
  @Get('products/:productId/bom-for-quote')
  getProductBomForQuote(@Param('productId') productId: string) {
    return this.crmService.getProductBomForQuote(productId);
  }

  // === Orders ===
  @RequirePermission('crm', 'order:read')
  @Get('orders')
  getOrders(@Query('keyword') keyword?: string, @Query('status') status?: string) {
    return this.crmService.getOrders(keyword, status);
  }

  @RequirePermission('crm', 'order:read')
  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.crmService.getOrder(id);
  }

  @RequirePermission('crm', 'order:write')
  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.crmService.createOrder(dto);
  }

  @RequirePermission('crm', 'order:write')
  @Post('orders/convert-quote')
  convertQuoteToOrder(@Body() dto: ConvertQuoteToOrderDto) {
    return this.crmService.convertQuoteToOrder(dto);
  }

  @RequirePermission('crm', 'order:write')
  @Patch('orders/:id')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.crmService.updateOrder(id, dto);
  }

  @RequirePermission('crm', 'order:write')
  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.crmService.deleteOrder(id);
  }

  @RequirePermission('crm', 'order:write')
  @Patch('orders/:id/transition')
  transitionOrder(@Param('id') id: string, @Body('status') status: string) {
    return this.crmService.transitionOrder(id, status);
  }

  @RequirePermission('crm', 'order:read')
  @Get('customers/:customerId/orders')
  getOrdersForCustomer(@Param('customerId') customerId: string) {
    return this.crmService.getOrdersForCustomer(customerId);
  }

  // === Complaints ===
  @RequirePermission('crm', 'complaint:read')
  @Get('complaints')
  getComplaints(@Query('keyword') keyword?: string, @Query('complaintType') complaintType?: string, @Query('severity') severity?: string, @Query('status') status?: string) {
    return this.crmService.getComplaints(keyword, complaintType, severity, status);
  }

  @RequirePermission('crm', 'complaint:read')
  @Get('complaints/:id')
  getComplaint(@Param('id') id: string) {
    return this.crmService.getComplaint(id);
  }

  @RequirePermission('crm', 'complaint:write')
  @Post('complaints')
  createComplaint(@Body() dto: CreateComplaintDto) {
    return this.crmService.createComplaint(dto);
  }

  @RequirePermission('crm', 'complaint:write')
  @Patch('complaints/:id')
  updateComplaint(@Param('id') id: string, @Body() dto: UpdateComplaintDto) {
    return this.crmService.updateComplaint(id, dto);
  }

  @RequirePermission('crm', 'complaint:write')
  @Delete('complaints/:id')
  deleteComplaint(@Param('id') id: string) {
    return this.crmService.deleteComplaint(id);
  }

  @RequirePermission('crm', 'complaint:write')
  @Patch('complaints/:id/transition')
  transitionComplaint(@Param('id') id: string, @Body('status') status: string) {
    return this.crmService.transitionComplaint(id, status);
  }

  @RequirePermission('crm', 'complaint:read')
  @Get('customers/:customerId/complaints')
  getComplaintsForCustomer(@Param('customerId') customerId: string) {
    return this.crmService.getComplaintsForCustomer(customerId);
  }

  // === Reconciliations ===
  @RequirePermission('crm', 'reconciliation:read')
  @Get('reconciliations')
  getReconciliations(@Query('keyword') keyword?: string, @Query('status') status?: string) {
    return this.crmService.getReconciliations(keyword, status);
  }

  @RequirePermission('crm', 'reconciliation:read')
  @Get('reconciliations/:id')
  getReconciliation(@Param('id') id: string) {
    return this.crmService.getReconciliation(id);
  }

  @RequirePermission('crm', 'reconciliation:write')
  @Post('reconciliations')
  createReconciliation(@Body() dto: CreateReconciliationDto) {
    return this.crmService.createReconciliation(dto);
  }

  @RequirePermission('crm', 'reconciliation:write')
  @Patch('reconciliations/:id')
  updateReconciliation(@Param('id') id: string, @Body() dto: UpdateReconciliationDto) {
    return this.crmService.updateReconciliation(id, dto);
  }

  @RequirePermission('crm', 'reconciliation:write')
  @Delete('reconciliations/:id')
  deleteReconciliation(@Param('id') id: string) {
    return this.crmService.deleteReconciliation(id);
  }

  @RequirePermission('crm', 'reconciliation:write')
  @Patch('reconciliations/:id/transition')
  transitionReconciliation(@Param('id') id: string, @Body('status') status: string) {
    return this.crmService.transitionReconciliation(id, status);
  }

  @RequirePermission('crm', 'reconciliation:read')
  @Get('customers/:customerId/reconciliations')
  getReconciliationsForCustomer(@Param('customerId') customerId: string) {
    return this.crmService.getReconciliationsForCustomer(customerId);
  }

  // === Payments ===
  @RequirePermission('crm', 'payment:read')
  @Get('payments')
  getPayments(@Query('keyword') keyword?: string, @Query('customerId') customerId?: string, @Query('reconciliationId') reconciliationId?: string) {
    return this.crmService.getPayments(keyword, customerId, reconciliationId);
  }

  @RequirePermission('crm', 'payment:read')
  @Get('payments/:id')
  getPayment(@Param('id') id: string) {
    return this.crmService.getPayment(id);
  }

  @RequirePermission('crm', 'payment:write')
  @Post('payments')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.crmService.createPayment(dto);
  }

  @RequirePermission('crm', 'payment:write')
  @Patch('payments/:id')
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.crmService.updatePayment(id, dto);
  }

  @RequirePermission('crm', 'payment:write')
  @Delete('payments/:id')
  deletePayment(@Param('id') id: string) {
    return this.crmService.deletePayment(id);
  }

  @RequirePermission('crm', 'payment:write')
  @Patch('payments/:id/transition')
  transitionPayment(@Param('id') id: string, @Body('status') status: string) {
    return this.crmService.transitionPayment(id, status);
  }

  @RequirePermission('crm', 'payment:read')
  @Get('customers/:customerId/payments')
  getPaymentsForCustomer(@Param('customerId') customerId: string) {
    return this.crmService.getPaymentsForCustomer(customerId);
  }
}