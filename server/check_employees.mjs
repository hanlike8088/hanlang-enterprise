import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

console.log('=== ALL EMPLOYEES ===');
const emps = await db.adminEmployee.findMany({ select: { id: true, name: true, orgId: true, positionId: true } });
emps.forEach((e, i) => {
  console.log(`${i+1}. ${e.name || '(no name)'}  pos=${e.positionId?.substring(0,8) || 'none'}  org=${e.orgId?.substring(0,8) || 'none'}`);
});

console.log('\n=== USERS ===');
const users = await db.user.findMany({ select: { id: true, username: true, name: true, role: true } });
users.forEach(u => console.log(`  ${u.username}  name=${u.name}  role=${u.role}`));

await db.$disconnect();
