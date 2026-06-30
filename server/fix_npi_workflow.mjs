import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

console.log('=== CURRENT NPI STATES ===');
let states = await db.adminWorkflowState.findMany({ where: { module: 'NPI项目' }, orderBy: { sortOrder: 'asc' } });
states.forEach(s => console.log(`  ${s.stateName} (start=${s.isStart}, end=${s.isEnd})`));

// Add missing NPI states
const missingStates = [
  { stateName: '已审批', sortOrder: 2, isEnd: false },
  { stateName: '进行中', sortOrder: 3, isEnd: false },
  { stateName: '已完成', sortOrder: 4, isEnd: true },
];

console.log('\n=== ADDING MISSING STATES ===');
for (const ms of missingStates) {
  const exists = states.find(s => s.stateName === ms.stateName);
  if (!exists) {
    await db.adminWorkflowState.create({
      data: { module: 'NPI项目', stateCode: ms.stateName, stateName: ms.stateName, sortOrder: ms.sortOrder, isStart: false, isEnd: ms.isEnd }
    });
    console.log(`  ADDED: ${ms.stateName}`);
  } else {
    console.log(`  SKIP: ${ms.stateName} already exists`);
  }
}

// Reload states with new IDs
states = await db.adminWorkflowState.findMany({ where: { module: 'NPI项目' }, orderBy: { sortOrder: 'asc' } });
const stateMap = {};
states.forEach(s => stateMap[s.stateName] = s.id);
console.log('\n=== NPI STATES AFTER FIX ===');
states.forEach(s => console.log(`  ${s.stateName} (id=${s.id.substring(0,8)})`));

// Delete broken transitions that reference non-NPI states (cross-module pollution)
console.log('\n=== CLEANING BROKEN TRANSITIONS ===');
const allTrans = await db.adminWorkflowTransition.findMany({ where: { module: 'NPI项目' } });
const npiStateIds = new Set(states.map(s => s.id));

for (const t of allTrans) {
  if (!npiStateIds.has(t.fromStateId) || !npiStateIds.has(t.toStateId)) {
    await db.adminWorkflowTransition.delete({ where: { id: t.id } });
    console.log(`  DELETED: ${t.transitionName} (cross-module ref)`);
  }
}

// Add correct transitions
const transitions = [
  { from: '已立项', to: '评估中', name: '提交评估' },
  { from: '评估中', to: '已审批', name: '评审通过' },
  { from: '评估中', to: '已取消', name: '取消' },
  { from: '已审批', to: '进行中', name: '启动实施' },
  { from: '进行中', to: '已完成', name: '完成验收' },
];

console.log('\n=== ADDING CORRECT TRANSITIONS ===');
for (const tr of transitions) {
  const fromId = stateMap[tr.from];
  const toId = stateMap[tr.to];
  if (fromId && toId) {
    const exists = await db.adminWorkflowTransition.findFirst({
      where: { module: 'NPI项目', fromStateId: fromId, toStateId: toId }
    });
    if (!exists) {
      await db.adminWorkflowTransition.create({
        data: { module: 'NPI项目', fromStateId: fromId, toStateId: toId, transitionName: tr.name, sortOrder: 0 }
      });
      console.log(`  ADDED: ${tr.from} -> ${tr.to} (${tr.name})`);
    } else {
      console.log(`  SKIP: ${tr.from} -> ${tr.to} already exists`);
    }
  } else {
    console.log(`  ERROR: state not found for ${tr.from}->${tr.to} (fromId=${!!fromId} toId=${!!toId})`);
  }
}

// Final count
const finalTrans = await db.adminWorkflowTransition.count({ where: { module: 'NPI项目' } });
console.log(`\nNPI transitions: ${finalTrans}`);
await db.$disconnect();
console.log('DONE');
