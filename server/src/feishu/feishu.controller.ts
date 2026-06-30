import { Controller, Post, Get, Body, Res, Query } from '@nestjs/common';
import { FeishuService, FeishuMessage } from './feishu.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('feishu')
export class FeishuController {
  constructor(private readonly feishuService: FeishuService) {}

  @Public()
  @Post('send')
  async sendMessage(@Body() body: { text: string }) {
    await this.feishuService.sendText(body.text);
    return { ok: true };
  }

  @Public()
  @Get('messages')
  getMessages(@Query('since') since?: string): FeishuMessage[] {
    return this.feishuService.getMessages(since);
  }

  @Public()
  @Post('inject')
  async inject(@Body() body: { text: string }) {
    const task = {
      timestamp: new Date().toISOString(),
      sender_id: 'api_inject',
      message_id: 'inject_' + Date.now(),
      text: body.text || '',
      raw: { header: { create_time: String(Date.now()) } },
    };
    return this.feishuService.enqueueTask(task);
  }
  async handleEvent(@Body() body: any, @Res() res: any) {
    try {
      if (body.challenge) {
        return res.status(200).json({ challenge: body.challenge });
      }

      if (body.encrypt) {
        const decrypted = this.feishuService.decrypt(body.encrypt);

        if (decrypted.challenge) {
          return res.status(200).json({ challenge: decrypted.challenge });
        }

        if (decrypted.header && decrypted.header.event_type === 'im.message.receive_v1') {
          const msgContent = JSON.parse(decrypted.event?.message?.content || '{}');
          const text = msgContent.text || '';

          this.feishuService.handleIncomingMessage(text, decrypted);
        }

        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(200).json({ ok: true });
    }
  }
}
