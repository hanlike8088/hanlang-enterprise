 import { Module } from '@nestjs/common';
 import { DrawingController } from './drawing.controller';
 import { DrawingService } from './drawing.service';
 import { PrismaModule } from '../prisma/prisma.module';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'drawing:drawing:read',  permName: '查看图纸', resource: 'drawing', action: 'read',  description: '查看图纸和版本' },
   { permCode: 'drawing:drawing:write', permName: '管理图纸', resource: 'drawing', action: 'write', description: '管理图纸和版本' },
 ]);
 
 @Module({ imports: [PrismaModule], controllers: [DrawingController], providers: [DrawingService], exports: [DrawingService] })
export class DrawingModule {}
