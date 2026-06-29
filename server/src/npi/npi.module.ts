 import { Module } from '@nestjs/common';
 import { NpiController } from './npi.controller';
 import { NpiService } from './npi.service';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'npi:project:read',  permName: '查看NPI项目', resource: 'npi', action: 'read',  description: '查看NPI项目信息' },
   { permCode: 'npi:project:write', permName: '管理NPI项目', resource: 'npi', action: 'write', description: '新增/编辑NPI项目' },
   { permCode: 'npi:trial:read',    permName: '查看试产',    resource: 'npi', action: 'read',  description: '查看试产记录' },
   { permCode: 'npi:trial:write',   permName: '管理试产',    resource: 'npi', action: 'write', description: '管理试产流程' },
   { permCode: 'npi:issue:read',    permName: '查看问题',    resource: 'npi', action: 'read',  description: '查看问题跟踪' },
   { permCode: 'npi:issue:write',   permName: '管理问题',    resource: 'npi', action: 'write', description: '管理问题记录' },
   { permCode: 'npi:approval:read', permName: '查看审批',    resource: 'npi', action: 'read',  description: '查看NPI审批' },
   { permCode: 'npi:approval:write',permName: '管理审批',    resource: 'npi', action: 'write', description: '管理NPI审批流程' },
 ]);
 
 @Module({
  controllers: [NpiController],
  providers: [NpiService],
  exports: [NpiService],
})
export class NpiModule {}
