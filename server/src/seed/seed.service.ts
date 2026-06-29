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
      { docType: 'SAMPLING_WO', prefix: 'DY', description: 'Sampling work order' },
      { docType: 'NPI_PROJECT', prefix: 'NPI', description: 'NPI project' },
      { docType: 'PLM_PRODUCT', prefix: 'PRD', description: 'PLM product' },
      { docType: 'PLM_BOM', prefix: 'BOM', description: 'PLM BOM' },
      { docType: 'PLM_DOCUMENT', prefix: 'DOC', description: 'PLM document' },
      { docType: 'CRM_CUSTOMER', prefix: 'C', yearDigits: 2, description: 'CRM customer' },
      { docType: 'CRM_QUOTE', prefix: 'BJ', yearDigits: 2, description: 'CRM quote' },
      { docType: 'CRM_ORDER', prefix: 'SO', yearDigits: 2, description: 'CRM order' },
      { docType: 'CRM_COMPLAINT', prefix: 'KS', yearDigits: 2, description: 'CRM complaint' },
      { docType: 'CRM_RECONCILIATION', prefix: 'DZ', yearDigits: 2, description: 'CRM reconciliation' },
      { docType: 'CRM_PAYMENT', prefix: 'SK', yearDigits: 2, description: 'CRM payment' },
      { docType: 'PURCHASE_ORDER', prefix: 'PO', yearDigits: 2, description: 'Purchase order' },
      { docType: 'MRP_RUN', prefix: 'MRP', description: 'MRP run' },
      { docType: 'QLT_INCOMING', prefix: 'IQC', description: 'IQC inspection' },
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
