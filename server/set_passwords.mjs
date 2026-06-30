import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const db = new PrismaClient();
const hash = await bcrypt.hash('123456', 10);
const users = await db.user.findMany({ where: { username: { not: 'admin' } } });
for (const u of users) {
  await db.user.update({ where: { id: u.id }, data: { password: hash } });
}
console.log(users.length + ' passwords set to 123456');
await db.$disconnect();
