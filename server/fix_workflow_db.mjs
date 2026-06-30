import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
const db = new PrismaClient();

// 1. Update module names
const mapping = {
  sampling: '打样工单',
  purchase: '采购订单',
  npi: 'NPI项目',
  crm: 'CRM订单',
  quality: '质量管理',
  equipment: '设备管理',
  manufacturing: '生产工单',
};

console.log('=== UPDATING MODULE NAMES ===');
for (const [old, new_] of Object.entries(mapping)) {
  await db.adminWorkflowState.updateMany({ where: { module: old }, data: { module: new_ } });
  await db.adminWorkflowTransition.updateMany({ where: { module: old }, data: { module: new_ } });
  console.log(`  ${old} -> ${new_}`);
}

// 2. Find dead end states that need transitions
const allTrans = await db.adminWorkflowTransition.findMany({ select: { fromStateId: true, toStateId: true } });
const fromSet = new Set(allTrans.map(t => t.fromStateId));
const toSet = new Set(allTrans.map(t => t.toStateId));

const allStates = await db.adminWorkflowState.findMany();
console.log('\n=== STATES WITH NO OUTGOING TRANSITION (not marked end) ===');
for (const s of allStates) {
  if (!fromSet.has(s.id) && !s.isEnd) {
    console.log(`  [${s.module}] ${s.stateName} (${s.id})`);
  }
}

// 3. Add missing transitions for NPI entries
console.log('\n=== ADDING MISSING TRANSITIONS ===');
const fixes = [
  { module: 'NPI项目', fromName: '已立项', toName: '评估中', transName: '提交评估' },
];

for (const fix of fixes) {
  const fromState = await db.adminWorkflowState.findFirst({ where: { module: fix.module, stateName: fix.fromName } });
  const toState = await db.adminWorkflowState.findFirst({ where: { module: fix.module, stateName: fix.toName } });
  if (fromState && toState) {
    await db.adminWorkflowTransition.create({
      data: { module: fix.module, fromStateId: fromState.id, toStateId: toState.id, transitionName: fix.transName, sortOrder: 0 }
    });
    console.log(`  ADDED: [${fix.module}] ${fix.fromName} -> ${fix.toName} (${fix.transName})`);
  } else {
    console.log(`  SKIP: from=${!!fromState} to=${!!toState}`);
  }
}

console.log('\n=== VERIFY ===');
const cnt = await db.adminWorkflowState.groupBy({ by: ['module'], _count: true });
for (const c of cnt) console.log(`  ${c.module}: ${c._count} states`);

await db.$disconnect();
console.log('\nDONE');
