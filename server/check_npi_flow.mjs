import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

console.log('=== NPI STATES ===');
const states = await db.adminWorkflowState.findMany({ where: { module: 'NPI项目' }, orderBy: { sortOrder: 'asc' } });
states.forEach(s => console.log(`  ${s.stateName}  start=${s.isStart} end=${s.isEnd}  id=${s.id.substring(0,8)}`));

console.log('\n=== NPI TRANSITIONS (unique) ===');
const trans = await db.adminWorkflowTransition.findMany({ where: { module: 'NPI项目' }, orderBy: { sortOrder: 'asc' } });
const stMap = {}; states.forEach(s => stMap[s.id] = s.stateName);
const seen = new Set();
trans.forEach(t => {
  const key = t.fromStateId + '->' + t.toStateId;
  if (!seen.has(key)) {
    seen.add(key);
    const from = stMap[t.fromStateId] || t.fromStateId.substring(0,8);
    const to = stMap[t.toStateId] || t.toStateId.substring(0,8);
    console.log(`  ${from} -> ${to}  (${t.transitionName})`);
  }
});

console.log('\n=== ORGANIZATIONS ===');
const orgs = await db.adminOrganization.findMany();
orgs.forEach(o => console.log(`  ${o.orgName} (${o.id.substring(0,8)})`));

console.log('\n=== ROLES ===');
const roles = await db.adminRole.findMany();
roles.forEach(r => console.log(`  ${r.roleName} (${r.id.substring(0,8)})`));

console.log('\n=== POSITIONS ===');
const pos = await db.adminPosition.findMany();
if (pos.length === 0) console.log('  (none)');
else pos.forEach(p => console.log(`  ${p.positionName} (${p.id.substring(0,8)})`));

console.log('\n=== EMPLOYEES ===');
const emp = await db.adminEmployee.findMany();
emp.forEach(e => console.log(`  ${e.employeeName} org=${e.orgId?.substring(0,8)}`));

await db.$disconnect();
