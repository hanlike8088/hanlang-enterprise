# 系统盘点报告

> P1 产出：全模块盘点 + 权限矩阵

## 一、总览

| 维度 | 数值 |
|------|:----:|
| 后端模块 | 18 个 |
| 数据模型 | 68 个 |
| API 路由 | 200+ 条 |
| 前端页面 | 28+ 个 |
| 权限守卫覆盖率 | 约 15% |
| 跨模块事件 | 0（无）|
| 审计日志 | 0（无）|

## 二、模块逐项盘点

| # | 模块 | 数据模型数 | 有权限守卫 | 有状态机 | 有审计日志 | 备注 |
|:-:|------|:---------:|:---------:|:--------:|:---------:|------|
| 1 | admin | 12 | ✅ | ✅ | ⬜ | 权限体系完善，但未延用到其他模块 |
| 2 | auth | 1 | ✅ | ⬜ | ⬜ | JWT 登录/注册 |
| 3 | npi | 4 | ⬜ | ⬜ | ⬜ | Phase 1.1 |
| 4 | plm | 3 | ⬜ | ⬜ | ⬜ | Phase 1.1 |
| 5 | sampling | 1 | ⬜ | ✅ | ⬜ | 有状态机 |
| 6 | drawing | 2 | ⬜ | ⬜ | ⬜ | Phase 1.1 |
| 7 | crm | 8 | ⬜ | ⬜ | ⬜ | Phase 1.2 |
| 8 | supplier | 3 | ⬜ | ⬜ | ⬜ | Phase 1.3 |
| 9 | purchase | 4 | ⬜ | ✅ | ⬜ | 有状态机 |
| 10 | warehouse | 3 | ⬜ | ⬜ | ⬜ | Phase 1.3 |
| 11 | finance | 2 | ⬜ | ⬜ | ⬜ | Phase 1.3 |
| 12 | equipment | 10 | ⬜ | ✅ | ⬜ | Phase 2 |
| 13 | quality | 10 | ⬜ | ✅ | ⬜ | Phase 3 |
| 14 | k3cloud | 0 | ⬜ | ⬜ | ⬜ | 金蝶网关 |
| 15 | erp | 2 | ⬜ | ⬜ | ⬜ | 早期模块 |
| 16 | dashboard | 0 | ⬜ | ⬜ | ⬜ | 统计 |
| 17 | files | 0 | ⬜ | ⬜ | ⬜ | 文件上传 |
| 18 | common | 0 | ⬜ | ⬜ | ⬜ | 共用工具 |

## 三、权限体系现状

### 已有（Admin模块）

Admin 模块已实现完整的 RBAC 能力：

| 组件 | 说明 |
|------|------|
| AdminRole | 角色定义（名称/描述/状态）|
| AdminPermission | 权限定义（编码/名称/资源/操作）|
| AdminRolePermission | 角色-权限多对多 |
| AdminPositionRole | 岗位-角色绑定 |
| 权限检查中间件 | 无（已实现角色和权限管理，但未做成中间件） |

### 缺失

- 没有统一的 `@RequirePermission('resource', 'action')` 装饰器
- 各模块没有继承 admin 的权限模型
- 没有数据范围权限（如"销售只看自己的客户"）
- 没有审计日志
- 没有审批流引擎

## 四、数据模型归类按模块

| 模块 | 核心模型 |
|------|---------|
| admin | Organization, Position, Employee, Role, Permission, CodingRule, Workflow |
| npi | Project, TrialRun, Issue, Approval |
| plm | Product, Bom, Document |
| sampling | SamplingWorkOrder |
| drawing | Drawing, DrawingVersion |
| crm | Customer, ContactRecord, Quote, Order, Complaint, Reconciliation, Payment |
| supplier | Supplier, SupplierQcdsScore, SupplierApproval |
| purchase | PurchaseOrder, PurchaseOrderItem, Receipt, SaleOrderLink |
| warehouse | Warehouse, Location, Inventory |
| finance | ApReconciliation, ApPayment |
| equipment | Equipment, TpmCheckStandard/Plan/Record, Maintenance, Repair, SparePart |
| quality | InspectionStandard, IncomingMaterial, InspectionRecord, Ncr, Capa, Gauge |

## 五、跨模块事件现状

### 当前状态（全部缺失）

| 事件 | 应该有 | 现状 |
|------|--------|:----:|
| 客户需求确认 → 技术评审 | Crm → Npi | ❌ 无 |
| 技术评审通过 → 报价/BOM | Npi → Crm/Plm | ❌ 无 |
| 销售订单确认 → 采购需求 | Crm → Purchase | ❌ 无 |
| 采购到货 → 来料检验 | Purchase → Quality | ❌ 无 |
| 检验不合格 → 供应商质量 | Quality → Supplier | ❌ 无 |
| 生产异常 → 技术变更 | Equipment → Plm | ❌ 无 |

## 六、审计日志现状

| 记录类型 | 状态 |
|---------|:----:|
| 谁创建的 | ⬜ 无 |
| 谁审批的 | ⬜ 无 |
| 谁修改的 | ⬜ 无 |
| 修改了什么 | ⬜ 无 |
| 修改时间 | ⬜ 无 |

## 七、P2-P8 规划概要

| Phase | 内容 | 前置依赖 |
|:----:|------|---------|
| P2 | 统一用户/组织/角色/数据范围 | Admin 已有，需扩展为中间件 |
| P3 | 统一主数据编码 | Admin CodingRule 已有，需集成 |
| P4 | 单据状态机 | 部分模块已有，需统一 |
| P5 | 审批流 | 需设计 |
| P6 | 模块事件打通 | P4 完成后 |
| P7 | 跨模块看板和追溯 | P6 完成后 |
| P8 | 测试/权限复查/试运行 | P2-P7 完成后 |
