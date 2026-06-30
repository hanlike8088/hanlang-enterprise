import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

console.log('=== USERS (accounts) ===');
const users = await db.user.findMany();
for (const u of users) console.log(`  ${u.username} | ${u.name} | ${u.role}`);

console.log('\n=== EMPLOYEES (first 30) ===');
const emps = await db.adminEmployee.findMany({ take: 30, select: { employeeCode: true, name: true, email: true } });
for (const e of emps) console.log(`  ${e.employeeCode} | ${e.name || '-'} | ${e.email || '-'}`);

console.log('\n=== EMPLOYEES (next 30) ===');
const emps2 = await db.adminEmployee.findMany({ skip: 30, take: 30, select: { employeeCode: true, name: true, email: true } });
for (const e of emps2) console.log(`  ${e.employeeCode} | ${e.name || '-'} | ${e.email || '-'}`);

await db.$disconnect();
