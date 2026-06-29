import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ManufacturingService } from "./manufacturing.service";
import { ManufacturingController } from "./manufacturing.controller";
import { PermissionRegistry } from "../common/permission-registry";

PermissionRegistry.registerBatch([
  { permCode: "manufacturing:plan:read",   permName: "查看排产", resource: "manufacturing", action: "read",  description: "查看生产排产计划" },
  { permCode: "manufacturing:plan:write",  permName: "管理排产", resource: "manufacturing", action: "write", description: "创建/编辑排产计划" },
  { permCode: "manufacturing:order:read",  permName: "查看工单", resource: "manufacturing", action: "read",  description: "查看制造工单" },
  { permCode: "manufacturing:order:write", permName: "管理工单", resource: "manufacturing", action: "write", description: "创建/编辑制造工单" },
  { permCode: "manufacturing:order:approve", permName: "审批工单", resource: "manufacturing", action: "approve", description: "审批工单流转" },
  { permCode: "manufacturing:wip:read",    permName: "查看看板", resource: "manufacturing", action: "read",  description: "查看在制品看板" },
  { permCode: "manufacturing:efficiency:read", permName: "查看效率", resource: "manufacturing", action: "read", description: "查看工时效率统计" },
  { permCode: "manufacturing:routing:read",  permName: "查看工艺", resource: "manufacturing", action: "read",  description: "查看工艺路线" },
  { permCode: "manufacturing:routing:write", permName: "管理工艺", resource: "manufacturing", action: "write", description: "创建/编辑工艺路线" },
]);

@Module({ imports: [PrismaModule], controllers: [ManufacturingController], providers: [ManufacturingService], exports: [ManufacturingService] })
export class ManufacturingModule {}
