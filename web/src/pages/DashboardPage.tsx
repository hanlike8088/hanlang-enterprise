import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Typography,
  Tabs,
  Button,
  Input,
  Select,
  Space,
} from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  ExperimentOutlined,
  BugOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  ToolOutlined,
  ContactsOutlined,
  ShoppingOutlined,
  HomeOutlined,
  BankOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  ApartmentOutlined,
  TeamOutlined,
  IdcardOutlined,
  NumberOutlined,
  BranchesOutlined,
  SearchOutlined,
  LinkOutlined,
  PictureOutlined,
  CalculatorOutlined,
  DollarOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceResult, setTraceResult] = useState<any>(null);
  const [traceEntityType, setTraceEntityType] = useState('crmOrder');
  const [traceEntityId, setTraceEntityId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleTrace = async () => {
    if (!traceEntityId) return;
    setTraceLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(
        `/api/dashboard/trace?entityType=${traceEntityType}&entityId=${traceEntityId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTraceResult(await res.json());
    } finally {
      setTraceLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const summary = data?.summary || {};

  const StatCard = ({ title, value, prefix, color }: any) => (
    <Col xs={12} sm={8} md={6} lg={4}>
      <Card>
        <Statistic title={title} value={value || 0} prefix={prefix} valueStyle={{ color }} />
      </Card>
    </Col>
  );

  const renderTraceResult = () => {
    if (!traceResult) return null;
    if (traceResult.error) return <Tag color="red">{traceResult.error}</Tag>;
    return (
      <div style={{ marginTop: 16 }}>
        {traceResult.chains?.map((chain: any, ci: number) => (
          <Card key={ci} title={chain.name} size="small" style={{ marginBottom: 8 }}>
            {chain.error ? (
              <Tag color="orange">{chain.error}</Tag>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {chain.nodes?.map((node: any, ni: number) => (
                  <span key={ni} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag color="blue" style={{ margin: 0 }}>
                      {node.label}
                    </Tag>
                    <Tag style={{ margin: 0, fontSize: 11 }}>{node.id?.slice(0, 8)}</Tag>
                    {ni < (chain.nodes?.length || 0) - 1 && (
                      <LinkOutlined style={{ fontSize: 12, color: '#999' }} />
                    )}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  const tabItems = [
    { key: 'overview', icon: <DashboardOutlined />, label: '总览' },
    { key: 'admin', icon: <ApartmentOutlined />, label: '行政' },
    { key: 'npi', icon: <ProjectOutlined />, label: 'NPI管理' },
    { key: 'plm', icon: <DatabaseOutlined />, label: 'PLM管理' },
    { key: 'crm', icon: <ContactsOutlined />, label: 'CRM管理' },
    { key: 'supplier', icon: <ShoppingOutlined />, label: '供应链' },
    { key: 'equipment', icon: <ToolOutlined />, label: '设备' },
    { key: 'quality', icon: <SafetyCertificateOutlined />, label: '品质' },
    { key: 'trace', icon: <SearchOutlined />, label: '追溯' },
  ].map((tab) => {
    let content: React.ReactNode;
    switch (tab.key) {
      case 'overview':
        content = (
          <>
            <Row gutter={[16, 16]}>
              <StatCard
                title="总模块数"
                value={summary.totalModules}
                prefix={<DashboardOutlined />}
                color="#1677ff"
              />
              <StatCard
                title="项目数"
                value={summary.totalProjects}
                prefix={<ProjectOutlined />}
                color="#52c41a"
              />
              <StatCard
                title="待处理问题"
                value={summary.openIssues}
                prefix={<BugOutlined />}
                color="#ff4d4f"
              />
              <StatCard
                title="待审批"
                value={summary.pendingApprovals}
                prefix={<CheckCircleOutlined />}
                color="#fa8c16"
              />
              <StatCard
                title="活跃工单"
                value={summary.activeOrders}
                prefix={<ShoppingCartOutlined />}
                color="#722ed1"
              />
            </Row>
            <Title level={5} style={{ marginTop: 16 }}>
              模块概览
            </Title>
            <Row gutter={[16, 16]}>
              <StatCard title="组织" value={data?.admin?.orgCount} prefix={<ApartmentOutlined />} />
              <StatCard title="员工" value={data?.admin?.employeeCount} prefix={<TeamOutlined />} />
              <StatCard
                title="NPI项目"
                value={data?.npi?.projectCount}
                prefix={<ProjectOutlined />}
              />
              <StatCard
                title="PLM产品"
                value={data?.plm?.productCount}
                prefix={<DatabaseOutlined />}
              />
              <StatCard
                title="CRM客户"
                value={data?.crm?.customerCount}
                prefix={<ContactsOutlined />}
              />
              <StatCard
                title="CRM订单"
                value={data?.crm?.orderCount}
                prefix={<FileDoneOutlined />}
              />
              <StatCard
                title="供应商"
                value={data?.supplier?.supplierCount}
                prefix={<ShoppingOutlined />}
              />
              <StatCard
                title="采购单"
                value={data?.purchase?.poCount}
                prefix={<ShoppingCartOutlined />}
              />
              <StatCard
                title="设备"
                value={data?.equipment?.equipCount}
                prefix={<ToolOutlined />}
              />
              <StatCard
                title="不合格报告"
                value={data?.quality?.ncrCount}
                prefix={<WarningOutlined />}
              />
              <StatCard
                title="检验记录"
                value={data?.quality?.inspRecordCount}
                prefix={<SafetyCertificateOutlined />}
              />
              <StatCard
                title="ERP物料"
                value={data?.erp?.materialCount}
                prefix={<NumberOutlined />}
              />
            </Row>
          </>
        );
        break;
      case 'admin':
        content = (
          <Row gutter={[16, 16]}>
            <StatCard title="组织" value={data?.admin?.orgCount} prefix={<ApartmentOutlined />} />
            <StatCard title="岗位" value={data?.admin?.positionCount} prefix={<IdcardOutlined />} />
            <StatCard title="员工" value={data?.admin?.employeeCount} prefix={<TeamOutlined />} />
            <StatCard
              title="角色"
              value={data?.admin?.roleCount}
              prefix={<SafetyCertificateOutlined />}
            />
          </Row>
        );
        break;
      case 'npi':
        content = (
          <>
            <Row gutter={[16, 16]}>
              <StatCard title="项目" value={data?.npi?.projectCount} prefix={<ProjectOutlined />} />
              <StatCard
                title="试产"
                value={data?.npi?.trialRunCount}
                prefix={<ExperimentOutlined />}
              />
              <StatCard title="问题" value={data?.npi?.issueCount} prefix={<BugOutlined />} />
              <StatCard
                title="待处理"
                value={data?.npi?.openIssueCount}
                prefix={<BugOutlined />}
                color={data?.npi?.openIssueCount > 0 ? '#ff4d4f' : '#3f8600'}
              />
              <StatCard
                title="待审批"
                value={data?.npi?.pendingApprovalCount}
                prefix={<CheckCircleOutlined />}
              />
            </Row>
            {data?.npi?.recentProjects?.length > 0 && (
              <Table
                style={{ marginTop: 16 }}
                title={() => <strong>最近项目</strong>}
                dataSource={data.npi.recentProjects}
                columns={[
                  { title: '编码', dataIndex: 'projectCode' },
                  { title: '名称', dataIndex: 'projectName' },
                  { title: '状态', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
                  {
                    title: '更新时间',
                    dataIndex: 'updatedAt',
                    render: (d: string) => dayjs(d).format('MM-DD HH:mm'),
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={false}
              />
            )}
          </>
        );
        break;
      case 'plm':
        content = (
          <Row gutter={[16, 16]}>
            <StatCard title="产品" value={data?.plm?.productCount} prefix={<DatabaseOutlined />} />
            <StatCard title="BOM" value={data?.plm?.bomCount} prefix={<BranchesOutlined />} />
            <StatCard title="文档" value={data?.plm?.docCount} prefix={<FileTextOutlined />} />
            <StatCard title="图纸" value={data?.plm?.drawingCount} prefix={<PictureOutlined />} />
            <StatCard
              title="图纸版本"
              value={data?.plm?.drawingVersionCount}
              prefix={<ScheduleOutlined />}
            />
          </Row>
        );
        break;
      case 'crm':
        content = (
          <>
            <Row gutter={[16, 16]}>
              <StatCard
                title="客户"
                value={data?.crm?.customerCount}
                prefix={<ContactsOutlined />}
              />
              <StatCard
                title="联系人"
                value={data?.crm?.contactCount}
                prefix={<CheckCircleOutlined />}
              />
              <StatCard
                title="报价"
                value={data?.crm?.quoteCount}
                prefix={<CalculatorOutlined />}
              />
              <StatCard
                title="订单"
                value={data?.crm?.orderCount}
                prefix={<ShoppingCartOutlined />}
              />
              <StatCard
                title="活跃订单"
                value={data?.crm?.orderOpenCount}
                prefix={<ShoppingOutlined />}
                color="#fa8c16"
              />
              <StatCard
                title="客诉"
                value={data?.crm?.complaintCount}
                prefix={<WarningOutlined />}
              />
              <StatCard
                title="对账"
                value={data?.crm?.reconciliationCount}
                prefix={<BankOutlined />}
              />
              <StatCard title="回款" value={data?.crm?.paymentCount} prefix={<DollarOutlined />} />
            </Row>
            {data?.crm?.recentOrders?.length > 0 && (
              <Table
                style={{ marginTop: 16 }}
                title={() => <strong>最近订单</strong>}
                dataSource={data.crm.recentOrders}
                columns={[
                  { title: '订单编号', dataIndex: 'orderCode' },
                  { title: '金额', dataIndex: 'totalAmount' },
                  { title: '状态', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
                  {
                    title: '更新时间',
                    dataIndex: 'updatedAt',
                    render: (d: string) => dayjs(d).format('MM-DD HH:mm'),
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={false}
              />
            )}
          </>
        );
        break;
      case 'supplier':
        content = (
          <Row gutter={[16, 16]}>
            <StatCard
              title="供应商"
              value={data?.supplier?.supplierCount}
              prefix={<ContactsOutlined />}
            />
            <StatCard
              title="QCDS评分"
              value={data?.supplier?.supplierQcdsCount}
              prefix={<CheckCircleOutlined />}
            />
            <StatCard
              title="采购单"
              value={data?.purchase?.poCount}
              prefix={<ShoppingCartOutlined />}
            />
            <StatCard
              title="到货记录"
              value={data?.purchase?.poReceiptCount}
              prefix={<ShoppingOutlined />}
            />
            <StatCard
              title="仓库"
              value={data?.warehouse?.warehouseCount}
              prefix={<HomeOutlined />}
            />
            <StatCard
              title="库位"
              value={data?.warehouse?.locationCount}
              prefix={<ScheduleOutlined />}
            />
            <StatCard
              title="库存记录"
              value={data?.warehouse?.inventoryCount}
              prefix={<DatabaseOutlined />}
            />
            <StatCard
              title="应付对账"
              value={data?.finance?.apRecCount}
              prefix={<BankOutlined />}
            />
            <StatCard
              title="应付付款"
              value={data?.finance?.apPaymentCount}
              prefix={<DollarOutlined />}
            />
          </Row>
        );
        break;
      case 'equipment':
        content = (
          <>
            <Row gutter={[16, 16]}>
              <StatCard
                title="设备"
                value={data?.equipment?.equipCount}
                prefix={<ToolOutlined />}
              />
              <StatCard
                title="TPM计划"
                value={data?.equipment?.tpmPlanCount}
                prefix={<ScheduleOutlined />}
              />
              <StatCard
                title="TPM记录"
                value={data?.equipment?.tpmRecordCount}
                prefix={<CheckCircleOutlined />}
              />
              <StatCard
                title="保养计划"
                value={data?.equipment?.maintPlanCount}
                prefix={<ToolOutlined />}
              />
              <StatCard
                title="维修"
                value={data?.equipment?.repairCount}
                prefix={<WarningOutlined />}
              />
              <StatCard
                title="备件"
                value={data?.equipment?.sparePartCount}
                prefix={<ShoppingCartOutlined />}
              />
            </Row>
            {data?.equipment?.recentRepairs?.length > 0 && (
              <Table
                style={{ marginTop: 16 }}
                title={() => <strong>最近维修</strong>}
                dataSource={data.equipment.recentRepairs}
                columns={[
                  { title: '编码', dataIndex: 'requestCode' },
                  {
                    title: '设备',
                    dataIndex: 'equipmentId',
                    render: (id: string) => id?.slice(0, 8),
                  },
                  { title: '状态', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
                  {
                    title: '更新时间',
                    dataIndex: 'updatedAt',
                    render: (d: string) => dayjs(d).format('MM-DD HH:mm'),
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={false}
              />
            )}
          </>
        );
        break;
      case 'quality':
        content = (
          <Row gutter={[16, 16]}>
            <StatCard
              title="检验标准"
              value={data?.quality?.inspStandardCount}
              prefix={<FileTextOutlined />}
            />
            <StatCard
              title="来料检验"
              value={data?.quality?.incomingMatCount}
              prefix={<ShoppingCartOutlined />}
            />
            <StatCard
              title="检验记录"
              value={data?.quality?.inspRecordCount}
              prefix={<CheckCircleOutlined />}
            />
            <StatCard
              title="不合格报告"
              value={data?.quality?.ncrCount}
              prefix={<WarningOutlined />}
              color="#ff4d4f"
            />
            <StatCard title="CAPA" value={data?.quality?.capaCount} prefix={<BugOutlined />} />
            <StatCard title="量具" value={data?.quality?.gaugeCount} prefix={<ToolOutlined />} />
          </Row>
        );
        break;
      case 'trace':
        content = (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Select
                value={traceEntityType}
                onChange={setTraceEntityType}
                style={{ width: 160 }}
                options={[
                  { value: 'crmOrder', label: 'CRM订单' },
                  { value: 'npiProject', label: 'NPI项目' },
                  { value: 'purchaseOrder', label: '采购单' },
                  { value: 'repairRequest', label: '维修申请' },
                  { value: 'ncrReport', label: '不合格报告' },
                ]}
              />
              <Input
                placeholder="实体ID"
                value={traceEntityId}
                onChange={(e) => setTraceEntityId(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleTrace}
                loading={traceLoading}
              >
                Trace
              </Button>
            </Space>
            {renderTraceResult()}
          </>
        );
        break;
      default:
        content = null;
    }
    return { ...tab, children: content };
  });

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        瀚朗企业驾驶舱
      </Title>
      <Tabs defaultActiveKey="overview" items={tabItems} />
    </div>
  );
}
