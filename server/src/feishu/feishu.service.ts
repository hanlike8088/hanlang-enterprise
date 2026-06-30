import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';
import * as fs from 'fs';

const WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/7f4e470c-679a-453b-934c-3fe7bf9e33f5';
const ENCRYPT_KEY = process.env.FEISHU_ENCRYPT_KEY || '6f0ed5f6e2f32954b1f3e1d5aaaa80e8';
const QUEUE_FILE = '/var/www/hanlang-enterprise/.feishu_queue.json';

export interface PurchaseStatusPayload {
  orderCode: string;
  supplierName: string;
  oldStatus: string;
  newStatus: string;
  totalAmount: number;
  operator?: string;
  items?: { materialName: string; quantity: number; unit: string }[];
}

export interface FeishuMessage {
  id: string;
  text: string;
  sender: string;
  chatId: string;
  timestamp: string;
}

@Injectable()
export class FeishuService {
  private readonly logger = new Logger(FeishuService.name);

  // ============================================================
  //  解密 + 事件处理
  // ============================================================

  decrypt(encrypted: string): any {
    if (!ENCRYPT_KEY) return {};
    try {
      const key = crypto.createHash('sha256').update(ENCRYPT_KEY).digest();
      const buf = Buffer.from(encrypted, 'base64');
      const iv = buf.subarray(0, 16);
      const ciphertext = buf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(ciphertext, undefined as any, 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (e: any) {
      this.logger.error('Decrypt failed: ' + e.message);
      return {};
    }
  }

  private BUILTIN = new Set(['help', 'status', 'time']);

  async handleIncomingMessage(text: string, decrypted: any) {
    const sender = decrypted?.event?.sender?.sender_id?.open_id || 'unknown';
    const chatId = decrypted?.event?.message?.chat_id || '';
    const msgId = decrypted?.event?.message?.message_id || Date.now().toString();

    this.logger.log('Incoming [' + sender + ']: ' + text);

    this.saveMessage(msgId, text, sender, chatId);

    const t = text.trim().toLowerCase();
    if (this.BUILTIN.has(t)) {
      const reply = this.processCommand(text);
      await this.sendText(reply);
    } else {
      this.enqueueTask({ text, sender_id: sender, message_id: msgId, raw: decrypted });
      await this.sendText('\ud83d\udce8 \u5df2\u6536\u5230\u4efb\u52a1\uff0c\u4e03\u4ed4\u6b63\u5728\u5904\u7406: ' + text);
    }
  }

  enqueueTask(task: { text: string; sender_id?: string; message_id?: string; raw?: any }): { ok: boolean; file: string } {
    const inboxDir = '/var/www/hanlang-enterprise/.codex/inbox';
    if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });
    const fileName = 'msg_' + Date.now() + '.json';
    const filePath = inboxDir + '/' + fileName;
    const payload = {
      timestamp: new Date().toISOString(),
      sender_id: task.sender_id || 'api',
      message_id: task.message_id || 'inject_' + Date.now(),
      text: task.text || '',
      raw: task.raw || { header: { create_time: String(Date.now()) } },
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    this.logger.log('Task enqueued: ' + filePath);
    return { ok: true, file: fileName };
  }

  // ============================================================
  //  消息队列（JSON 文件）
  // ============================================================

  private saveMessage(id: string, text: string, sender: string, chatId: string) {
    try {
      let queue: FeishuMessage[] = [];
      if (fs.existsSync(QUEUE_FILE)) {
        queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      }
      queue.push({ id, text, sender, chatId, timestamp: new Date().toISOString() });
      if (queue.length > 100) queue = queue.slice(-100);
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
    } catch (e: any) {
      this.logger.error('Save message failed: ' + e.message);
    }
  }

  getMessages(since?: string): FeishuMessage[] {
    try {
      if (!fs.existsSync(QUEUE_FILE)) return [];
      const queue: FeishuMessage[] = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      if (since) return queue.filter(m => m.timestamp > since);
      return queue;
    } catch { return []; }
  }

  clearMessages(): void {
    try { fs.writeFileSync(QUEUE_FILE, '[]', 'utf-8'); } catch {}
  }

  // ============================================================
  //  命令处理（将来接入 AI）
  // ============================================================

  private processCommand(text: string): string {
    const t = text.trim().toLowerCase();

    if (t === 'help') {
      return [
        '\u547d\u4ee4\u5217\u8868:',          // 命令列表:
        'help - \u5e2e\u52a9',                // 帮助
        'status - \u7cfb\u7edf\u72b6\u6001',  // 系统状态
        'time - \u5f53\u524d\u65f6\u95f4',    // 当前时间
        '\u5176\u4ed6\u6d88\u606f \u4e03\u4ed4\u4f1a\u5c3d\u5feb\u5904\u7406',
      ].join('\n');
    }

    if (t === 'status') {
      return '\u7cfb\u7edf\u6b63\u5e38\u8fd0\u884c\u4e2d\n\u540e\u7aef: NestJS @ hanlang.vip\n\u524d\u7aef: React @ hanlang.vip\n\u6570\u636e\u5e93: SQLite';
    }

    if (t === 'time') {
      return '\u5f53\u524d\u65f6\u95f4: ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    }

    return '\u6536\u5230: ' + text + '\n\n\u4e03\u4ed4\u4f1a\u5c3d\u5feb\u5904\u7406\u4f60\u7684\u6d88\u606f\u3002';
  }

  // ============================================================
  //  飞书消息发送
  // ============================================================

  async sendText(text: string) {
    await this.postJson({ msg_type: 'text', content: { text } });
  }

  async sendPurchaseStatusCard(payload: PurchaseStatusPayload) {
    const { orderCode, supplierName, oldStatus, newStatus, totalAmount, operator, items } = payload;
    const statusEmoji = this.statusEmoji(newStatus);
    const itemLines = (items || []).slice(0, 5).map(
      (it) => ({ tag: 'text' as const, text: '\u00b7 ' + it.materialName + ' \u00d7' + it.quantity + it.unit + '\n' }),
    );

    const title = statusEmoji + ' ' + this.t('purchaseOrder') + ' ' + newStatus;
    const body = {
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title,
            content: [
              [
                { tag: 'text', text: this.t('orderCode') + ': ' + orderCode + '\n' },
                { tag: 'text', text: this.t('supplier') + ': ' + supplierName + '\n' },
                { tag: 'text', text: this.t('statusChange') + ': ' + oldStatus + ' \u2192 ' + newStatus + '\n' },
                { tag: 'text', text: this.t('totalAmount') + ': \u00a5' + (totalAmount || 0).toLocaleString() + '\n' },
                { tag: 'text', text: this.t('operator') + ': ' + (operator || this.t('system')) + '\n' },
              ],
              [{ tag: 'text', text: '\n\u2014\u2014\u2014 ' + this.t('itemDetail') + ' \u2014\u2014\u2014\n' }],
              [...itemLines],
              [{ tag: 'text', text: this.footer() }],
            ],
          },
        },
      },
    };

    if (!items || items.length === 0) {
      body.content.post.zh_cn.content = body.content.post.zh_cn.content.filter(
        (_: any, i: number) => i !== 1 && i !== 2,
      );
    }

    await this.postJson(body);
  }

  // ============================================================
  //  内部工具
  // ============================================================

  private t(key: string): string {
    const map: Record<string, string> = {
      purchaseOrder: '\u91c7\u8d2d\u8ba2\u5355',
      orderCode:     '\u8ba2\u5355\u7f16\u53f7',
      supplier:      '\u4f9b\u5e94\u5546',
      statusChange:  '\u72b6\u6001\u53d8\u66f4',
      totalAmount:   '\u8ba2\u5355\u91d1\u989d',
      operator:      '\u64cd\u4f5c\u4eba',
      system:        '\u7cfb\u7edf',
      itemDetail:    '\u7269\u6599\u660e\u7ec6',
      hanlangSystem: '\u701a\u6717\u7ba1\u7406\u7cfb\u7edf',
    };
    return map[key] || key;
  }

  private statusEmoji(status: string): string {
    const map: Record<string, string> = {
      '\u8349\u7a3f':             '\uD83D\uDCDD',
      '\u5df2\u786e\u8ba4':       '\uD83D\uDCCB',
      '\u4f9b\u5e94\u5546\u786e\u8ba4': '\uD83E\uDD1D',
      '\u5df2\u53d1\u8d27':       '\uD83D\uDE9A',
      '\u5df2\u5230\u8d27':       '\uD83D\uDCE6',
      '\u68c0\u9a8c\u4e2d':       '\uD83D\uDD0D',
      '\u5df2\u5165\u5e93':       '\u2705',
      '\u5df2\u5173\u95ed':       '\uD83D\uDD12',
    };
    return map[status] || '\uD83D\uDCCC';
  }

  private footer(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    return '\n\uD83D\uDD50 ' + ts + ' \u00b7 ' + this.t('hanlangSystem');
  }

  private postJson(body: any): Promise<void> {
    return new Promise((resolve) => {
      const json = JSON.stringify(body);
      const buf = Buffer.from(json, 'utf-8');
      const url = new URL(WEBHOOK);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': String(Buffer.byteLength(json, 'utf-8')),
        },
      }, (res) => {
        let raw = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk: string) => { raw += chunk; });
        res.on('end', () => {
          try { const data = JSON.parse(raw); if (data.code !== 0) this.logger.error('Feishu err: ' + raw); } catch {}
          resolve();
        });
      });
      req.on('error', () => resolve());
      req.write(buf);
      req.end();
    });
  }
}
