import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  getRoot(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', '..', '..', 'web', 'dist', 'index.html'));
  }
}
