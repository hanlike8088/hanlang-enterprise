 import { Module } from '@nestjs/common';
 import { CrmController } from './crm.controller';
 import { CrmService } from './crm.service';
 import { K3CloudModule } from '../k3cloud/k3cloud.module';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'crm:customer:read',       permName: '查看客户',       resource: 'crm', action: 'read',  description: '查看客户信息' },
   { permCode: 'crm:customer:write',      permName: '管理客户',       resource: 'crm', action: 'write', description: '管理客户档案' },
   { permCode: 'crm:contact:read',        permName: '查看联系记录',   resource: 'crm', action: 'read',  description: '查看客户联系记录' },
   { permCode: 'crm:contact:write',       permName: '管理联系记录',   resource: 'crm', action: 'write', description: '管理客户联系记录' },
   { permCode: 'crm:quote:read',          permName: '查看报价',       resource: 'crm', action: 'read',  description: '查看报价单' },
   { permCode: 'crm:quote:write',         permName: '管理报价',       resource: 'crm', action: 'write', description: '管理报价单' },
   { permCode: 'crm:order:read',          permName: '查看销售订单',   resource: 'crm', action: 'read',  description: '查看销售订单' },
   { permCode: 'crm:order:write',         permName: '管理销售订单',   resource: 'crm', action: 'write', description: '管理销售订单' },
   { permCode: 'crm:complaint:read',      permName: '查看客诉',       resource: 'crm', action: 'read',  description: '查看客诉记录' },
   { permCode: 'crm:complaint:write',     permName: '管理客诉',       resource: 'crm', action: 'write', description: '管理客诉记录' },
   { permCode: 'crm:reconciliation:read', permName: '查看应收对账',   resource: 'crm', action: 'read',  description: '查看客户对账' },
   { permCode: 'crm:reconciliation:write',permName: '管理应收对账',   resource: 'crm', action: 'write', description: '管理客户对账' },
   { permCode: 'crm:payment:read',        permName: '查看收款',       resource: 'crm', action: 'read',  description: '查看收款记录' },
   { permCode: 'crm:payment:write',       permName: '管理收款',       resource: 'crm', action: 'write', description: '管理收款记录' },
 ]);
 
 @Module({
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
  imports: [K3CloudModule],
})
export class CrmModule {}