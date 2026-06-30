import React from 'react';
import { Layout, Menu, Typography, theme, Dropdown, Avatar, Space } from 'antd';
import {
  ContactsOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  ToolOutlined,
  ProjectOutlined,
  BugOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  PictureOutlined,
  UserOutlined,
  LogoutOutlined,
  ApiOutlined,
  SettingOutlined,
  NumberOutlined,
  BranchesOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  IdcardOutlined,
  TeamOutlined,
  WalletOutlined,
  AuditOutlined,
  AimOutlined,
  LineChartOutlined,
  NodeIndexOutlined,
  CalculatorOutlined,
  BookOutlined,
  ReadOutlined,
  BankOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  AlertOutlined,
  SearchOutlined,
  HistoryOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  BellOutlined,
  CloudServerOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  DollarOutlined,
} from '@ant-design/icons';

import DashboardPage from './pages/DashboardPage';

import KnowledgePage from './pages/KnowledgePage';
import NotificationPage from './pages/NotificationPage';
import BackupPage from './pages/BackupPage';
import ArchivePage from './pages/ArchivePage';
import OrganizationPage from './pages/Admin/OrganizationPage';
import PositionPage from './pages/Admin/PositionPage';
import EmployeePage from './pages/Admin/EmployeePage';
import RolePermissionPage from './pages/Admin/RolePermissionPage';
import CodingRulesPage from './pages/Admin/CodingRulesPage';
import WorkflowStatesPage from './pages/Admin/WorkflowStatesPage';
import SystemSettingsPage from './pages/Admin/SystemSettingsPage';
import K3CloudPage from './pages/K3CloudPage';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const menuItems = [
  {
    key: 'rd',
    icon: <ExperimentOutlined />,
    label: '研发中心',
    children: [
      { key: '/plm/products', icon: <DatabaseOutlined />, label: '产品管理' },
      { key: '/plm/documents', icon: <FileTextOutlined />, label: '技术文档' },
      { key: '/plm/patents', icon: <SafetyCertificateOutlined />, label: '专利管理' },
      { key: '/plm/drawing-versions', icon: <PictureOutlined />, label: '图纸版本' },
      { key: '/npi/projects', icon: <ProjectOutlined />, label: 'NPI项目' },
      { key: '/npi/trial-runs', icon: <ExperimentOutlined />, label: '试产流转' },
      { key: '/npi/issues', icon: <BugOutlined />, label: '问题跟踪' },
      { key: '/npi/approvals', icon: <CheckCircleOutlined />, label: 'NPI审批' },
      { key: '/npi/sampling', icon: <ScheduleOutlined />, label: '打样工单' },
    ],
  },
  {
    key: 'marketing',
    icon: <ShopOutlined />,
    label: '营销中心',
    children: [
      { key: '/crm/customers', icon: <ContactsOutlined />, label: '客户管理' },
      { key: '/crm/quotes', icon: <CalculatorOutlined />, label: '报价管理' },
      { key: '/crm/orders', icon: <ShoppingCartOutlined />, label: '销售订单' },
      { key: '/crm/complaints', icon: <AlertOutlined />, label: '客诉管理' },
      { key: '/crm/reconciliations', icon: <BankOutlined />, label: '对账管理' },
      { key: '/crm/payments', icon: <DollarOutlined />, label: '回款管理' },
    ],
  },
  {
    key: 'supplychain',
    icon: <ShoppingOutlined />,
    label: '供应链中心',
    children: [
      { key: '/supplier', icon: <ShopOutlined />, label: '供应商' },
      { key: '/purchase', icon: <ShoppingCartOutlined />, label: '采购单' },
      { key: '/warehouse', icon: <EnvironmentOutlined />, label: '仓库' },
      { key: '/erp/materials', icon: <DatabaseOutlined />, label: '物料管理' },
    ],
  },
  {
    key: 'manufacturing',
    icon: <ToolOutlined />,
    label: '制造中心',
    children: [
      { key: '/erp/work-orders', icon: <ToolOutlined />, label: '生产工单' },
      { key: '/manufacturing/scheduling', icon: <ScheduleOutlined />, label: '生产排产' },
      { key: '/manufacturing/orders', icon: <ToolOutlined />, label: '制造工单' },
      { key: '/manufacturing/wip', icon: <DatabaseOutlined />, label: '在制看板' },
      { key: '/manufacturing/efficiency', icon: <LineChartOutlined />, label: '工时效率' },
      { key: '/mrp', icon: <ThunderboltOutlined />, label: 'MRP运算' },
    ],
  },
  {
    key: 'quality',
    icon: <SafetyCertificateOutlined />,
    label: '品质中心',
    children: [
      { key: '/quality/iqc', icon: <SearchOutlined />, label: '来料检验IQC' },
      { key: '/quality/ipqc', icon: <ToolOutlined />, label: '过程检验IPQC' },
      { key: '/quality/oqc', icon: <CheckCircleOutlined />, label: '出货检验OQC' },
      { key: '/quality/gauge', icon: <SettingOutlined />, label: '量具管理' },
      { key: '/spc', icon: <LineChartOutlined />, label: '统计过程控制' },
      { key: '/quality/dashboard', icon: <AimOutlined />, label: '质量驾驶舱' },
    ],
  },
  {
    key: 'equipment',
    icon: <ToolOutlined />,
    label: '设备工程',
    children: [
      { key: '/equipment', icon: <ToolOutlined />, label: '设备台账' },
      { key: '/equipment/tpm', icon: <CheckCircleOutlined />, label: '设备点检' },
      { key: '/equipment/repair', icon: <AlertOutlined />, label: '维修管理' },
      { key: '/equipment/parts', icon: <DatabaseOutlined />, label: '备件管理' },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: '财务中心',
    children: [
      { key: '/finance', icon: <WalletOutlined />, label: '财务' },
      { key: '/cost', icon: <CalculatorOutlined />, label: '成本核算' },
    ],
  },
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: '管理中心',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
      { key: '/admin/org', icon: <ApartmentOutlined />, label: '组织管理' },
      { key: '/admin/position', icon: <IdcardOutlined />, label: '岗位管理' },
      { key: '/admin/employee', icon: <TeamOutlined />, label: '员工管理' },
      { key: '/admin/role-permission', icon: <SafetyCertificateOutlined />, label: '角色权限' },
      { key: '/admin/coding-rules', icon: <NumberOutlined />, label: '编码规则' },
      { key: '/admin/workflow-states', icon: <BranchesOutlined />, label: '工作流' },
      { key: '/admin/system-settings', icon: <SettingOutlined />, label: '系统设置' },
      { key: '/audit', icon: <AuditOutlined />, label: '内部审核' },
      { key: '/backup', icon: <CloudServerOutlined />, label: '数据备份' },
      { key: '/archive', icon: <FolderOpenOutlined />, label: '数据归档' },
      { key: '/notifications', icon: <BellOutlined />, label: '通知中心' },
      { key: '/knowledge', icon: <ReadOutlined />, label: '知识管理' },
    ],
  },
  {
    key: 'integration',
    icon: <ApiOutlined />,
    label: '系统对接',
    children: [
      { key: '/k3cloud', icon: <ApiOutlined />, label: '金蝶对接' },
      { key: '/trace', icon: <NodeIndexOutlined />, label: '追溯查询' },
      { key: '/docs/control', icon: <ReadOutlined />, label: '文档控制' },
      { key: '/training', icon: <BookOutlined />, label: '培训管理' },
    ],
  },
];

export default menuItems;
