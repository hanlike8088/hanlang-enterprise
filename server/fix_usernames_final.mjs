import { PrismaClient } from '@prisma/client';
import p from 'pinyin';
const pinyin = p.default || p;
const db = new PrismaClient();

function toPinyin(name) {
  if (!name) return null;
  if (!/[\u4e00-\u9fff]/.test(name)) return name.toLowerCase().replace(/[^a-z]/g, '');
  const r = pinyin(name, { style: pinyin.STYLE_NORMAL, heteronym: false });
  return r.map(function(a) { return a[0]; }).join('').toLowerCase();
}

var users = await db.user.findMany();
console.log('Total users: ' + users.length);

var updated = 0;
var skipped = 0;
var usedNames = new Map();
var planned = [];

for (var i = 0; i < users.length; i++) {
  var user = users[i];
  var py = toPinyin(user.name);
  if (!py || py === 'admin' || py === 'adm' || py === 'testuser') { skipped++; continue; }
  if (user.name.indexOf('车间') >= 0 || user.name.indexOf('巡检卡') >= 0) { skipped++; continue; }
  var cnt = usedNames.get(py) || 0;
  usedNames.set(py, cnt + 1);
  planned.push({ user: user, py: py });
}

var seen = {};
for (var j = 0; j < planned.length; j++) {
  var item = planned[j];
  var py = item.py;
  var user = item.user;
  seen[py] = (seen[py] || 0) + 1;
  var final = py;
  if (usedNames.get(py) > 1) final = py + '-' + seen[py];
  if (user.username !== final) {
    await db.user.update({ where: { id: user.id }, data: { username: final } });
    console.log(user.username + ' -> ' + final);
    updated++;
  }
}

console.log('\nUpdated: ' + updated + '  Skipped: ' + skipped);
await db.$disconnect();
