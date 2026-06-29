import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

const UPLOAD_DIR = '/var/www/hanlang-enterprise/uploads';

@Injectable()
export class FilesService {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  saveFile(file: any) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  listFiles() {
    const files = fs.readdirSync(UPLOAD_DIR);
    return files.map(f => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, f));
      return { filename: f, size: stat.size, createdAt: stat.birthtime };
    });
  }

  getFilePath(filename: string) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('文件不存在');
    return filePath;
  }

  deleteFile(filename: string) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('文件不存在');
    fs.unlinkSync(filePath);
    return { message: 'deleted' };
  }
}
