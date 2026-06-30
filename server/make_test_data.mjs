import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const ts = () => Date.now().toString(36).toUpperCase();
const npi = await db.npiProject.create({ data: {
  projectCode: 'NPI-' + ts(),
  projectName: '自动测试-电机新品研发',
  status: '立项',
  priority: '高',
  startDate: new Date('2026-07-01'),
  targetDate: new Date('2026-08-15'),
}});
console.log('NPI:', npi.id.substring(0, 16), npi.projectCode, npi.status);
const swo = await db.samplingWorkOrder.create({ data: {
  orderCode: 'SPL-' + ts(),
  productName: 'BLDC-001无刷电机',
  quantity: 100,
  deadline: new Date('2026-07-20'),
  applicant: 'admin',
  customerName: '测试客户',
  status: '待接收',
}});
console.log('Sampling:', swo.id.substring(0, 16), swo.orderCode, swo.status);
console.log('NPI count:', await db.npiProject.count(), 'Sampling count:', await db.samplingWorkOrder.count());
await db.$disconnect();
