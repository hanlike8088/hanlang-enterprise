const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
process.env.K3_CLOUD_PASSWORD = 'kingdee@123';
const { K3CloudService } = require('./dist/k3cloud/k3cloud.service');
const k3 = new K3CloudService();
(async () => {
  console.log('K3 sync starting...');
  const dept = await k3.getDepartments();
  console.log('Dept rows:', Array.isArray(dept) ? dept.length : 0);
  const acc = await k3.executeBillQuery('BD_Account', 'FNumber,FName', '', 1000);
  const accRows = Array.isArray(acc) ? acc : (acc && acc.Result ? acc.Result.Result : []);
  console.log('Account rows:', accRows.length);
  const bom = await k3.getBoms();
  const bomRows = Array.isArray(bom) ? bom : (bom && bom.Result ? bom.Result.Result : []);
  console.log('BOM rows:', bomRows.length);
  await p.$disconnect();
  console.log('Done');
})().catch(e => { console.error(e); process.exit(1); });
