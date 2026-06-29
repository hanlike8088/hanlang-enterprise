 import { Module } from '@nestjs/common';
 import { PrismaModule } from '../prisma/prisma.module';
 import { EquipmentController } from './equipment.controller';
 import { EquipmentService } from './equipment.service';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'equipment:equipment:read',    permName: '查看设备', resource: 'equipment', action: 'read',  description: '查看设备台账' },
   { permCode: 'equipment:equipment:write',   permName: '管理设备', resource: 'equipment', action: 'write', description: '管理设备台账' },
   { permCode: 'equipment:check:read',        permName: '查看点检', resource: 'equipment', action: 'read',  description: '查看TPM点检计划/记录' },
   { permCode: 'equipment:check:write',       permName: '管理点检', resource: 'equipment', action: 'write', description: '管理TPM点检标准和执行' },
   { permCode: 'equipment:maintenance:read',  permName: '查看保养', resource: 'equipment', action: 'read',  description: '查看保养计划/工单' },
   { permCode: 'equipment:maintenance:write', permName: '管理保养', resource: 'equipment', action: 'write', description: '管理保养计划和工单' },
   { permCode: 'equipment:repair:read',       permName: '查看维修', resource: 'equipment', action: 'read',  description: '查看维修请求/统计' },
   { permCode: 'equipment:repair:write',      permName: '管理维修', resource: 'equipment', action: 'write', description: '管理维修派工/执行/验收' },
   { permCode: 'equipment:sparepart:read',    permName: '查看备件', resource: 'equipment', action: 'read',  description: '查看备品备件' },
   { permCode: 'equipment:sparepart:write',   permName: '管理备件', resource: 'equipment', action: 'write', description: '管理备品备件出入库' },
 ]);
 
 @Module({
  imports: [PrismaModule],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
