 import { Module } from '@nestjs/common';
 import { PrismaModule } from '../prisma/prisma.module';
 import { WarehouseService } from './warehouse.service';
 import { WarehouseController } from './warehouse.controller';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'warehouse:warehouse:read',  permName: '查看仓库', resource: 'warehouse', action: 'read',  description: '查看仓库信息' },
   { permCode: 'warehouse:warehouse:write', permName: '管理仓库', resource: 'warehouse', action: 'write', description: '管理仓库档案' },
   { permCode: 'warehouse:location:read',   permName: '查看库位', resource: 'warehouse', action: 'read',  description: '查看库位信息' },
   { permCode: 'warehouse:location:write',  permName: '管理库位', resource: 'warehouse', action: 'write', description: '管理库位档案' },
   { permCode: 'warehouse:inventory:read',  permName: '查看库存', resource: 'warehouse', action: 'read',  description: '查看库存数据' },
   { permCode: 'warehouse:inventory:write', permName: '管理库存', resource: 'warehouse', action: 'write', description: '管理出入库/ABC分类' },
 ]);
 
 @Module({ imports: [PrismaModule], controllers: [WarehouseController], providers: [WarehouseService], exports: [WarehouseService] })
export class WarehouseModule {}
