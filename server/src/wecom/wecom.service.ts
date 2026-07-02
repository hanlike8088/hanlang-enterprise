import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

const WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ead51abd-ce06-4c7c-87cf-e08d5e957c55';

export interface PurchaseStatusPayload {
  orderCode: string;
  supplierName: string;
  oldStatus: string;
  newStatus: string;
  totalAmount: number;
  operator?: string;
  items?: { materialName: string; quantity: number; unit: string }[];
}

@Injectable()
export class WecomService {
  private readonly logger = new Logger(WecomService.name);

  private statusEmoji(status: string): string {
    const map: Record<string, string> = {
      '\u8349\u7a3f':         '\uD83D\uDCDD',
      '\u5df2\u786e\u8ba4':   '\uD83D\uDCCB',
      '\u4f9b\u5e94\u5546\u786e\u8ba4': '\uD83E\uDD1D',
      '\u5df2\u53d1\u8d27':   '\uD83D\uDE9A',
      '\u5df2\u5230\u8d27':   '\uD83D\uDCE6',
      '\u68c0\u9a8c\u4e2d':   '\uD83D\uDD0D',
      '\u5df2\u5165\u5e93':   '\u2705',
      '\u5df2\u5173\u95ed':   '\uD83D\uDD12',
    };
    return map[status] || '\uD83D\uDCCC';
  }

  private postJson(body: any): Promise<void> {
    return new Promise((resolve) => {
      const json = JSON.stringify(body);
      const url = new URL(WEBHOOK);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }, (res) => {
        let raw = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk: string) => { raw += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (data.errcode !== 0) this.logger.error('WeCom webhook err: ' + raw);
          } catch {}
          resolve();
        });
      });
      req.on('error', (e) => { this.logger.error('WeCom webhook failed: ' + e.message); resolve(); });
      req.write(Buffer.from(json, 'utf-8'));
      req.end();
    });
  }

  async sendText(text: string): Promise<void> {
    await this.postJson({ msgtype: 'text', text: { content: text } });
  }

  async sendPurchaseStatusCard(payload: PurchaseStatusPayload): Promise<void> {
    const emoji = this.statusEmoji(payload.newStatus);
    const items = payload.items?.length
      ? '\n>' + payload.items.map(i => '\u2022 ' + i.materialName + ' \u00d7' + i.quantity + ' ' + i.unit).join('\n>')
      : '';

    const markdown = [
      '## ' + emoji + ' \u91c7\u8d2d\u5355\u72b6\u6001\u53d8\u66f4',
      '> \u8ba2\u5355\u53f7: <font color=\"info\">' + payload.orderCode + '</font>',
      '> \u4f9b\u5e94\u5546: ' + payload.supplierName,
      '> \u72b6\u6001: ' + payload.oldStatus + ' \u2192 <font color=\"warning\">' + payload.newStatus + '</font>',
      '> \u91d1\u989d: <font color=\"warning\">\uffe5' + payload.totalAmount.toFixed(2) + '</font>',
      items,
      '> \u64cd\u4f5c\u4eba: ' + (payload.operator || '\u7cfb\u7edf') + ' | \u701a\u6717\u7ba1\u7406\u7cfb\u7edf',
    ].filter(l => l).join('\n');

    await this.postJson({ msgtype: 'markdown', markdown: { content: markdown } });
  }
}
