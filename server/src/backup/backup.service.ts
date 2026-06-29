import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(createdBy?: string, type = 'manual') {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file not found');
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${type}-${timestamp}.db`;
    const destPath = path.join(this.backupDir, fileName);
    fs.copyFileSync(dbPath, destPath);
    const stat = fs.statSync(destPath);
    const record = await this.prisma.systemBackup.create({
      data: {
        fileName,
        fileSize: stat.size,
        path: destPath,
        type,
        status: 'completed',
        createdBy: createdBy || 'system',
      },
    });
    this.logger.log(`Backup created: ${fileName}`);
    return record;
  }

  async listBackups() {
    return this.prisma.systemBackup.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getBackup(id: string) {
    return this.prisma.systemBackup.findUnique({ where: { id } });
  }

  async deleteBackup(id: string) {
    const record = await this.prisma.systemBackup.findUnique({ where: { id } });
    if (!record) throw new Error('Backup not found');
    if (fs.existsSync(record.path)) fs.unlinkSync(record.path);
    return this.prisma.systemBackup.delete({ where: { id } });
  }

  async restoreBackup(id: string) {
    const record = await this.prisma.systemBackup.findUnique({ where: { id } });
    if (!record) throw new Error('Backup not found');
    if (!fs.existsSync(record.path)) throw new Error('Backup file not on disk');
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const preRestorePath = dbPath + '.pre-restore-' + Date.now();
    fs.copyFileSync(dbPath, preRestorePath);
    fs.copyFileSync(record.path, dbPath);
    this.logger.log(`Database restored from: ${record.fileName}`);
    return { success: true, preRestorePath };
  }
}
