import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TraceService } from './trace.service';
import { PrismaModule } from '../prisma/prisma.module';

import { PermissionRegistry } from '../common/permission-registry';

PermissionRegistry.registerBatch([
  { permCode: 'dashboard:view', permName: '查看仪表盘', resource: 'dashboard', action: 'read', description: '查看系统仪表盘' },
  { permCode: 'dashboard:finance', permName: '查看财务看板', resource: 'dashboard', action: 'read', description: '查看应收/应付/成本看板' },
  { permCode: 'dashboard:supply-chain', permName: '查看供应链总览', resource: 'dashboard', action: 'read', description: '查看销售-采购-生产链路总览' },
  { permCode: 'dashboard:order-chain', permName: '查看订单全链追溯', resource: 'dashboard', action: 'read', description: '查看销售订单全生命周期追溯链' },
]);

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, TraceService],
})
export class DashboardModule {}
