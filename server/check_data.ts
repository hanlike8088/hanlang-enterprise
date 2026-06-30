import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  console.log('=== 基础数据统计 ===');
  console.log('物料:', await p.erpMaterial.count());
  console.log('供应商:', await p.supplier.count());
  console.log('客户:', await p.crmCustomer.count());
  console.log('员工:', await p.adminEmployee.count());
  console.log('组织:', await p.adminOrganization.count());
  
  const matSample = await p.erpMaterial.findFirst({ select: { materialCode: true, materialName: true, spec: true, unit: true } });
  console.log('\n物料样例:', JSON.stringify(matSample, null, 2));
  
  const suppSample = await p.supplier.findFirst({ select: { supplierCode: true, supplierName: true, category: true, status: true } });
  console.log('供应商样例:', JSON.stringify(suppSample, null, 2));
  
  const custSample = await p.crmCustomer.findFirst({ select: { customerCode: true, customerName: true, category: true, status: true } });
  console.log('客户样例:', JSON.stringify(custSample, null, 2));
  
  const empSample = await p.adminEmployee.findFirst({ select: { employeeCode: true, name: true, orgId: true, status: true } });
  console.log('员工样例:', JSON.stringify(empSample, null, 2));
  
  await p.$disconnect();
}
main().catch(console.error);
