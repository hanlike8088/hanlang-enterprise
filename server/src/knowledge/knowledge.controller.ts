import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly s: KnowledgeService) {}

  @RequirePermission('knowledge', 'knowledge:write')
  @Post('articles')
  createArticle(@Body() dto: any) { return this.s.createArticle(dto); }

  @RequirePermission('knowledge', 'knowledge:read')
  @Get('articles')
  findAllArticles(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) { return this.s.findAllArticles(category, status, keyword); }

  @RequirePermission('knowledge', 'knowledge:read')
  @Get('articles/:id')
  findOneArticle(@Param('id') id: string) { return this.s.findOneArticle(id); }

  @RequirePermission('knowledge', 'knowledge:write')
  @Patch('articles/:id')
  updateArticle(@Param('id') id: string, @Body() dto: any) { return this.s.updateArticle(id, dto); }

  @RequirePermission('knowledge', 'knowledge:write')
  @Delete('articles/:id')
  removeArticle(@Param('id') id: string) { return this.s.removeArticle(id); }

  @RequirePermission('knowledge', 'knowledge:read')
  @Get('categories')
  getCategories() { return this.s.getCategories(); }

  @RequirePermission('knowledge', 'knowledge:read')
  @Get('stats')
  getStats() { return this.s.getStats(); }
}