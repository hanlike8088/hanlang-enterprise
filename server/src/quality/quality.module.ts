 import { Module } from '@nestjs/common';
 import { QualityController } from './quality.controller';
 import { QualityService } from './quality.service';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'quality:standard:read',    permName: '查看检验标准', resource: 'quality', action: 'read',  description: '查看检验标准' },
   { permCode: 'quality:standard:write',   permName: '管理检验标准', resource: 'quality', action: 'write', description: '管理检验标准' },
   { permCode: 'quality:incoming:read',    permName: '查看来料检验', resource: 'quality', action: 'read',  description: '查看IQC来料检验' },
   { permCode: 'quality:incoming:write',   permName: '管理来料检验', resource: 'quality', action: 'write', description: '管理IQC来料检验' },
   { permCode: 'quality:firstpiece:read',  permName: '查看首件检验', resource: 'quality', action: 'read',  description: '查看IPQC首件检验' },
   { permCode: 'quality:firstpiece:write', permName: '管理首件检验', resource: 'quality', action: 'write', description: '管理IPQC首件检验' },
   { permCode: 'quality:patrol:read',      permName: '查看巡检',     resource: 'quality', action: 'read',  description: '查看巡检计划和记录' },
   { permCode: 'quality:patrol:write',     permName: '管理巡检',     resource: 'quality', action: 'write', description: '管理巡检计划和执行' },
   { permCode: 'quality:outgoing:read',    permName: '查看出货检验', resource: 'quality', action: 'read',  description: '查看OQC出货检验' },
   { permCode: 'quality:outgoing:write',   permName: '管理出货检验', resource: 'quality', action: 'write', description: '管理OQC出货检验' },
   { permCode: 'quality:ncr:read',         permName: '查看不合格品', resource: 'quality', action: 'read',  description: '查看NCR不合格品' },
   { permCode: 'quality:ncr:write',        permName: '管理不合格品', resource: 'quality', action: 'write', description: '管理NCR不合格品' },
   { permCode: 'quality:capa:read',        permName: '查看CAPA',     resource: 'quality', action: 'read',  description: '查看纠正预防措施' },
   { permCode: 'quality:capa:write',       permName: '管理CAPA',     resource: 'quality', action: 'write', description: '管理纠正预防措施' },
   { permCode: 'quality:gauge:read',       permName: '查看量具',     resource: 'quality', action: 'read',  description: '查看量具/仪器' },
   { permCode: 'quality:gauge:write',      permName: '管理量具',     resource: 'quality', action: 'write', description: '管理量具/校准' },
   { permCode: 'quality:stats:read',       permName: '查看品质统计', resource: 'quality', action: 'read',  description: '查看品质统计报表' },
 ]);
 
 @Module({
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
