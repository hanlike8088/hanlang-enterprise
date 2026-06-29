import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 统一编码规则服务 — 集中管理所有模块的文档/实体编码生成。
 *
 * 使用 Prisma 原子 increment 避免并发条件下的串号冲突，
 * 替换各模块原有的 count + 1 脆弱实现。
 *
 * 编码格式: prefix + yearDigits + separator + serial
 * yearDigits=0 时跳过年份组件，仅输出 prefix + separator + serial
 *
 * Usage:
 *   constructor(private codingRule: CodingRuleService) {}
 *   const code = await this.codingRule.generate('NPI_PROJECT');
 */
@Injectable()
export class CodingRuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 为指定 docType 生成下一个编码。
   * Atomic — 内部使用 Prisma increment，可安全用于并发环境。
   */
  async generate(docType: string): Promise<string> {
    const rule = await this.prisma.adminCodingRule.findUnique({
      where: { docType },
    });
    if (!rule) {
      throw new NotFoundException(`编码规则未定义: ${docType}`);
    }

    // Atomic increment
    const updated = await this.prisma.adminCodingRule.update({
      where: { id: rule.id },
      data: { currentSerial: { increment: 1 } },
    });

    const serial = String(updated.currentSerial - 1).padStart(
      rule.serialDigits,
      '0',
    );

    if (rule.yearDigits === 0) {
      return `${rule.prefix}${rule.separator}${serial}`;
    }

    const year = new Date().getFullYear();
    const yearStr =
      rule.yearDigits === 2
        ? String(year).slice(-2)
        : String(year);
    return `${rule.prefix}${rule.separator}${yearStr}${rule.separator}${serial}`;
  }

  /**
   * 批量确保编码规则存在（seed 用）。
   * 已存在的规则不修改，仅创建缺失项。
   */
  async ensureRules(
    rules: Array<{
      docType: string;
      prefix: string;
      yearDigits?: number;
      serialDigits?: number;
      separator?: string;
      resetPeriod?: string;
      description?: string;
    }>,
  ): Promise<void> {
    for (const r of rules) {
      await this.prisma.adminCodingRule.upsert({
        where: { docType: r.docType },
        create: {
          docType: r.docType,
          prefix: r.prefix,
          yearDigits: r.yearDigits ?? 4,
          serialDigits: r.serialDigits ?? 5,
          separator: r.separator ?? '-',
          resetPeriod: r.resetPeriod ?? 'yearly',
          description: r.description ?? '',
          currentSerial: 1,
        },
        update: {}, // 已有规则不覆盖
      });
    }
  }
}
