import { PrismaClient } from " @prisma/client\;
import p from \pinyin\;
const pinyin = p.default || p;
const db = new PrismaClient();

// Convert Chinese name to pinyin lowercase (no spaces)
function toPinyin(name) {
  if (!name) return null;
  // Check if name contains Chinese characters
  if (!/[\u4e00-\u9fff]/.test(name)) {
    // Already pinyin/English - just lowercase it, remove spaces
    return name.toLowerCase().replace(/[^a-z]/g, '');
  }
  // Convert Chinese to pinyin
  const result = pinyin(name, { style: pinyin.STYLE_NORMAL, heteronym: false });
  return result.map(arr => arr[0]).join('').toLowerCase();
}

// Get all users
const users = await db.user.findMany();
console.log(`Total users: ${users.length}`);

let updated = 0;
let skipped = 0;
const usedNames = new Map(); // pinyin -> count

// First pass: compute all pinyin names and detect duplicates
const planned = [];
for (const user of users) {
  const pinyinName = toPinyin(user.name);
  if (!pinyinName || pinyinName === 'admin' || pinyinName === 'adm' || pinyinName === 'testuser') {
    skipped++;
    continue;
  }
  // Skip production line / inspection card accounts
  if (user.name.includes('车间') || user.name.includes('巡检卡')) {
    skipped++;
    continue;
  }
  const count = usedNames.get(pinyinName) || 0;
  usedNames.set(pinyinName, count + 1);
  planned.push({ user, pinyinName });
}

// Second pass: update with dedup
const seen = {};
for (const { user, pinyinName } of planned) {
  seen[pinyinName] = (seen[pinyinName] || 0) + 1;
  let finalName = pinyinName;
  if (usedNames.get(pinyinName) > 1) {
    finalName = pinyinName + '-' + seen[pinyinName];
  }
  if (user.username !== finalName) {
    await db.user.update({ where: { id: user.id }, data: { username: finalName } });
    console.log(`  ${user.username} -> ${finalName}  (${user.name})`);
    updated++;
  }
}

console.log(`\nUpdated: ${updated}  Skipped: ${skipped}`);
console.log(`Duplicate names requiring suffix: ${[...usedNames.entries()].filter(([,c]) => c > 1).length}`);

await db.$disconnect();
