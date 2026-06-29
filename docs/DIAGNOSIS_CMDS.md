# 瀚朗管理系统 — 自主诊断命令手册

> 以下命令用于检查系统开发状态，按用途分组。

---

## 一、系统服务状态

### 检查后端/前端是否运行
```powershell
Get-NetTCPConnection -LocalPort 3000,5173 -ErrorAction SilentlyContinue | Select-Object LocalPort, State
```
**预期：** 3000和5173都显示 Listen

### 检查API登录
```powershell
$token = (Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}' -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json).access_token
```

### 检查金蝶连接
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-WebRequest -Uri "http://localhost:3000/api/k3cloud/login" -Headers $headers -UseBasicParsing
```

## 二、数据完整性检查

### 查看所有数据量
```powershell
$hostUrl = "http://localhost:3000/api"
Write-Output "组织: $((Invoke-WebRequest -Uri "$hostUrl/admin/organizations" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count)"
Write-Output "客户: $((Invoke-WebRequest -Uri "$hostUrl/crm/customers" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count)"
Write-Output "供应商: $((Invoke-WebRequest -Uri "$hostUrl/supplier" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count)"
Write-Output "物料: $((Invoke-WebRequest -Uri "$hostUrl/erp/materials" -Headers $headers -UseBasicParsing | ConvertFrom-Json).Count)"
```

### 检查物料分组
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/erp/materials" -Headers $headers -UseBasicParsing | ConvertFrom-Json | Group-Object category | Sort-Object Count -Descending | Select-Object -First 20 | ForEach-Object { Write-Output "$($_.Name): $($_.Count)个" }
```

## 三、配置检查

### 编码规则
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/coding-rules" -Headers $headers -UseBasicParsing | ConvertFrom-Json | ForEach-Object { Write-Output "$($_.docType): $($_.prefix)-{年份}-{流水号}" }
```

### 工作流状态（打样工单）
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/workflow-states" -Headers $headers -UseBasicParsing | ConvertFrom-Json | Where-Object { $_.module -eq "sampling" } | ForEach-Object { Write-Output "$($_.stateName)" }
```

### 工作流转
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/workflow-transitions" -Headers $headers -UseBasicParsing | ConvertFrom-Json | Where-Object { $_.module -eq "sampling" } | ForEach-Object { Write-Output "$($_.transitionName)" }
```

### 角色清单
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/roles" -Headers $headers -UseBasicParsing | ConvertFrom-Json | ForEach-Object { Write-Output "$($_.roleName) ($($_.roleCode))" }
```

## 四、模块完整性检查

### 查看所有后端模块
```powershell
Get-ChildItem "E:\hanlang-enterprise\server\src" -Directory | Select-Object Name
```

### 查看所有前端页面
```powershell
Get-ChildItem "E:\hanlang-enterprise\web\src\pages" -Recurse -Filter "*.tsx" | ForEach-Object { Write-Object $_.Name }
```

### 查看所有数据库模型
```powershell
Select-String -Path "E:\hanlang-enterprise\server\prisma\schema.prisma" -Pattern "^model " | ForEach-Object { Write-Output $_.ToString().Trim() }
```

## 五、错误日志检查

```powershell
Get-Content "E:\hanlang-enterprise\server-error.log" -Tail 20 -ErrorAction SilentlyContinue
Get-Content "E:\hanlang-enterprise\web-error.log" -Tail 20 -ErrorAction SilentlyContinue
```

## 六、快速验证提示词

你可以直接对我说这些来检查系统：

| 问题 | 效果 |
|------|------|
| "检查系统全部状态" | 完整状态报告 |
| "检查数据完整性" | 所有模块数据量 |
| "测试金蝶连接" | 金蝶API连通性 |
| "对照BLUEPRINT检查模块" | 八中心完整度 |
| "检查ISO差距" | AUDIT_REPORT对照 |
| "检查权限配置" | 角色/岗位/权限 |
| "重新初始化数据" | 重跑导入脚本 |
