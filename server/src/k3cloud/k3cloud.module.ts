 import { Module } from '@nestjs/common';
 import { PrismaModule } from '../prisma/prisma.module';
 import { K3CloudController } from './k3cloud.controller';
 import { K3CloudService } from './k3cloud.service';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'k3cloud:view',  permName: '金蝶查询', resource: 'k3cloud', action: 'read',  description: '查看金蝶对接数据' },
   { permCode: 'k3cloud:write', permName: '金蝶操作', resource: 'k3cloud', action: 'write', description: '金蝶写操作（需confirmed:true）' },
 ]);
 
 @Module({
  imports: [PrismaModule],
  controllers: [K3CloudController],
  providers: [K3CloudService],
  exports: [K3CloudService],
})
export class K3CloudModule {}
