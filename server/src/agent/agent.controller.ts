import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { exec } from 'child_process';
import { Public } from '../common/decorators/public.decorator';

@Controller('agent')
@Public()
export class AgentController {
  @Post('exec')
  async exec(@Body() body: { cmd: string; token: string }) {
    if (body.token !== (process.env.AGENT_TOKEN || 'hanlang-agent-2026')) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return new Promise((resolve) => {
      exec(body.cmd, { timeout: 30000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
        resolve({ ok: !error, stdout: stdout || '', stderr: stderr || '', code: error?.code || 0 });
      });
    });
  }
}
