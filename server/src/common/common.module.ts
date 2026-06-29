import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PermissionGuard } from './guards/permission.guard';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { CodingRuleService } from './services/coding-rule.service';
import { CodingRuleSeeder } from './services/coding-rule-seed';
import { StatusMachineService } from './services/status-machine.service';
import { WorkflowService } from './services/workflow.service';
import { WorkflowSeeder } from './services/workflow-seed';
import { EventBusService } from './services/event-bus.service';
import { ApprovalFlowService } from './services/approval-flow.service';

@Global()
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    StatusMachineService,
    WorkflowService,
    CodingRuleService,
    CodingRuleSeeder,
    AuditLogService,
    ApprovalFlowService,
    AuditLogInterceptor,
    WorkflowSeeder,
    EventBusService,
  ],
  exports: [CodingRuleService, StatusMachineService, WorkflowService, EventBusService, AuditLogService, ApprovalFlowService],
})
export class CommonModule {}
