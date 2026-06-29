 import { Module } from '@nestjs/common';
 import { SupplierController } from './supplier.controller';
 import { SupplierService } from './supplier.service';
import { K3CloudModule } from '../k3cloud/k3cloud.module';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'supplier:supplier:read',  permName: '查看供应商',       resource: 'supplier', action: 'read',  description: '查看供应商信息' },
   { permCode: 'supplier:supplier:write', permName: '管理供应商',       resource: 'supplier', action: 'write', description: '管理供应商档案' },
   { permCode: 'supplier:qcds:read',      permName: '查看QCDS评分',     resource: 'supplier', action: 'read',  description: '查看供应商QCDS评分' },
   { permCode: 'supplier:qcds:write',     permName: '管理QCDS评分',     resource: 'supplier', action: 'write', description: '管理供应商QCDS评分' },
   { permCode: 'supplier:approval:read',  permName: '查看供应商审批',   resource: 'supplier', action: 'read',  description: '查看供应商准入审批' },
   { permCode: 'supplier:approval:write', permName: '管理供应商审批',   resource: 'supplier', action: 'write', description: '管理供应商准入审批' },
 ]);
 
 @Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
 imports: [K3CloudModule],
})
export class SupplierModule {}