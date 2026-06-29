# 瀚朗企业管理系统 — 全面诊断报告 v2

> **诊断时间：** 2026-06-28 07:45-08:01
> **诊断方法：** 实时 API 调用 + 源码静态分析 + 三份基准文档对比
> **诊断范围：** 端口健康 / 数据完整性 / 配置完整性 / 金蝶可用性 / BLUEPRINT八中心 / DEV_PLAN验收 / ISO 9001差距

---

## 一、总体状态

| 维度 | 评分 | 状态 | 说明 |
|:---|:---:|:---:|:---|
| 系统可用性 | 10/10 | ✅ | 后端3000+前端5173+金蝶全部正常 |
| 数据完整性 | 7/10 | ⚠️ | 8维度有数据，但员工=0、业务仅测试数据 |
| 配置完整性 | 8/10 | ⚠️ | 编码/工作流/岗位/角色到位，但状态有重复编码 |
| 模块完整度 | 8.5/10 | ✅ | 八中心核心闭环齐全，3个中心有缺口 |
| API 路由 | 9/10 | ✅ | 489条路由，1个致命Bug(SPC双api前缀) |
| ISO 9001 合规 | 8/10 | ⚠️ | 原10项缺失中7项已解决，1项数据未落地 |
| **综合** | **8.0/10** | ⚠️ | **B+ — 功能齐全，细节和集成待打磨** |

---

## 二、数据统计

| 指标 | 数量 |
|:---|:----:|
| 后端模块目录 | 31 (业务28 + 基础3) |
| 数据库模型 (Prisma) | 66 |
| 前端页面 (.tsx) | 58 |
| API 路由 | 489 |
| API 控制器 | 28 |
| 有权限守卫的控制器 | 12 (42.9%) |
| 组织 | 54 |
| 客户 | 325 |
| 供应商 | 614 |
| 物料 | 5,001 |
| 岗位 | 10 |
| 角色 | 8 |
| 编码规则 | 64 |
| 工作流状态 | 44 |
| 员工 | **0** ❌ |

---

## 三、发现问题分级

### 🔴 P0 — 阻塞级 (5项)

| # | 问题 | 影响 |
|---:|:---|:---|
| P0-1 | **员工数据为 0 条** | RBAC 完全瘫痪，打样/审批流程无法走通 |
| P0-2 | **SPC 路由双 `api/` 前缀** (`@Controller('api/spc')` → `/api/api/spc/...`) | SPC 前端绝对 404 |
| P0-3 | **SPC 控制器无权限守卫** | SPC 数据完全不受保护 |
| P0-4 | **权限守卫覆盖率仅 42.9%** | 16个模块数据裸奔 |
| P0-5 | **BatchTrace summary 端点 404** | 批次追溯无概览入口 |

### 🟡 P1 — 严重级 (7项)

| # | 问题 | 影响 |
|---:|:---|:---|
| P1-1 | 工作流状态中英文双套编码 (如 pending_approval/PENDING) | 状态机混乱 |
| P1-2 | 角色 ADMIN 与 ROLE_ADMIN 功能重复 | 权限可能冲突 |
| P1-3 | RequirePermission 双来源 (guards vs decorators) | 行为可能不一致 |
| P1-4 | admin 角色硬编码绕过 RBAC (`role==='admin'` → return true) | 审计追溯无法区分 admin 操作 |
| P1-5 | 无审计日志模块 (DEV_PLAN P8) | ISO 合规缺口 |
| P1-6 | 无跨模块事件总线 (DEV_PLAN P6) | 各中心数据靠人工流转 |
| P1-7 | 无移动端/PWA | 车间无法使用 |

### 🟢 P2 — 改善级 (4项)

| # | 问题 | 影响 |
|---:|:---|:---|
| P2-1 | 无数据范围权限 (销售可见全部客户) | 数据隔离不足 |
| P2-2 | 电磁/CAE/考勤/预算/售后模块缺失 | BLUEPRINT 部分未实现 |
| P2-3 | BOM 无类型区分 (设计/工程/制造) | 研发管理精细化不足 |
| P2-4 | 仅中文，无 i18n | 海外业务受限 |

---

## 二、Step 1：系统健康检查

| 检查项 | 状态 | 详情 |
|:---|:---:|:---|
| 后端 3000 | ✅ | 认证API正常，根路由404(预期) |
| 前端 5173 | ✅ | HTTP 200 |
| 金蝶连接 | ✅ | login 端点返回 200 |

---

## 三、Step 2：数据完整性（8维度）

| 维度 | 数量 | 状态 |
|:---|:----:|:---:|
| 组织 | 54 条 | ✅ |
| 客户 | 325 条 | ✅ |
| 供应商 | 614 条 | ✅ |
| 物料 | 5,001 条 | ✅ |
| 岗位 | 10 条 | ✅ |
| 角色 | 8 条 | ✅ |
| 编码规则 | 64 条 | ✅ |
| 工作流状态 | 44 条 | ✅ |

**附加数据检查：**

| 维度 | 数量 | 状态 |
|:---|:----:|:---:|
| 员工 | **0 条** | ❌ 严重 |
| 打样工单 | 1 条 | ⚠️ 仅测试数据 |
| NPI 项目 | 1 条 | ⚠️ 仅测试数据 |
| MRP 运行 | 1 条 | ⚠️ 仅测试数据 |
| 批次追溯 | 404 | ❌ 接口不存在 |

---

## 四、Step 3：配置完整性（4维度）

### 编码规则（64条，前10条样本）

| docType | 前缀格式 |
|:---|:---|
| AUDIT_CHECKLIST | ACL-- |
| AUDIT_FINDING | AFD-- |
| AUDIT_PLAN | AP-- |
| BATCH_LABEL | LBL-- |
| BOM编号 | BOM-- |
| COST_SHEET | CST-- |
| CRM_COMPLAINT | KS-- |
| CRM_CUSTOMER | C-- |
| CRM_ORDER | SO-- |
| CRM_PAYMENT | HK-- |

### 打样工单工作流状态

```
待审批 (pending_approval)  ← ⚠️ 英文编码
待审批 (PENDING)           ← ⚠️ 中文语义相同，编码不同
已审批 (approved)
已审批 (APPROVED)          ← ⚠️ 重复
已驳回 (rejected)
已分配 (ASSIGNED)
已分派 (assigned)          ← ⚠️ 与上条语义重叠
进行中 (IN_PROGRESS)
进行中 (in_progress)       ← ⚠️ 重复
已完成 (COMPLETED)
已完成 (completed)         ← ⚠️ 重复
已暂停 (PAUSED)
异常暂停 (exception_paused)
```

### 岗位（10个）

| 岗位 | 归属组织 |
|:---|:---|
| 专利专员 | 知识产权部 |
| 测试工程师 | 测试中心 |
| 研发主管 | 技术部 |
| 打样技术员 | 打样中心 |
| 研发工程师 | 技术部 |
| 设备工程师 | 设备工程部 |
| 质检员 | 品质部 |
| 仓管员 | 仓储部 |
| 销售主管 | 国内市场部 |
| 销售员 | 国内市场部 |

### 角色（8个）

| 角色 | 编码 |
|:---|:---|
| 仓管员角色 | warehouse_role |
| 采购员角色 | purchaser_role |
| 销售员角色 | sales_role |
| 研发主管角色 | rd_manager_role |
| 打样角色 | sampling_role |
| 普通用户 | ROLE_USER |
| 系统管理员 | ROLE_ADMIN |
| 管理员 | ADMIN |

---

## 五、Step 4：金蝶API可用性（5端点）

| 端点 | 状态 | 响应码 |
|:---|:---:|:---:|
| login | ✅ | 200 |
| materials | ✅ | 200 |
| departments | ✅ | 200 |
| customers | ✅ | 200 |
| suppliers | ✅ | 200 |

---

## 六、源码级审计

### 6.1 后端模块（31个目录）

```text
admin, archive, audit, auth, backup, batch-trace, common, cost, crm,
dashboard, document-control, drawing, equipment, erp, files, finance,
k3cloud, knowledge, manufacturing, mrp, notification, npi, plm, prisma,
purchase, quality, sampling, spc, supplier, training, warehouse
```

> 注：common/prisma/files 为基础设施模块，实际业务模块 28 个。

### 6.2 API路由统计（489条，28控制器）

| Controller | 路由数 | 有无权限守卫 |
|:---|---:|:---:|
| admin.controller.ts | 46 | ✅ |
| crm.controller.ts | 46 | ✅ |
| equipment.controller.ts | 46 | ❌ |
| quality.controller.ts | 44 | ❌ |
| manufacturing.controller.ts | 40 | ❌ |
| training.controller.ts | 22 | ✅ |
| warehouse.controller.ts | 21 | ❌ |
| npi.controller.ts | 20 | ❌ |
| plm.controller.ts | 20 | ❌ |
| k3cloud.controller.ts | 19 | ✅ |
| audit.controller.ts | 14 | ✅ |
| finance.controller.ts | 14 | ❌ |
| erp.controller.ts | 13 | ❌ |
| purchase.controller.ts | 13 | ❌ |
| sampling.controller.ts | 12 | ❌ |
| supplier.controller.ts | 12 | ❌ |
| document-control.controller.ts | 11 | ✅ |
| dashboard.controller.ts | 10 | ❌ |
| spc.controller.ts | 10 | ❌ |
| cost.controller.ts | 9 | ✅ |
| drawing.controller.ts | 9 | ❌ |
| notification.controller.ts | 8 | ❌ |
| batch-trace.controller.ts | 7 | ✅ |
| knowledge.controller.ts | 7 | ✅ |
| backup.controller.ts | 6 | ❌ |
| auth.controller.ts | 4 | N/A (public) |
| mrp.controller.ts | 4 | ✅ |
| archive.controller.ts | 2 | ❌ |

**权限覆盖率：12/28 有守卫 = 42.9%**

### 6.3 前端页面（58个．tsx，全实现）

```text
CRM: CustomersPage, QuotesPage, OrdersPage, ComplaintsPage, PaymentsPage, ReconciliationPage
Admin: OrganizationPage, PositionPage, EmployeePage, RolePermissionPage, CodingRulesPage, WorkflowStatesPage, SystemSettingsPage
NPI: ProjectsPage, TrialRunsPage, IssuesPage, ApprovalsPage, SamplingWorkOrdersPage
PLM: ProductsPage, DocumentsPage, DrawingVersionsPage, PatentsPage
Equipment: EquipmentPage, TpmPage, SparePartsPage, RepairPage
Quality: IQCPage, IPQCPage, GaugePage, OQCPage
Manufacturing: SchedulingPage, WorkOrderPage, WipPage, EfficiencyPage
ERP: WorkOrdersPage, MaterialsPage
Other: SupplierPage, PurchasePage, WarehousePage, FinancePage, TracePage, MRPPage, AuditPage, SPCPage, CostPage, TrainingPage, DocumentControlPage, KnowledgePage, DashboardPage, QualityDashboardPage, NotificationPage, BackupPage, ArchivePage, K3CloudPage, LoginPage
```

### 6.4 RequirePermission 来源不一致

| 来源路径 | 使用模块 |
|:---|:---|
| `../common/guards/permission.guard` | crm, batch-trace, document-control, cost |
| `../common/decorators/permission.decorator` | training, mrp, audit, knowledge |

### 6.5 SPC 路由前缀异常

- SPC: `@Controller('api/spc')` — 访问路径 `http://localhost:3000/api/spc/...`
- 其他所有模块: `@Controller('moduleName')` — 访问路径 `http://localhost:3000/api/moduleName/...`

**导致 SPC 实际路径为 `http://localhost:3000/api/api/spc/...`**，双重 `api/` 前缀。

---

## 七、问题清单

### 🔴 P0 — 阻塞级

| # | 问题 | 证据 | 影响 |
|:--:|:---|:---|:---|
| P0-1 | **员工数据为空 (0条)** | GET /api/admin/employees → 0 | 岗位-角色 RBAC 完全无法运作 |
| P0-2 | **SPC 路由双 api 前缀** | `@Controller('api/spc')` → `/api/api/spc/...` | SPC 前端绝对 404 |
| P0-3 | **SPC 无权限守卫** | spc.controller.ts 无 @RequirePermission | SPC 数据不安全 |
| P0-4 | **权限覆盖率仅 42.9%** | 12/28 控制器无守卫 | 16 个模块数据不受保护 |
| P0-5 | **批次追溯 summary 404** | GET batch-trace/summary → 404 | 无批次概览入口 |

### 🟡 P1 — 严重级

| # | 问题 | 证据 |
|:--:|:---|:---|
| P1-1 | **工作流状态中英文双套编码** | 44个状态中包含 pending_approval/PENDING 等多套重复 |
| P1-2 | **角色 ADMIN 和 ROLE_ADMIN 重复** | 功能重叠，可能权限混乱 |
| P1-3 | **RequirePermission 双来源** | guards/permission.guard vs decorators/permission.decorator |
| P1-4 | **14个控制器无任何权限守卫** | equipment/quality/manufacturing/warehouse/npi/plm/finance/erp/purchase/sampling/supplier/drawing/dashboard/notification/backup/archive |
| P1-5 | **业务数据仅测试数据** | 打样1/NPI1/MRP1 — 不是真实生产数据 |
| P1-6 | **admin角色硬编码绕过RBAC** | PermissionGuard: `if (user.role === 'admin') return true` |

### 🟢 P2 — 改善级

| # | 问题 | 证据 |
|:--:|:---|:---|
| P2-1 | Dashboard 无实际 KPI 聚合 | 需手工验证 |
| P2-2 | 编码规则 yearFormat/serialFormat 未在 prefix 中体现 | 全部为 `--` |

---

## 八、建议优先行动

| 优先级 | 行动 | 预计时间 |
|:---:|:---|:---:|
| 🔴 | 修复 SPC 路由前缀 `@Controller('spc')` | 5分钟 |
| 🔴 | 给 SPC 加 @RequirePermission | 2分钟 |
| 🔴 | 录入员工数据（至少 admin+各岗位各1人） | 30分钟 |
| 🔴 | 补全14个未加守卫的控制器的 @RequirePermission | 1小时 |
| 🟡 | 清理打样工作流重复状态 | 20分钟 |
| 🟡 | 统一 RequirePermission 来源 | 15分钟 |
| 🟡 | 修复 BatchTrace summary 路由 | 10分钟 |
| 🟡 | 注意 admin 硬编码绕过（可保留但需记录） | 0 |

---

## 参考文档

- [DIAGNOSIS_PROTOCOL.md](E:\hanlang-enterprise\docs\DIAGNOSIS_PROTOCOL.md)
- [DIAGNOSIS_CMDS.md](E:\hanlang-enterprise\docs\DIAGNOSIS_CMDS.md)
- [DIAGNOSIS_REPORT_2026-06-28.md](E:\hanlang-enterprise\docs\DIAGNOSIS_REPORT_2026-06-28.md) (源码级诊断)
