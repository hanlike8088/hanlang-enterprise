import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { NpiModule } from './npi/npi.module';
import { PlmModule } from './plm/plm.module';
import { ErpModule } from './erp/erp.module';
import { K3CloudModule } from './k3cloud/k3cloud.module';
import { SupplierModule } from './supplier/supplier.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { QualityModule } from './quality/quality.module';
import { BatchTraceModule } from './batch-trace/batch-trace.module';
import { DocumentControlModule } from './document-control/document-control.module';
import { TrainingModule } from './training/training.module';
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { MrpModule } from './mrp/mrp.module';
import { AuditModule } from './audit/audit.module';
import { CostModule } from './cost/cost.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SpcModule } from './spc/spc.module';
import { NotificationModule } from './notification/notification.module';
import { BackupModule } from './backup/backup.module';
import { ArchiveModule } from './archive/archive.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { SamplingModule } from './sampling/sampling.module';
import { CrmModule } from './crm/crm.module';
import { DrawingModule } from './drawing/drawing.module';
import { EquipmentModule } from './equipment/equipment.module';
import { FinanceModule } from './finance/finance.module';
import { PurchaseModule } from './purchase/purchase.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { FeishuModule } from './feishu/feishu.module';
import { WecomModule } from './wecom/wecom.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGuard } from './common/guards/permission.guard';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  controllers: [],
  imports: [
    PrismaModule,
    NpiModule,
    PlmModule,
    ErpModule,
    K3CloudModule,
    SupplierModule,
    AuthModule,
    DashboardModule,
    AdminModule,
    QualityModule,
    BatchTraceModule,
    DocumentControlModule,
    TrainingModule,
    ManufacturingModule,
    MrpModule,
   AuditModule,
    CostModule,
    SpcModule,
    NotificationModule,
    BackupModule,
    ArchiveModule,
    SeedModule,
    FilesModule,
    KnowledgeModule,
    SamplingModule,
    CrmModule,
    DrawingModule,
    EquipmentModule,
    FinanceModule,
    PurchaseModule,
    WarehouseModule,
    FeishuModule,
    WecomModule,
   ...(process.env.NODE_ENV === 'production'
      ? [ServeStaticModule.forRoot({ rootPath: join(__dirname, '../../web/dist') })]
      : []),
  ],
    providers: [
      { provide: APP_GUARD, useClass: JwtAuthGuard },
      { provide: APP_GUARD, useClass: PermissionGuard },
    ],
  })
export class AppModule {}
