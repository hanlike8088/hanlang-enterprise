// K3 data sync using NestJS compiled service
import { K3CloudService } from './dist/k3cloud/k3cloud.service.js';

const k3 = new K3CloudService();
const p = (await import('@prisma/client')).PrismaClient;
const prisma = new p();

async function sync(type, k3Method, prismaModel, fields) {
  console.log('Syncing', type, '...');
  const result = await k3[k3Method]();
  const rows = Array.isArray(result) ? result : (result?.Result?.Result || []);
  if (!rows.length) { console.log('  No data'); return; }
  let count = 0;
  for (const row of rows) {
    try {
      const where = {};
      where[fields[0]] = String(row[0] || '');
      if (!where[fields[0]]) continue;
      const data = {};
      for (let i = 1; i < fields.length; i++) {
        data[fields[i]] = String(row[i] || '');
      }
      await prismaModel.upsert({ where, create: { ...where, ...data }, update: data });
      count++;
    } catch(e) {}
  }
  console.log('  Synced', count, 'of', rows.length);
}

await sync('departments', 'getDepartments', prisma.k3Department, ['deptCode', 'deptName']);
await sync('BOMs', 'getBoms', prisma.k3Bom, ['bomCode', 'billType', 'parentMaterialId']);
await sync('accounts', 'getAccounts', prisma.k3Account, ['accountCode', 'accountName']);

// Also sync accounts via custom query
console.log('Syncing accounts (custom)...');
const accResult = await k3.executeBillQuery('BD_Account', 'FNumber,FName,FGroupID.FNumber', '', 1000);
const accRows = Array.isArray(accResult) ? accResult : (accResult?.Result?.Result || []);
let accCount = 0;
for (const row of accRows) {
  try {
    const code = String(row[0] || '');
    if (!code) continue;
    await prisma.k3Account.upsert({
      where: { accountCode: code },
      create: { accountCode: code, accountName: String(row[1] || '') },
      update: { accountName: String(row[1] || '') }
    });
    accCount++;
  } catch(e) {}
}
console.log('  Synced accounts:', accCount);

await prisma.$disconnect();
console.log('Done!');
