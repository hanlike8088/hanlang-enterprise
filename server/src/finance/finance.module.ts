 import { Module } from '@nestjs/common';
 import { PrismaModule } from '../prisma/prisma.module';
 import { FinanceService } from './finance.service';
 import { FinanceController } from './finance.controller';
 import { K3CloudModule } from '../k3cloud/k3cloud.module';

 import { PermissionRegistry } from '../common/permission-registry';
 
 PermissionRegistry.registerBatch([
   { permCode: 'finance:reconciliation:read',  permName: '查看对账', resource: 'finance', action: 'read',  description: '查看应付对账' },
   { permCode: 'finance:reconciliation:write', permName: '管理对账', resource: 'finance', action: 'write', description: '管理应付对账/确认' },
   { permCode: 'finance:payment:read',         permName: '查看付款', resource: 'finance', action: 'read',  description: '查看付款记录' },
   { permCode: 'finance:payment:write',        permName: '管理付款', resource: 'finance', action: 'write', description: '管理付款记录' },
 ]);
 
 @Module({ imports: [PrismaModule, K3CloudModule], controllers: [FinanceController], providers: [FinanceService], exports: [FinanceService] })
export class FinanceModule {}