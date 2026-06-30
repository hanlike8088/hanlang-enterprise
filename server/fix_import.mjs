import { PrismaClient } from '@prisma/client';
import p from 'pinyin';
const pinyin = p.default || p;

const db = new PrismaClient();

function toPinyin(name) {
  if (!name) return null;
  if (!/[\u4e00-\u9fff]/.test(name)) {
    return name.toLowerCase().replace(/[^a-z]/g, '');
  }
  const result = pinyin(name, { style: pinyin.STYLE_NORMAL, heteronym: false });
  return result.map(arr => arr[0]).join('').toLowerCase();
}

const users = await db.user.findMany();
console.log(Total users: );

let updated = 0;
let skipped = 0;
const usedNames = new Map();

const planned = [];
for (const user of users) {
  const py = toPinyin(user.name);
  if (!py || py === 'admin' || py === 'adm' || py === 'testuser') { skipped++; continue; }
  if (user.name.includes('车间') || user.name.includes('巡检卡')) { skipped++; continue; }
  const cnt = usedNames.get(py) || 0;
  usedNames.set(py, cnt + 1);
  planned.push({ user, py });
}

const seen = {};
for (const { user, py } of planned) {
  seen[py] = (seen[py] || 0) + 1;
  let final = py;
  if (usedNames.get(py) > 1) final = py + '-' + seen[py];
  if (user.username !== final) {
    await db.user.update({ where: { id: user.id }, data: { username: final } });
    console.log(${user.username} ->   ());
    updated++;
  }
}
console.log(\nUpdated:   Skipped: );
await db.();
