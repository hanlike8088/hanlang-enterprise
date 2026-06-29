import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { Response } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: '/var/www/hanlang-enterprise/uploads',
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, crypto.randomUUID() + ext);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadFile(@UploadedFile() file: any) {
    return this.filesService.saveFile(file);
  }

  @Get()
  listFiles() { return this.filesService.listFiles(); }

  @Get(':filename')
  downloadFile(@Param('filename') filename: string, @Res() res: any) {
    const filePath = this.filesService.getFilePath(filename);
    return res.download(filePath, (err: any) => {
      if (err) res.status(404).json({ message: '文件不存在' });
    });
  }

  @Delete(':filename')
  deleteFile(@Param('filename') filename: string) {
    return this.filesService.deleteFile(filename);
  }
}
