 import { Module } from '@nestjs/common';
 import { PlmController } from './plm.controller';
 import { PlmService } from './plm.service';
 
 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'plm:product:read',  permName: '查看产品', resource: 'plm', action: 'read',  description: '查看产品信息' },
   { permCode: 'plm:product:write', permName: '管理产品', resource: 'plm', action: 'write', description: '管理产品档案' },
   { permCode: 'plm:bom:read',      permName: '查看BOM',  resource: 'plm', action: 'read',  description: '查看BOM清单' },
   { permCode: 'plm:bom:write',     permName: '管理BOM',  resource: 'plm', action: 'write', description: '管理BOM清单' },
   { permCode: 'plm:document:read', permName: '查看文档', resource: 'plm', action: 'read',  description: '查看PLM文档' },
   { permCode: 'plm:document:write',permName: '管理文档', resource: 'plm', action: 'write', description: '管理技术文档' },
 ]);
 
 @Module({
   controllers: [PlmController],
   providers: [PlmService],
   exports: [PlmService],
 })
 export class PlmModule {}
 
