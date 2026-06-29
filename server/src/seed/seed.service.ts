import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class SeedService {
  constructor(
    private prisma: PrismaService,
    private codingRule: CodingRuleService,
  ) {}

  async initAdmin() {
    const admin = await this.prisma.user.findUnique({ where: { username: 'admin' } });
    if (admin) return { message: 'admin already exists' };
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('admin123', 10);
    await this.prisma.user.create({
      data: { username: 'admin', email: 'admin@hanlang.vip', password: hash, name: 'Administrator', role: 'admin' },
    });
    return { message: 'admin user created' };
  }

  async initCodingRules() {
    await this.codingRule.ensureRules([
      { docType: 'SAMPLING_WO', prefix: 'DY', description: '打样工单' },
      { docType: 'NPI_PROJECT', prefix: 'NPI', description: 'NPI项目' },
      { docType: 'PLM_PRODUCT', prefix: 'PRD', description: 'PLM产品' },
      { docType: 'PLM_BOM', prefix: 'BOM', description: 'PLM物料清单' },
      { docType: 'PLM_DOCUMENT', prefix: 'DOC', description: 'PLM文档' },
      { docType: 'CRM_CUSTOMER', prefix: 'C', yearDigits: 2, description: 'CRM客户' },
      { docType: 'CRM_QUOTE', prefix: 'BJ', yearDigits: 2, description: 'CRM报价单' },
      { docType: 'CRM_ORDER', prefix: 'SO', yearDigits: 2, description: 'CRM销售订单' },
      { docType: 'CRM_COMPLAINT', prefix: 'KS', yearDigits: 2, description: 'CRM客诉单' },
      { docType: 'CRM_RECONCILIATION', prefix: 'DZ', yearDigits: 2, description: 'CRM对账单' },
      { docType: 'CRM_PAYMENT', prefix: 'SK', yearDigits: 2, description: 'CRM收款单' },
      { docType: 'PURCHASE_ORDER', prefix: 'PO', yearDigits: 2, description: '采购订单' },
      { docType: 'MRP_RUN', prefix: 'MRP', description: 'MRP运行' },
      { docType: 'QLT_INCOMING', prefix: 'IQC', description: '来料检验' },
    ]);
    return { message: 'coding rules ensured' };
  }

  async initAll() {
    const results = [];
    results.push(await this.initAdmin());
    results.push(await this.initCodingRules());
    return { message: 'seed complete', results };
  }
}
