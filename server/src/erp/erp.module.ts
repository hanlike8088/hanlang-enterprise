 import { Module } from '@nestjs/common';
 import { ErpController } from './erp.controller';
 import { ErpService } from './erp.service';
 import { K3CloudModule } from '../k3cloud/k3cloud.module';
 
 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'erp:material:read',     permName: '查看物料', resource: 'erp', action: 'read',  description: '查看物料信息' },
   { permCode: 'erp:material:write',    permName: '管理物料', resource: 'erp', action: 'write', description: '管理物料数据' },
   { permCode: 'erp:work-order:read',   permName: '查看工单', resource: 'erp', action: 'read',  description: '查看生产工单' },
   { permCode: 'erp:work-order:write',  permName: '管理工单', resource: 'erp', action: 'write', description: '管理生产工单' },
 ]);
 
 @Module({
   controllers: [ErpController],
   providers: [ErpService],
   exports: [ErpService],
   imports: [K3CloudModule],
 })
 export class ErpModule {}
 