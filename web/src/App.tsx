import { useState, useEffect } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { ResponsiveContext } from './hooks/ResponsiveContext';
import './mobile.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import LoginPage from './pages/LoginPage';
import SamplingWorkOrdersPage from './pages/NPI/SamplingWorkOrdersPage';
import ProjectsPage from './pages/NPI/ProjectsPage';
import TrialRunsPage from './pages/NPI/TrialRunsPage';
import IssuesPage from './pages/NPI/IssuesPage';
import ApprovalsPage from './pages/NPI/ApprovalsPage';
import ProductsPage from './pages/PLM/ProductsPage';
import DocumentsPage from './pages/PLM/DocumentsPage';
import PatentsPage from './pages/PLM/PatentsPage';
import DrawingVersionsPage from './pages/PLM/DrawingVersionsPage';
import CustomersPage from './pages/CRM/CustomersPage';
import QuotesPage from './pages/CRM/QuotesPage';
import OrdersPage from './pages/CRM/OrdersPage';
import ComplaintsPage from './pages/CRM/ComplaintsPage';
import PaymentsPage from './pages/CRM/PaymentsPage';
import ReconciliationPage from './pages/CRM/ReconciliationPage';
import MaterialsPage from './pages/ERP/MaterialsPage';
import WorkOrdersPage from './pages/ERP/WorkOrdersPage';
import SupplierPage from './pages/SupplierPage';
import PurchasePage from './pages/PurchasePage';
import WarehousePage from './pages/WarehousePage';
import FinancePage from './pages/FinancePage';
import SchedulingPage from './pages/Manufacturing/SchedulingPage';
import WorkOrderPage from './pages/Manufacturing/WorkOrderPage';
import WipPage from './pages/Manufacturing/WipPage';
import EfficiencyPage from './pages/Manufacturing/EfficiencyPage';
import IQCPage from './pages/Quality/IQCPage';
import IPQCPage from './pages/Quality/IPQCPage';
import OQCPage from './pages/Quality/OQCPage';
import GaugePage from './pages/Quality/GaugePage';
import EquipmentPage from './pages/Equipment/EquipmentPage';
import TpmPage from './pages/Equipment/TpmPage';
import RepairPage from './pages/Equipment/RepairPage';
import SparePartsPage from './pages/Equipment/SparePartsPage';
import MRPPage from './pages/MRPPage';
import QualityDashboardPage from './pages/QualityDashboardPage';
import AuditPage from './pages/AuditPage';
import SPCPage from './pages/SPCPage';
import TracePage from './pages/TracePage';
import CostPage from './pages/CostPage';
import TrainingPage from './pages/TrainingPage';
import DocumentControlPage from './pages/DocumentControlPage';
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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [permsLoaded, setPermsLoaded] = useState(false);
  const { token: themeToken } = theme.useToken();
  const isMobile = useIsMobile();

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    // Fetch user permissions
    fetch('/api/auth/permissions', { headers: { Authorization: 'Bearer ' + newToken } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPerms(data);
          localStorage.setItem('permissions', JSON.stringify(data));
        }
      })
      .catch(() => {});
    setPermsLoaded(true);
    setToken(newToken);
    setUser(newUser);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  useEffect(() => {
    const origFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers as Record<string, string>) || {};
      const storedToken = localStorage.getItem('access_token');
      if (storedToken && !headers.Authorization) {
        headers.Authorization = `Bearer ${storedToken}`;
      }
      return origFetch(input, { ...init, headers });
    };
    return () => {
      window.fetch = origFetch;
    };
  }, []);

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.name || user?.username },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname;

  return (
    <ResponsiveContext.Provider value={{ isMobile }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{ background: themeToken.colorBgContainer }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            }}
          >
            <Title
              level={4}
              style={{ margin: 0, color: themeToken.colorPrimary, whiteSpace: 'nowrap' }}
            >
              {collapsed ? '瀚' : '瀚朗电机'}
            </Title>
          </div>
          <Menu
            mode="inline"
            defaultOpenKeys={['rd', 'marketing']}
            selectedKeys={[selectedKey]}
            items={menuItems
              .filter((group) => {
                const hasAll = perms.includes('*');
                if (hasAll) return true;
                const filteredChildren = group.children.filter((item) => {
                  const permMap: Record<string, string> = {
                    '/crm/customers': 'crm:customer:read',
                    '/crm/quotes': 'crm:quote:read',
                    '/crm/orders': 'crm:order:read',
                    '/crm/complaints': 'crm:complaint:read',
                    '/crm/payments': 'crm:payment:read',
                    '/crm/reconciliations': 'crm:reconciliation:read',
                    '/npi/sampling': 'sampling:order:read',
                  };
                  const needed = permMap[item.key as string];
                  if (!needed) return false;
                  return perms.includes(needed);
                });
                return filteredChildren.length > 0;
              })
              .map((group) => ({
                ...group,
                children: group.children.filter((item) => {
                  const hasAll = perms.includes('*');
                  if (hasAll) return true;
                  const permMap: Record<string, string> = {
                    '/crm/customers': 'crm:customer:read',
                    '/crm/quotes': 'crm:quote:read',
                    '/crm/orders': 'crm:order:read',
                    '/crm/complaints': 'crm:complaint:read',
                    '/crm/payments': 'crm:payment:read',
                    '/crm/reconciliations': 'crm:reconciliation:read',
                    '/npi/sampling': 'sampling:order:read',
                  };
                  const needed = permMap[item.key as string];
                  if (!needed) return false;
                  return perms.includes(needed);
                }),
              }))}
            onClick={({ key }) => navigate(key)}
            style={{ borderInlineEnd: 'none' }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              background: themeToken.colorBgContainer,
              padding: '0 24px',
              borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              瀚朗电机 — 企业管理系统
            </Title>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                },
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{user?.name || user?.username}</Text>
              </Space>
            </Dropdown>
          </Header>
          <Content style={{ margin: 24 }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/npi/sampling" element={<SamplingWorkOrdersPage />} />
              <Route path="/npi/projects" element={<ProjectsPage />} />
              <Route path="/npi/trial-runs" element={<TrialRunsPage />} />
              <Route path="/npi/issues" element={<IssuesPage />} />
              <Route path="/npi/approvals" element={<ApprovalsPage />} />
              <Route path="/plm/products" element={<ProductsPage />} />
              <Route path="/plm/documents" element={<DocumentsPage />} />
              <Route path="/plm/patents" element={<PatentsPage />} />
              <Route path="/plm/drawing-versions" element={<DrawingVersionsPage />} />
              <Route path="/crm/customers" element={<CustomersPage />} />
              <Route path="/crm/quotes" element={<QuotesPage />} />
              <Route path="/crm/orders" element={<OrdersPage />} />
              <Route path="/crm/complaints" element={<ComplaintsPage />} />
              <Route path="/crm/payments" element={<PaymentsPage />} />
              <Route path="/crm/reconciliations" element={<ReconciliationPage />} />
              <Route path="/erp/materials" element={<MaterialsPage />} />
              <Route path="/erp/work-orders" element={<WorkOrdersPage />} />
              <Route path="/supplier" element={<SupplierPage />} />
              <Route path="/purchase" element={<PurchasePage />} />
              <Route path="/warehouse" element={<WarehousePage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/manufacturing/scheduling" element={<SchedulingPage />} />
              <Route path="/manufacturing/orders" element={<WorkOrderPage />} />
              <Route path="/manufacturing/wip" element={<WipPage />} />
              <Route path="/manufacturing/efficiency" element={<EfficiencyPage />} />
              <Route path="/quality/iqc" element={<IQCPage />} />
              <Route path="/quality/ipqc" element={<IPQCPage />} />
              <Route path="/quality/oqc" element={<OQCPage />} />
              <Route path="/quality/gauge" element={<GaugePage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/equipment/tpm" element={<TpmPage />} />
              <Route path="/equipment/repair" element={<RepairPage />} />
              <Route path="/equipment/parts" element={<SparePartsPage />} />
              <Route path="/mrp" element={<MRPPage />} />
              <Route path="/quality/dashboard" element={<QualityDashboardPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/spc" element={<SPCPage />} />
              <Route path="/trace" element={<TracePage />} />
              <Route path="/cost" element={<CostPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/docs/control" element={<DocumentControlPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/k3cloud" element={<K3CloudPage />} />
              <Route path="/admin/org" element={<OrganizationPage />} />
              <Route path="/admin/position" element={<PositionPage />} />
              <Route path="/admin/employee" element={<EmployeePage />} />
              <Route path="/admin/role-permission" element={<RolePermissionPage />} />
              <Route path="/admin/coding-rules" element={<CodingRulesPage />} />
              <Route path="/admin/workflow-states" element={<WorkflowStatesPage />} />
              <Route path="/admin/system-settings" element={<SystemSettingsPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ResponsiveContext.Provider>
  );
}
