import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const states = await db.adminWorkflowState.groupBy({ by: ['module'], _count: true, orderBy: { module: 'asc' } });
console.log('=== STATES ===');
for (const s of states) console.log(`  ${s.module}: ${s._count} states`);

const trans = await db.adminWorkflowTransition.groupBy({ by: ['module'], _count: true, orderBy: { module: 'asc' } });
console.log('\n=== TRANSITIONS ===');
for (const t of trans) console.log(`  ${t.module}: ${t._count} transitions`);

const npi = await db.npiProject.count();
const swo = await db.samplingWorkOrder.count();
console.log(`\nNpiProject: ${npi}  SamplingWorkOrder: ${swo}  CrmQuote: ${await db.crmQuote.count()}  CrmOrder: ${await db.crmOrder.count()}`);

console.log('\n=== TRANSITION DETAILS (no include, safe from FK orphans) ===');
const allStates = await db.adminWorkflowState.findMany({ select: { id: true, stateName: true, module: true } });
const stateMap = {};
for (const s of allStates) stateMap[s.id] = s.stateName;

const allTrans = await db.adminWorkflowTransition.findMany({ orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }], select: { module: true, transitionName: true, fromStateId: true, toStateId: true } });

const modTrans = {};
for (const t of allTrans) {
  if (!modTrans[t.module]) modTrans[t.module] = [];
  modTrans[t.module].push(t);
}

for (const [mod, tlist] of Object.entries(modTrans)) {
  console.log(`\n--- ${mod} (${tlist.length} transitions) ---`);
  for (const t of tlist) console.log(`  ${stateMap[t.fromStateId] || t.fromStateId} -> ${stateMap[t.toStateId] || t.toStateId}  (${t.transitionName})`);
}

console.log('\n=== DEAD-END CHECK ===');
for (const [mod, tlist] of Object.entries(modTrans)) {
  const toStates = new Set(tlist.map(t => t.toStateId));
  const fromStates = new Set(tlist.map(t => t.fromStateId));
  const deadEnds = [...toStates].filter(s => !fromStates.has(s));
  const stateNames = allStates.filter(s => s.module === mod);
  const endStates = stateNames.filter(s => s.isEnd);
  const realDeadEnds = deadEnds.filter(s => !endStates.some(es => es.id === s));
  if (realDeadEnds.length > 0) {
    console.log(`  ${mod}: ${realDeadEnds.map(s => stateMap[s] || s).join(', ')} - NO NEXT STEP`);
  }
}

await db.$disconnect();
