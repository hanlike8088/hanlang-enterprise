const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const INBOX_DIR = '/var/www/hanlang-enterprise/server/inbox';
const WEBHOOK_URL = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id';
const APP_ID = 'cli_aac9c2fd77fcdbdf';
const APP_SECRET = process.env.FEISHU_APP_SECRET || "";
const CHAT_ID = 'oc_9e15fcacf87bed2e8cf46b5949f8d34e';

let token = null;
let tokenExpire = 0;

async function getToken() {
    if (token && Date.now() < tokenExpire) return token;
    const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    const data = await res.json();
    token = data.tenant_access_token;
    tokenExpire = Date.now() + 3500 * 1000;
    return token;
}

async function sendMsg(text) {
    const t = await getToken();
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receive_id: CHAT_ID, msg_type: 'text', content: JSON.stringify({ text: text.substring(0, 4000) }) })
    });
}

async function processFile(file) {
    const fp = path.join(INBOX_DIR, file);
    try {
        const raw = fs.readFileSync(fp, 'utf8');
        const cmd = JSON.parse(raw).text;
        console.log('Exec:', cmd);
        exec(cmd, { timeout: 60000, maxBuffer: 1024 * 1024 }, async (err, stdout, stderr) => {
            let result = '';
            if (stdout) result += stdout;
            if (stderr) result += stderr;
            if (err && !result) result = 'Error: ' + err.message;
            const msg = '✅ ' + cmd.substring(0, 80) + (result ? '\n' + result.substring(0, 3000) : '');
            await sendMsg(msg);
        });
    } catch(e) {
        console.error('Process error:', e.message);
    }
    try { fs.unlinkSync(fp); } catch(e) {}
}

if (!fs.existsSync(INBOX_DIR)) fs.mkdirSync(INBOX_DIR, { recursive: true });
console.log('Feishu worker started, watching', INBOX_DIR);

setInterval(() => {
    try {
        const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json')).sort();
        files.forEach(processFile);
    } catch(e) {}
}, 3000);
