import { PrismaClient } from '@prisma/client';
import p from 'pinyin';
const pinyin = p.default || p;
import bcrypt from 'bcrypt';
const db = new PrismaClient();

// Get all employees and users
const emps = await db.adminEmployee.findMany({ select: { name: true, email: true, employeeCode: true } });
const users = await db.user.findMany({ select: { name: true, username: true } });
const userNames = new Set(users.map(function(u) { return u.name; }));

// Find unbound employees
const unbound = emps.filter(function(e) { return !userNames.has(e.name); });
console.log('Total employees: ' + emps.length);
console.log('Bound (have user): ' + (emps.length - unbound.length));
console.log('Unbound (no user): ' + unbound.length);

if (unbound.length === 0) {
  console.log('All employees already have accounts!');
  await db.$disconnect();
  process.exit(0);
}

// Generate password hash
const hash = await bcrypt.hash('123456', 10);

// Create users for unbound employees
var created = 0;
var skipped = 0;
for (var i = 0; i < unbound.length; i++) {
  var e = unbound[i];
  // Generate pinyin username
  var py = '';
  if (/[\u4e00-\u9fff]/.test(e.name)) {
    py = pinyin(e.name, { style: pinyin.STYLE_NORMAL, heteronym: false })
      .map(function(a) { return a[0]; }).join('').toLowerCase();
  } else {
    py = e.name.toLowerCase().replace(/[^a-z]/g, '');
  }
  if (!py || py.length < 2) { skipped++; continue; }

  // Check username uniqueness
  var exists = await db.user.findUnique({ where: { username: py } });
  if (exists) { py = py + '-' + e.employeeCode; }

  try {
    await db.user.create({
      data: {
        username: py,
        password: hash,
        name: e.name,
        email: e.email || py + '@hanlang.vip',
        role: 'user',
      }
    });
    console.log('  CREATED: ' + e.name + ' -> ' + py);
    created++;
  } catch (err) {
    console.log('  SKIP: ' + e.name + ' - ' + err.message.substring(0, 60));
    skipped++;
  }
}

console.log('\nCreated: ' + created + '  Skipped: ' + skipped);
await db.$disconnect();
