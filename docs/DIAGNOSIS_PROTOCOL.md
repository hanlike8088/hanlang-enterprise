# 第三方系统诊断协议

> 本文档用于给外部AI工具或自动化诊断工具检查系统。
> 对方只需读取本文档并按指示操作即可完成全面审查。

---

## 一、给AI的基础上下文（直接复制发给AI）

请把以下内容作为初始提示发给检查工具：

"""
你是瀚朗企业管理系统的诊断工程师。项目位于 `E:\hanlang-enterprise`。

**系统架构：**
- 后端: NestJS 11 + Prisma 6 (SQLite) → 端口 3000
- 前端: React 18 + Ant Design 5 + Vite 6 → 端口 5173
- 数据库: `server/dev.db`
- 管理员: admin / admin123

**你的任务：**
1. 检查系统服务是否运行（端口 3000, 5173）
2. 登录API获取token
3. 按照 `docs/BLUEPRINT.md` 的八中心架构检查每个模块是否完整
4. 按照 `docs/DEV_PLAN.md` 的验收标准验证功能
5. 按照 `docs/AUDIT_REPORT.md` 的ISO 9001差距表检查合规性
6. 输出完整诊断报告，列出所有问题

**检查方法：**
- 调用 REST API 验证数据
- 读取源码文件检查模块完整性
- 对比文档要求与实际情况
"""

---

## 二、标准化诊断命令清单

以下命令按执行顺序排列。每个命令的预期结果标注在下方。

### 前置步骤：获取Token

```powershell
# 1. 登录获取token
$login = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$token = ($login.Content | ConvertFrom-Json).access_token
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
```

### Step 1：系统健康检查

```powershell
# 端口状态
Get-NetTCPConnection -LocalPort 3000,5173 -ErrorAction SilentlyContinue | Select-Object LocalPort, State

# 金蝶连接
Invoke-WebRequest -Uri "http://localhost:3000/api/k3cloud/login" -Headers $headers -UseBasicParsing

# 前端页面
Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing
```

### Step 2：数据完整性检查

```powershell
$base = "http://localhost:3000/api"
Write-Output "组织: $( (Invoke-WebRequest -Uri "$base/admin/organizations" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "客户: $( (Invoke-WebRequest -Uri "$base/crm/customers" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "供应商: $( (Invoke-WebRequest -Uri "$base/supplier" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "物料: $( (Invoke-WebRequest -Uri "$base/erp/materials" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "岗位: $( (Invoke-WebRequest -Uri "$base/admin/positions" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "角色: $( (Invoke-WebRequest -Uri "$base/admin/roles" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "编码规则: $( (Invoke-WebRequest -Uri "$base/admin/coding-rules" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
Write-Output "工作流状态: $( (Invoke-WebRequest -Uri "$base/admin/workflow-states" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count )"
```

### Step 3：配置完整性检查

```powershell
# 编码规则明细
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/coding-rules" -Headers $headers -UseBasicParsing | ConvertFrom-Json | ForEach-Object { "$($_.docType): $($_.prefix)-..." }

# 打样工单工作流
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/workflow-states" -Headers $headers -UseBasicParsing | ConvertFrom-Json | Where-Object { $_.module -eq "sampling" } | ForEach-Object { "$($_.stateName) ($($_.stateCode))" }

# 岗位列表
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/positions" -Headers $headers -UseBasicParsing | ConvertFrom-Json | ForEach-Object { "$($_.positionName) @ $($_.orgId)" }

# 角色清单
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/roles" -Headers $headers -UseBasicParsing | ConvertFrom-Json | ForEach-Object { "$($_.roleName) ($($_.roleCode))" }
```

### Step 4：金蝶API可用性

```powershell
$endpoints = @("login", "materials", "departments", "customers", "suppliers")
foreach ($ep in $endpoints) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/k3cloud/$ep" -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Output "✅ $ep ($($r.StatusCode))"
  } catch { Write-Output "❌ $ep ($($_.Exception.Message))" }
}
```

---

## 三、源码级检查清单

以下检查需要读取源码文件，不依赖API。

### 3.1 模块注册完整性

检查 `server/src/app.module.ts`，确认以下模块是否全部注册：

```
应注册模块: Npi, Plm, Erp, K3Cloud, Supplier, Auth, Dashboard, Admin,
  Quality, BatchTrace, DocumentControl, Training, Manufacturing, Mrp,
  Audit, Cost, Spc, Knowledge, Sampling, Crm, Drawing, Equipment,
  Finance, Purchase, Warehouse, Notification, Backup, Archive
```

### 3.2 数据库模型完整性

检查 `server/prisma/schema.prisma`，统计 `^model ` 行数。

```powershell
Select-String -Path "E:\hanlang-enterprise\server\prisma\schema.prisma" -Pattern "^model " | Measure-Object | Select-Object Count
```

### 3.3 前端页面完整性

检查 `web/src/pages/` 下所有 tsx 文件。

```powershell
$issues = @()
Get-ChildItem "E:\hanlang-enterprise\web\src\pages" -Recurse -Filter "*.tsx" | ForEach-Object {
  $c = Get-Content $_.FullName -Head 3 -Encoding UTF8 -ErrorAction SilentlyContinue
  if ($c -match "维护中|placeholder|return <div>") {
    $issues += "❌ $($_.Name): 占位页面"
  }
}
if ($issues.Count -eq 0) { "✅ 所有页面已实现" } else { $issues }
```

### 3.4 API路由统计

```powershell
Get-ChildItem "E:\hanlang-enterprise\server\src" -Recurse -Filter "*controller.ts" | ForEach-Object {
  $routes = Select-String -Path $_.FullName -Pattern "@(Get|Post|Put|Patch|Delete)(" | Measure-Object | Select-Object -ExpandProperty Count
  "$($_.Name): $routes 条路由"
}
```

---

## 四、验收标准对照（来自DEV_PLAN.md）

检查工具读取 `docs/DEV_PLAN.md` 后，逐项验证：

| 模块 | 验收标准 | 验证方法 |
|------|---------|---------|
| NPI项目 | 创建项目→设置状态→流转 | POST /api/npi/projects + 状态变更 |
| PLM产品 | 创建产品+BOM+文档 | POST /api/plm/products + boms |
| 打样工单 | 提交→审批→分配→完成 | POST /api/sampling + 状态流转 |
| CRM客户 | 新建客户+联系人 | POST /api/crm/customers |
| 采购订单 | 创建→审批→到货 | POST /api/purchase |
| 仓库 | 入库→出库→库存查询 | POST /api/warehouse/stock-in |
| 品质 | IQC检验→判定→处置 | POST /api/quality/incoming |
| 设备 | 创建设备→TPM点检 | POST /api/equipment |

---

## 五、输出报告格式

诊断完成后按此格式输出：

```
========================================
  瀚朗系统诊断报告
  诊断时间: {时间}
  诊断工具: {工具名称}
========================================

一、总体状态: ✅/⚠️/❌

二、各维度评分（满分10）
├── 系统可用性: X/10
├── 数据完整性: X/10
├── 配置完整性: X/10
├── 模块完整度: X/10
├── API可用性:  X/10
└── ISO合规度:  X/10

三、发现问题（按严重程度）
P0 - 阻塞:
  1. ...
P1 - 严重:
  1. ...
P2 - 一般:
  1. ...

四、数据统计
├── 后端模块: X个
├── 数据库模型: X个
├── 前端页面: X个
├── API路由: X条
├── 金蝶端点: X个

五、建议优先级
1. ...
========================================
```
