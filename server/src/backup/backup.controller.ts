import { Controller, Get, Post, Delete, Param, Res } from '@nestjs/common';
import { BackupService } from './backup.service';
import type { Response } from 'express';
import * as fs from 'fs';

@Controller('api/backups')
export class BackupController {
  constructor(private readonly svc: BackupService) {}
  @Post() async create() { return this.svc.createBackup(); }
  @Get() async list() { return this.svc.listBackups(); }
  @Get(':id') async getOne(@Param('id') id: string) { return this.svc.getBackup(id); }
  @Get(':id/download') async download(@Param('id') id: string, @Res() res: Response) {
    const record = await this.svc.getBackup(id);
    if (!record || !fs.existsSync(record.path)) return res.status(404).json({ error: '备份文件不存在' });
    return res.download(record.path, record.fileName);
  }
  @Post(':id/restore') async restore(@Param('id') id: string) { return this.svc.restoreBackup(id); }
  @Delete(':id') async delete(@Param('id') id: string) { return this.svc.deleteBackup(id); }
}
