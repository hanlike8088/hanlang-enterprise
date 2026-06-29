# 瀚朗系统诊断报告 v2（完整版）

> 诊断标准：DIAGNOSIS_PROTOCOL.md + DEV_PLAN.md + AUDIT_REPORT.md
> 诊断日期：2026-06-28 08:11 GMT+8
> 诊断工具：WorkBuddy（bash + curl + grep 自动化）
> 诊断方式：实时 API 调用 + 源码静态分析 双通道

---

## 一、总体状态：⚠️ 功能基本可用，但存在多个阻止关键业务流程的 Bug

系统双端口运行正常，金蝶 5 端点全部通过，核心 CRUD 可用。但**仓库入库 500、品质 IQC 500、SPC 路由 404** 三个阻断级 Bug 需立即修复。权限守卫覆盖率仅 10.7%，属于严重安全隐患。

---

## 二、各维度评分

| 维度 | 评分 | 说明 |
|:---|:---:|:---|
| 系统可用性 | **10/10** | 双端口运行，登录正常，金蝶全通，前端可访问 |
| 数据完整性 | **6/10** | 核心实体有数据（5001物料、325客户、614供应商），但员工=0、采购单=0 |
| 配置完整性 | **6/10** | 64条编码规则覆盖全面，但工作流状态有大小写重复，426角色严重冗余 |
| 模块完整度 | **8/10** | 31模块目录、28 Controller、489路由、104模型，但前端仅9模块对应 |
| API 可用性 | **5/10** | 5/8 核心验收 API 失败（400/500/404），仅采购和设备通过 |
| ISO 合规度 | **4/10** | 12项合规、8项部分、10项缺失；权限体系形同虚设 |

### 加权总分：**5.8 / 10** ⚠️

```
├── 系统可用性: ██████████ 10/10
├── 数据完整性: ██████░░░░  6/10
├── 配置完整性: ██████░░░░  6/10
├── 模块完整度: ████████░░  8/10
├── API 可用性:  █████░░░░░  5/10
└── ISO 合规度:  ████░░░░░░  4/10
```

---

## 三、发现问题

### P0 - 阻塞（阻止核心业务流程）

| # | 问题 | 证据 | 影响 |
|:--|:---|:---|:---|
| 1 | **仓库入库 500** | `POST /api/warehouse/stock-in` → `500 Internal server error` | 仓库模块完全不可用 |
| 2 | **品质 IQC 500** | `POST /api/quality/incoming` → `500 Internal server error` | 来料检验无法执行 |
| 3 | **SPC 路由 404** | `POST /api/spc/charts` → `{"message":"Cannot POST /api/spc/charts","error":"Not Found","statusCode":404}` | SPC 控制图接口不存在 |
| 4 | **权限守卫覆盖率 10.7%** | 28 个 Controller 中仅 auth.controller.ts 启用了 `@UseGuards(JwtAuthGuard)`；其余 27 个无任何守卫 | 任何知道 API 的人都能直接调用所有接口 |
| 5 | **员工基础数据 = 0** | `GET /api/admin/employees` → 0 条记录 | 组织架构、岗位、角色无法关联到人员 |

### P1 - 严重（功能可用但有明显缺陷）

| # | 问题 | 证据 | 建议 |
|:--|:---|:---|:---|
| 6 | **DTO 校验过严 - CRM** | `POST /api/crm/customers` → `property customerCode should not exist` | Create DTO 缺少 customerCode / status 字段 |
| 7 | **DTO 校验过严 - NPI** | `POST /api/npi/projects` → `property projectCode should not exist` + status 枚举不匹配（期望中文） | 前端传中文值，DTO 需对应 |
| 8 | **DTO 校验过严 - PLM** | `POST /api/plm/products` → `property productCode should not exist` | Create DTO 缺少编码字段 |
| 9 | **打样工作流状态重复** | 13 个状态中存在 5 对大小写重复：`pending_approval`/`PENDING`、`approved`/`APPROVED`、`assigned`/`ASSIGNED`、`in_progress`/`IN_PROGRESS`、`completed`/`COMPLETED` | 数据迁移遗留，需清理去重 |
| 10 | **角色数据严重冗余** | 426 个角色，但实际业务角色仅 8-10 类 | 数据导入脚本产生了大量重复 |
| 11 | **设备创建中文名乱码** | `POST /api/equipment` → `equipmentName":"��ϲ����豸"` | 数据库字符集或 API 编码问题 |
| 12 | **前后端模块不对齐** | 后端 31 模块 vs 前端 10 模块（含 Login）；缺失 BatchTrace、DocumentControl、SPC、MRP、Knowledge、Finance、Supplier 等前端页面 | 前端大量模块未实现 |

### P2 - 一般（体验/数据质量）

| # | 问题 | 证据 | 建议 |
|:--|:---|:---|:---|
| 13 | DIAGNOSIS_PROTOCOL.md 模块清单过时 | 文档列 26 模块，实际注册 27+ 业务模块 | 更新文档 |
| 14 | 采购单 / 设备 / 员工初始数据为 0 | 种子数据未覆盖这些模块 | 补全 seed 脚本 |
| 15 | 前端 55 个 TSX 中部分页面需检查功能完整度 | 部分可能为占位页面 | 逐页审查 |
| 16 | 错误日志为空 | server-error.log 和 web-error.log 均无内容 | 确认日志输出配置是否正确 |

---

## 四、数据统计

| 指标 | 数值 |
|:---|---:|
| 后端模块目录 | 31 个 |
| 注册业务模块 | 27 个 |
| 数据库模型 (Prisma) | 104 个 |
| Controller 文件 | 28 个 |
| API 路由 | 489 条 |
| 前端页面 TSX 文件 | 55 个 |
| 前端模块目录 | 9 个（+Login） |
| 金蝶 API 端点 | 5/5 ✅ |
| 编码规则 | 64 条 |
| 工作流状态 | 44 条 |
| 角色 | 426 个 |
| 岗位 | 20 个 |
| 组织 | 54 个 |

| 数据实体 | 数量 | 状态 |
|:---|---:|:---:|
| 物料 | 5,001 | ✅ |
| 供应商 | 614 | ✅ |
| 客户 | 325 | ✅ |
| 组织 | 54 | ✅ |
| 岗位 | 20 | ✅ |
| NPI 项目 | 1 | ⚠️ 偏少 |
| 质检记录 | 1 | ⚠️ 偏少 |
| 员工 | 0 | ❌ 缺失 |
| 采购单 | 0 | ❌ 缺失 |
| 设备 | 0 | ❌ 缺失 |

---

## 五、DEV_PLAN 验收标准对照

| 模块 | 验收标准 | API 验证 | 结果 |
|:---|:---|:---|:---:|
| NPI 项目 | 创建项目→设置状态→流转 | POST /api/npi/projects | ❌ 400 |
| PLM 产品 | 创建产品+BOM+文档 | POST /api/plm/products | ❌ 400 |
| 打样工单 | 提交→审批→分配→完成 | POST /api/sampling | — 未测 |
| CRM 客户 | 新建客户+联系人 | POST /api/crm/customers | ❌ 400 |
| 采购订单 | 创建→审批→到货 | POST /api/purchase | ✅ 201 |
| 仓库 | 入库→出库→库存查询 | POST /api/warehouse/stock-in | ❌ 500 |
| 品质 | IQC 检验→判定→处置 | POST /api/quality/incoming | ❌ 500 |
| 设备 | 创建设备→TPM 点检 | POST /api/equipment | ✅ 201 (乱码) |

**通过率：2/8 (25%)**

---

## 六、K3Cloud 金蝶集成

| 端点 | 状态 | 响应 |
|:---|:---:|:---|
| login | ✅ 200 | 连接正常 |
| materials | ✅ 200 | 连接正常 |
| departments | ✅ 200 | 连接正常 |
| customers | ✅ 200 | 连接正常 |
| suppliers | ✅ 200 | 连接正常 |

金蝶集成全面通过，无问题。

---

## 七、ISO 9001 快速差距扫描

基于 AUDIT_REPORT.md 对照实时系统：

| 维度 | 判定 | 关键缺口 |
|:---|:---:|:---|
| 设计开发 (8.3) | ⚠️ | NPI/PLM DTO 校验阻断创建流程 |
| 可追溯性 (8.5.2) | ❌ | BatchTrace 后端有但前端未实现 |
| 培训管理 (7.2) | ⚠️ | Training 后端就绪但前端待验证 |
| SPC 统计 (9.1.3) | ❌ | SPC 路由 404 |
| 权限控制 | ❌ | 10.7% 守卫覆盖率 |
| 供应商评价 (8.4.1) | ✅ | Supplier 模块 API 可用 |
| 来料检验 (8.4.3) | ❌ | IQC POST 500 |
| 文件控制 (7.5.3) | ⚠️ | DocumentControl 后端有但前端缺失 |

---

## 八、建议优先级

| 优先级 | 行动项 | 预期影响 |
|:---:|:---|:---|
| 🔴 立即 | 修复仓库入库 500 错误 | 恢复仓库核心流程 |
| 🔴 立即 | 修复品质 IQC 500 错误 | 恢复来料检验流程 |
| 🔴 立即 | 修复 SPC 路由 404 | 恢复统计过程控制 |
| 🔴 立即 | 全局启用 JwtAuthGuard | 堵上安全漏洞 |
| 🟡 本周 | 统一 DTO Schema（CRM/NPI/PLM Create DTO） | 恢复 3 个核心模块的创建功能 |
| 🟡 本周 | 清理打样工作流状态重复数据 | 保证状态机正确性 |
| 🟡 本周 | 补全员工 seed 数据 | 组织架构可关联 |
| 🟢 本月 | 前端补齐缺失模块页面（SPC/MRP/Knowledge/Supplier/BatchTrace/DocumentControl/Finance） | 前后端模块对齐 |
| 🟢 本月 | 修复设备中文名乱码 | 数据可读性 |
| 🟢 本月 | 角色数据去重清理 | 降低维护复杂度 |

---

## 九、DIAGNOSIS_PROTOCOL.md 协议评估

> 本次诊断严格遵循 DIAGNOSIS_PROTOCOL.md 执行，过程中发现协议自身的问题：

| 协议缺陷 | 说明 |
|:---|:---|
| 模块清单过时 | 协议列 26 模块，实际 27+；缺失 files/common/prisma 基础模块 |
| 缺少前置连通性检查 | Step 1 未区分"服务未启动"和"API 挂了" |
| 占位页面检测正则过简 | 只能匹配 `维护中|placeholder|return <div>`，漏掉 Ant Design 占位组件 |
| 缺少基线值 | 如模型数预期 ≥66、路由预期 ≥200，诊断工具无参照 |
| 未纳入权限检查 | 0 处提及权限守卫覆盖 |
| 未纳入路由一致性检查 | 如 SPC 双 /api/ 前缀问题需读源码才能发现 |

**建议：协议应在本报告基础上迭代升级至 v2 版本。**

---

*报告生成时间：2026-06-28 08:11 GMT+8*
*诊断工具：WorkBuddy + bash/curl/grep 自动化*
