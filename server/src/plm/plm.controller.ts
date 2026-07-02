import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { PlmService } from './plm.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateBomDto, UpdateBomDto } from './dto/create-bom.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('plm')
export class PlmController {
  constructor(private readonly plmService: PlmService) {}

  // Products
  @RequirePermission('plm', 'product:read')
  @Get('products')
  getProducts() {
    return this.plmService.getProducts();
  }

  @Get('products/next-code')
  async getNextProductCode() {
    const code = await this.plmService.getNextProductCode();
    return { code };
  }

  @RequirePermission('plm', 'product:read')
  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.plmService.getProduct(id);
  }

  @RequirePermission('plm', 'product:write')
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.plmService.createProduct(dto);
  }

  @RequirePermission('plm', 'product:write')
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.plmService.updateProduct(id, dto);
  }

  @RequirePermission('plm', 'product:write')
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.plmService.deleteProduct(id);
  }

  @RequirePermission('plm', 'product:write')
  @Patch('products/:id/transition')
  transitionProduct(@Param('id') id: string, @Body('status') status: string) {
    return this.plmService.transitionProduct(id, status);
  }

  // BOMs
  @RequirePermission('plm', 'bom:read')
  @Get('boms')
  getBoms(@Query('productId') productId?: string) {
    return this.plmService.getBoms(productId);
  }

  @RequirePermission('plm', 'bom:read')
  @Get('boms/:id')
  getBom(@Param('id') id: string) {
    return this.plmService.getBom(id);
  }

  @RequirePermission('plm', 'bom:write')
  @Post('boms')
  createBom(@Body() dto: CreateBomDto) {
    return this.plmService.createBom(dto);
  }

  @RequirePermission('plm', 'bom:write')
  @Patch('boms/:id')
  updateBom(@Param('id') id: string, @Body() dto: UpdateBomDto) {
    return this.plmService.updateBom(id, dto);
  }

  @RequirePermission('plm', 'bom:write')
  @Delete('boms/:id')
  deleteBom(@Param('id') id: string) {
    return this.plmService.deleteBom(id);
  }

  @RequirePermission('plm', 'bom:write')
  @Patch('boms/:id/transition')
  transitionBom(@Param('id') id: string, @Body('status') status: string) {
    return this.plmService.transitionBom(id, status);
  }

  // Documents
  @RequirePermission('plm', 'document:read')
  @Get('documents')
  getDocuments(@Query('productId') productId?: string, @Query('docType') docType?: string) {
    return this.plmService.getDocuments(productId, docType);
  }

  @RequirePermission('plm', 'document:read')
  @Get('documents/patents')
  getPatents(@Query('patentType') patentType?: string) {
    return this.plmService.getPatents(patentType);
  }

  @RequirePermission('plm', 'document:read')
  @Get('documents/patents/expiring')
  getExpiringPatents(@Query('days') days?: string) {
    return this.plmService.getExpiringPatents(Number(days) || 90);
  }

  @RequirePermission('plm', 'document:read')
  @Get('documents/:id')
  getDocument(@Param('id') id: string) {
    return this.plmService.getDocument(id);
  }

  @RequirePermission('plm', 'document:write')
  @Post('documents')
  createDocument(@Body() dto: CreateDocumentDto) {
    return this.plmService.createDocument(dto);
  }

  @RequirePermission('plm', 'document:write')
  @Patch('documents/:id')
  updateDocument(@Param('id') id: string, @Body() dto: Partial<CreateDocumentDto>) {
    return this.plmService.updateDocument(id, dto);
  }

  @RequirePermission('plm', 'document:write')
  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string) {
    return this.plmService.deleteDocument(id);
  }

  @RequirePermission('plm', 'document:write')
  @Patch('documents/:id/transition')
  transitionDocument(@Param('id') id: string, @Body('status') status: string) {
    return this.plmService.transitionDocument(id, status);
  }
  @RequirePermission('plm', 'document:write')
  @Post('documents/import-patents')
  importPatents(@Body('sourceDir') sourceDir?: string) {
    return this.plmService.importPatents(sourceDir);
  }

  // Search materials for product creation
  @Get('materials/search')
  searchMaterials(@Query('q') q: string) {
    return this.plmService.searchMaterials(q);
  }

}
