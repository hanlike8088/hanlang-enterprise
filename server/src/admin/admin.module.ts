 import { Module } from '@nestjs/common';
import { FeishuModule } from '../feishu/feishu.module';
 import { AdminController } from './admin.controller';
import { AdminExtendedController } from './admin-extended.controller';
 import { AdminService } from './admin.service';

 import { PermissionRegistry } from '../common/permission-registry';
 
 // Self-register permission codes for this module
 PermissionRegistry.registerBatch([
   { permCode: 'admin:org:read',         permName: '查看组织',  resource: 'admin', action: 'read',  description: '查看组织架构' },
   { permCode: 'admin:org:write',        permName: '管理组织',  resource: 'admin', action: 'write', description: '新增/编辑/删除组织' },
   { permCode: 'admin:position:read',    permName: '查看岗位',  resource: 'admin', action: 'read',  description: '查看岗位信息' },
   { permCode: 'admin:position:write',   permName: '管理岗位',  resource: 'admin', action: 'write', description: '新增/编辑/删除岗位' },
   { permCode: 'admin:employee:read',    permName: '查看员工',  resource: 'admin', action: 'read',  description: '查看员工信息' },
   { permCode: 'admin:employee:write',   permName: '管理员工',  resource: 'admin', action: 'write', description: '新增/编辑/删除员工' },
   { permCode: 'admin:role:read',        permName: '查看角色权限', resource: 'admin', action: 'read',  description: '查看角色和权限配置' },
   { permCode: 'admin:role:write',       permName: '管理角色权限', resource: 'admin', action: 'write', description: '管理角色/权限/绑定' },
   { permCode: 'admin:permission:read',  permName: '查看权限定义', resource: 'admin', action: 'read',  description: '查看权限代码定义' },
   { permCode: 'admin:permission:write', permName: '管理权限定义', resource: 'admin', action: 'write', description: '创建/编辑/删除权限代码' },
   { permCode: 'admin:codingrule:read',  permName: '查看编码规则', resource: 'admin', action: 'read',  description: '查看编码规则配置' },
   { permCode: 'admin:codingrule:write', permName: '管理编码规则', resource: 'admin', action: 'write', description: '管理编码规则' },
   { permCode: 'admin:workflow:read',    permName: '查看工作流', resource: 'admin', action: 'read',  description: '查看工作流状态和转换' },
   { permCode: 'admin:workflow:write',   permName: '管理工作流', resource: 'admin', action: 'write', description: '管理工作流配置' },
   { permCode: 'admin:setting:read',     permName: '查看系统设置', resource: 'admin', action: 'read',  description: '查看系统参数设置' },
   { permCode: 'admin:setting:write',    permName: '管理系统设置', resource: 'admin', action: 'write', description: '修改系统参数设置' },
 ]);
 
 @Module({
  imports: [FeishuModule],
  controllers: [AdminController, AdminExtendedController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
