 import { Module } from '@nestjs/common';
 import { PrismaModule } from '../prisma/prisma.module';
 import { PurchaseService } from './purchase.service';
 import { PurchaseController } from './purchase.controller';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'purchase:order:read',   permName: '查看采购单', resource: 'purchase', action: 'read',  description: '查看采购订单' },
   { permCode: 'purchase:order:write',  permName: '管理采购单', resource: 'purchase', action: 'write', description: '管理采购订单' },
   { permCode: 'purchase:receipt:read', permName: '查看收货单', resource: 'purchase', action: 'read',  description: '查看收货记录' },
   { permCode: 'purchase:receipt:write',permName: '管理收货单', resource: 'purchase', action: 'write', description: '管理收货记录' },
 ]);
 
 @Module({
  imports: [PrismaModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
