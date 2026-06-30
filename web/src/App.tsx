import { useState } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { ResponsiveContext } from './hooks/ResponsiveContext';
import './mobile.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, theme, Dropdown, Avatar, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppRoutes from './routes';
import menuItems from './config/menu';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function AppShell() {
  const { token, user, perms, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token: themeToken } = theme.useToken();
  const isMobile = useIsMobile();

  if (!token) {
    return <LoginPage onLoginSuccess={login} />;
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.name || user?.username },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname;

  // Permission filter for menu
  const hasAll = perms.includes('*');
  const permMap: Record<string, string> = {
    '/crm/customers': 'crm:customer:read',
    '/crm/quotes': 'crm:quote:read',
    '/crm/orders': 'crm:order:read',
    '/crm/complaints': 'crm:complaint:read',
    '/crm/payments': 'crm:payment:read',
    '/crm/reconciliations': 'crm:reconciliation:read',
    '/npi/sampling': 'sampling:order:read',
  };

  const filteredMenu = menuItems
    .filter((group: any) => {
      if (hasAll) return true;
      return group.children.some((item: any) => {
        const needed = permMap[item.key as string];
        return needed ? perms.includes(needed) : false;
      });
    })
    .map((group: any) => ({
      ...group,
      children: group.children.filter((item: any) => {
        if (hasAll) return true;
        const needed = permMap[item.key as string];
        return needed ? perms.includes(needed) : false;
      }),
    }));

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
              {collapsed ? '濊' : '濊朗电机'}
            </Title>
          </div>
          <Menu
            mode="inline"
            defaultOpenKeys={['rd', 'marketing']}
            selectedKeys={[selectedKey]}
            items={filteredMenu}
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
              濊朗电机 — 企业管理系统
            </Title>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') logout();
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
            <AppRoutes />
          </Content>
        </Layout>
      </Layout>
    </ResponsiveContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
