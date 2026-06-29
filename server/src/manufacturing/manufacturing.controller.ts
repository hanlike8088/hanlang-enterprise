import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from "@nestjs/common";
import { ManufacturingService } from "./manufacturing.service";
import { RequirePermission } from "../common/guards/permission.guard";

@Controller("manufacturing")
export class ManufacturingController {
  constructor(private readonly s: ManufacturingService) {}

  // === Module 1: 生产排产 ===
  @RequirePermission("manufacturing", "plan:write")
  @Post("plans") createPlan(@Body() d: any) { return this.s.createPlan(d); }
  @RequirePermission("manufacturing", "plan:read")
  @Get("plans") findAllPlans(@Query("status") st?: string, @Query("period") p?: string) { return this.s.findAllPlans(st, p); }
  @RequirePermission("manufacturing", "plan:read")
  @Get("plans/:id") findOnePlan(@Param("id") id: string) { return this.s.findOnePlan(id); }
  @RequirePermission("manufacturing", "plan:write")
  @Patch("plans/:id") updatePlan(@Param("id") id: string, @Body() d: any) { return this.s.updatePlan(id, d); }
  @RequirePermission("manufacturing", "plan:write")
  @Delete("plans/:id") deletePlan(@Param("id") id: string) { return this.s.deletePlan(id); }
  @RequirePermission("manufacturing", "plan:write")
  @Post("plans/:planId/items") addPlanItem(@Param("planId") pid: string, @Body() d: any) { return this.s.addPlanItem(pid, d); }
  @RequirePermission("manufacturing", "plan:write")
  @Patch("plan-items/:id") updatePlanItem(@Param("id") id: string, @Body() d: any) { return this.s.updatePlanItem(id, d); }
  @RequirePermission("manufacturing", "plan:write")
  @Delete("plan-items/:id") deletePlanItem(@Param("id") id: string) { return this.s.deletePlanItem(id); }
  @RequirePermission("manufacturing", "plan:write")
  @Patch("plan-items/:id/drag") dragPlanItem(@Param("id") id: string, @Body() d: any) { return this.s.dragPlanItem(id, d); }
  @RequirePermission("manufacturing", "plan:read")
  @Get("plans/:id/capacity") checkCapacity(@Param("id") id: string) { return this.s.checkCapacity(id); }

  // === 工作日历 ===
  @RequirePermission("manufacturing", "plan:read")
  @Get("calendars") findCalendars(@Query("start") s?: string, @Query("end") e?: string) { return this.s.findCalendars(s, e); }
  @RequirePermission("manufacturing", "plan:write")
  @Post("calendars") upsertCalendar(@Body() d: any) { return this.s.upsertCalendar(d); }

  // === Module 2: 工单流转 ===
  @RequirePermission("manufacturing", "order:write")
  @Post("orders") createOrder(@Body() d: any) { return this.s.createOrder(d); }
  @RequirePermission("manufacturing", "order:read")
  @Get("orders") findAllOrders(@Query("status") st?: string, @Query("priority") p?: string, @Query("keyword") kw?: string, @Query("planId") pid?: string) { return this.s.findAllOrders(st, p, kw, pid); }
  @RequirePermission("manufacturing", "order:read")
  @Get("orders/:id") findOneOrder(@Param("id") id: string) { return this.s.findOneOrder(id); }
  @RequirePermission("manufacturing", "order:write")
  @Patch("orders/:id") updateOrder(@Param("id") id: string, @Body() d: any) { return this.s.updateOrder(id, d); }
  @RequirePermission("manufacturing", "order:write")
  @Delete("orders/:id") deleteOrder(@Param("id") id: string) { return this.s.deleteOrder(id); }
  @RequirePermission("manufacturing", "order:approve")
  @Post("orders/:id/transition") transitionOrder(@Param("id") id: string, @Body("toStatus") ts: string) { return this.s.transitionOrder(id, ts); }

  // === 工序 ===
  @RequirePermission("manufacturing", "order:read")
  @Get("orders/:orderId/operations") findOrderOps(@Param("orderId") oid: string) { return this.s.findOrderOperations(oid); }
  @RequirePermission("manufacturing", "order:write")
  @Patch("operations/:id") updateOperation(@Param("id") id: string, @Body() d: any) { return this.s.updateOperation(id, d); }
  @RequirePermission("manufacturing", "order:write")
  @Post("operations/:id/transition") transitionOperation(@Param("id") id: string, @Body("toStatus") ts: string) { return this.s.transitionOperation(id, ts); }

  // === 领料 ===
  @RequirePermission("manufacturing", "order:write")
  @Post("orders/:orderId/issues") issueMaterial(@Param("orderId") oid: string, @Body() d: any) { return this.s.issueMaterial(oid, d); }
  @RequirePermission("manufacturing", "order:read")
  @Get("issues") findIssues(@Query("orderId") oid?: string, @Query("materialId") mid?: string) { return this.s.findIssues(oid, mid); }

  // === 报工 ===
  @RequirePermission("manufacturing", "order:write")
  @Post("reports") reportOperation(@Body() d: any) { return this.s.reportOperation(d); }
  @RequirePermission("manufacturing", "order:read")
  @Get("reports") findReports(@Query("operationId") oid?: string, @Query("scanCode") sc?: string) { return this.s.findReports(oid, sc); }

  // === 完工入库 ===
  @RequirePermission("manufacturing", "order:write")
  @Post("orders/:id/complete") completeOrder(@Param("id") id: string, @Body() d: any) { return this.s.completeOrder(id, d); }

  // === Module 3: WIP 在制品 ===
  @RequirePermission("manufacturing", "wip:read")
  @Get("wip") getWipOverview(@Query("status") st?: string) { return this.s.getWipOverview(st); }
  @RequirePermission("manufacturing", "wip:read")
  @Get("wip/by-workcenter") getWipByWorkCenter() { return this.s.getWipByWorkCenter(); }
  @RequirePermission("manufacturing", "wip:read")
  @Get("wip/overdue") getOverdueWarnings() { return this.s.getOverdueWarnings(); }

  // === Module 4: 工时与效率 ===
  @RequirePermission("manufacturing", "efficiency:read")
  @Get("efficiency/order/:orderId") getEfficiencyByOrder(@Param("orderId") oid: string) { return this.s.getEfficiencyByOrder(oid); }
  @RequirePermission("manufacturing", "efficiency:read")
  @Get("efficiency/worker") getEfficiencyByWorker(@Query("worker") w?: string, @Query("start") s?: string, @Query("end") e?: string) { return this.s.getEfficiencyByWorker(w, s, e); }

  // === 工艺路线 ===
  @RequirePermission("manufacturing", "routing:read")
  @Get("routings") findAllRoutings(@Query("productId") pid?: string) { return this.s.findAllRoutings(pid); }
  @RequirePermission("manufacturing", "routing:read")
  @Get("routings/:id") findOneRouting(@Param("id") id: string) { return this.s.findOneRouting(id); }
  @RequirePermission("manufacturing", "routing:write")
  @Post("routings") createRouting(@Body() d: any) { return this.s.createRouting(d); }
  @RequirePermission("manufacturing", "routing:write")
  @Patch("routings/:id") updateRouting(@Param("id") id: string, @Body() d: any) { return this.s.updateRouting(id, d); }
  @RequirePermission("manufacturing", "routing:write")
  @Delete("routings/:id") deleteRouting(@Param("id") id: string) { return this.s.deleteRouting(id); }
  @RequirePermission("manufacturing", "routing:write")
  @Post("routings/:routingId/operations") addRoutingOperation(@Param("routingId") rid: string, @Body() d: any) { return this.s.addRoutingOperation(rid, d); }
  @RequirePermission("manufacturing", "routing:write")
  @Patch("routing-operations/:id") updateRoutingOperation(@Param("id") id: string, @Body() d: any) { return this.s.updateRoutingOperation(id, d); }
  @RequirePermission("manufacturing", "routing:write")
  @Delete("routing-operations/:id") deleteRoutingOperation(@Param("id") id: string) { return this.s.deleteRoutingOperation(id); }

  // === 统计 ===
  @RequirePermission("manufacturing", "order:read")
  @Get("stats") getStats() { return this.s.getStats(); }
}
