========================================
  瀚朗系统诊断报告
  诊断时间: 2026-06-28 08:16
  诊断工具: Senior Developer (高级开发工程师)
  依据文档: DIAGNOSIS_PROTOCOL.md
========================================

一、总体状态: ⚠️ 功能齐全，存在前端缺口，ISO合规需补齐

二、各维度评分（满分10）
├── 系统可用性:   9/10  （前后端均正常运行，登录/K3Cloud认证通过）
├── 数据完整性:   9/10  （8大模块均有数据，物料5001条、供应商614条、编码规则64条）
├── 配置完整性:   8/10  （组织/岗位/角色/编码规则/工作流均已配置）
├── 模块完整度:   6/10  （后端28个模块全注册，前端仅8/28模块有页面）
├── API可用性:    9/10  （500+路由，K3Cloud 5/5端点全部可用）
└── ISO合规度:    5/10  （核心功能在，但控制层缺失严重）

三、关键诊断数据

3.1 系统健康 ✅
├── 后端 (Port 3000): Listen → PID 33044
├── 前端 (Port 5173): Listen → PID 16868
├── 管理员登录: ✅ Token获取成功
├── 前端页面可访问: ✅
└── K3Cloud认证: ✅

3.2 数据统计
├── 组织: 54 条
├── 客户: 325 条
├── 供应商: 614 条
├── 物料: 5001 条
├── 岗位: 10 条
├── 角色: 8 条
├── 编码规则: 64 条
├── 工作流状态: 44 条

3.3 模块注册（28/28 → 100% ✅）
Npi ✅ | Plm ✅ | Erp ✅ | K3Cloud ✅ | Supplier ✅ | Auth ✅
Dashboard ✅ | Admin ✅ | Quality ✅ | BatchTrace ✅ | DocumentControl ✅
Training ✅ | Manufacturing ✅ | Mrp ✅ | Audit ✅ | Cost ✅
Spc ✅ | Knowledge ✅ | Sampling ✅ | Crm ✅ | Drawing ✅
Equipment ✅ | Finance ✅ | Purchase ✅ | Warehouse ✅
Notification ✅ | Backup ✅ | Archive ✅

3.4 数据库模型: 104 个 (schema.prisma)
3.5 前端页面: 55 个 .tsx 文件
├── Admin: 7 页面
├── CRM: 6 页面
├── Equipment: 4 页面
├── ERP: 2 页面
├── Manufacturing: 4 页面
├── NPI: 5 页面
├── PLM: 4 页面
└── Quality: 4 页面
    (注: 其他20个模块暂无独立前端页面)

3.6 API路由: ~500+ 条（28个Controller）
   金蝶端点: 5/5 ✅
   ├── login: 200 ✅
   ├── materials: 200 ✅
   ├── departments: 200 ✅
   ├── customers: 200 ✅
   └── suppliers: 200 ✅

四、发现问题（按严重程度）

P0 - 阻塞: 无

P1 - 严重:
  1. 前端覆盖率不足 — 28个后端模块中仅8个有前端页面
     缺失前端模块: Finance, Purchase, Warehouse, Supplier, Audit,
     Cost, Training, SPC, Knowledge, Sampling, Drawing, BatchTrace,
     DocumentControl, Mrp, Notification, Backup, Archive, K3Cloud,
     Dashboard (共20个)
     影响: 用户只能通过API操作这些模块，无法在界面使用

  2. ISO 9001 关键缺失 — 来自 AUDIT_REPORT.md
     ├── 8.5.2 批次/序列号可追溯: ❌ 完全缺失
     ├── 7.5.3 文件受控管理(审批/废止/外来文件): ❌ 关键缺失
     ├── 7.2 人员培训管理: ❌ 完整缺失
     ├── 9.1.3 SPC统计过程控制: ❌ 无功能
     └── 8.5.4 产品防护/FIFO管控: ❌ 无

P2 - 一般:
  1. 编码规则存在重复项 — "NPI项目"与"NPI_PROJECT"、"打样工单"与"SAMPLING_WO"并存
  2. 工作流状态存在中英双语重复 — 如"待审批(PENDING)"与"待审批(pending_approval)"两套
  3. 角色定义偏少 — 仅8个角色，缺少品质、设备、财务等中心角色
  4. 前端页面全为占位检查通过 — 但实际页面功能深度未知

五、ISO 9001 条款差距汇总（来源 AUDIT_REPORT.md）
✅ 符合 (12项):
  NPI流程、ECN变更、OQC/IPQC/IQC检验、量具管理、NCR、CAPA、
  QCDS供应商评价、采购流程、TPM设备管理、CRM/客诉、工艺路线

⚠️ 部分合规 (8项):
  设计验证、图纸受控、采购记录归档、设计评审节点

❌ 缺失 (10项):
  设计输入记录、批次追溯、SPC、FIFO管控、培训管理、售后跟踪、
  质量目标管理、管理评审、内审模块、知识管理

六、建议优先级

  1.【高】补齐前端页面 — 优先 Finance/Purchase/Warehouse
     这些是日常高频使用的核心业务模块

  2.【高】实现批次追溯 (8.5.2) — 制造业ISO审核必查项
     从原材料入库→生产过程→成品出货的全链路追溯

  3.【中】文件受控管理完善 — 审批→发布→废止的完整闭环

  4.【中】培训管理模块 — 设备操作人员资质、技能矩阵

  5.【低】SPC统计过程控制 — 品控数据分析能力

  6.【低】管理评审/内审/质量目标 — ISO体系运行支撑

  7.【运维】清理编码规则中重复的中英双份条目

========================================
