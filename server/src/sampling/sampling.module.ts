 import { Module } from '@nestjs/common';
 import { SamplingController } from './sampling.controller';
 import { SamplingService } from './sampling.service';
 import { PrismaModule } from '../prisma/prisma.module';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'sampling:order:read',  permName: '查看打样工单', resource: 'sampling', action: 'read',  description: '查看打样工单' },
   { permCode: 'sampling:order:write', permName: '管理打样工单', resource: 'sampling', action: 'write', description: '管理打样工单和流转' },
 ]);
 
 @Module({ imports: [PrismaModule], controllers: [SamplingController], providers: [SamplingService], exports: [SamplingService] })
export class SamplingModule {}
