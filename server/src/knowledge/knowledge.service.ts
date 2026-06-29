import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  async createArticle(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
    author?: string;
    status?: string;
  }) {
    const code = await this.codingRule.generate('KNOWLEDGE');
    return this.prisma.knowledgeArticle.create({ data: { ...data, articleCode: code } });
  }

  async findAllArticles(category?: string, status?: string, keyword?: string, limit: number = 100) {
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { tags: { contains: keyword } },
      ];
    }
    return this.prisma.knowledgeArticle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async findOneArticle(id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('知识文章不存在');
    // Increment view count
    await this.prisma.knowledgeArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return { ...article, viewCount: article.viewCount + 1 };
  }

  async updateArticle(id: string, data: any) {
    await this.findOneArticle(id);
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: { ...data, version: { increment: 1 } },
    });
  }

  async removeArticle(id: string) {
    await this.findOneArticle(id);
    return this.prisma.knowledgeArticle.delete({ where: { id } });
  }

  async getCategories() {
    const result = await this.prisma.knowledgeArticle.groupBy({
      by: ['category'],
      _count: true,
    });
    return result.map(r => ({ category: r.category, count: r._count }));
  }

  async getStats() {
    const [total, published, draft, categories] = await Promise.all([
      this.prisma.knowledgeArticle.count(),
      this.prisma.knowledgeArticle.count({ where: { status: 'published' } }),
      this.prisma.knowledgeArticle.count({ where: { status: 'draft' } }),
      this.getCategories(),
    ]);
    return { total, published, draft, categories };
  }
}