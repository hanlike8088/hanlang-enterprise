import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Tabs,
  InputNumber,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  SyncOutlined,
  BankOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { financeApi } from '../services/finance';
import { purchaseApi } from '../services/purchase';;
import dayjs from 'dayjs';

const recStatusColors: Record<string, string> = {
  待对账: 'default',
  已匹配: 'green',
  有差异: 'red',
  已确认: 'blue',
  已付款: 'purple',
};

export default function FinancePage() {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [aging, setAging] = useState<any>({});
  const [differences, setDifferences] = useState<any[]>([]);
  const [paymentPlan, setPaymentPlan] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);
  const [reconModalOpen, setReconModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRecon, setSelectedRecon] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('reconciliations');
  const [reconForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [recs, age, diffs, pays, plan, st, pos] = await Promise.all([
        financeApi.getReconciliations(),
        financeApi.getAgingAnalysis(),
        financeApi.getDifferences(),
        financeApi.getPayments(),
        financeApi.getPaymentPlan(),
        financeApi.getStats(),
        purchaseApi.getAll(),
      ]);
      setPaymentPlan(plan);
      setReconciliations(recs);
      setAging(age);
      setDifferences(diffs);
      setPayments(pays);
      setStats(st);
      setPurchaseOrders(pos);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);

  const submitRecon = async () => {
    const v = await reconForm.validateFields();
    await financeApi.generateReconciliation(v.purchaseOrderId, v.invoiceAmount);
    message.success('对账记录已生成');
    setReconModalOpen(false);
    fetchAll();
  };

  const confirmRecon = async (id: string) => {
    await financeApi.confirmReconciliation(id, '财务人员');
    message.success('对账已确认');
    fetchAll();
  };

  const openStatement = async (rec: any) => {
    setSelectedRecon(rec);
    const data = await financeApi.getStatement(rec.supplierId);
    setStatementData(data);
    setStatementOpen(true);
  };
  const openPayment = (rec: any) => {
    setSelectedRecon(rec);
    paymentForm.resetFields();
    setPaymentModalOpen(true);
  };
  const submitPayment = async () => {
    const v = await paymentForm.validateFields();
    await financeApi.createPayment({
      ...v,
      reconciliationId: selectedRecon.id,
      supplierId: selectedRecon.supplierId,
    });
    message.success('付款已记录');
    await financeApi.markAsPaid(selectedRecon.id);
    setPaymentModalOpen(false);
    fetchAll();
  };

  const handleFetchAp = async () => {
    try {
      const result = await financeApi.fetchApFromK3();
      message.success('已读取 ' + result.total + ' 条金蝶应付数据');
    } catch (e: any) {
      message.error('读取失败: ' + (e?.response?.data?.message || e.message));
    }
  };

  const handleSync = async (id: string) => {
    await financeApi.syncToK3(id);
    message.success('已同步至金蝶');
  };

  const recColumns = [
    { title: '对账单号', dataIndex: 'reconCode', key: 'code', width: 130 },
    {
      title: '供应商',
      key: 'supplier',
      width: 150,
      render: (_: any, r: any) => r.supplier?.supplierName || '-',
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'oa',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '入库金额',
      dataIndex: 'receiptAmount',
      key: 'ra',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '发票金额',
      dataIndex: 'invoiceAmount',
      key: 'ia',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '差异额',
      dataIndex: 'diffAmount',
      key: 'diff',
      width: 100,
      render: (v: number) =>
        v && v !== 0 ? <span style={{ color: 'red' }}>¥{v.toFixed(2)}</span> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => <Tag color={recStatusColors[v]}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: any, r: any) => (
        <Space size="small">
          {r.status === '待对账' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => confirmRecon(r.id)}
            >
              确认
            </Button>
          )}
          {(r.status === '已确认' || r.status === '有差异') && (
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => openPayment(r)}
            >
              付款
            </Button>
          )}
          {r.status === '已确认' && (
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => handleSync(r.id)}
            >
              同步金蝶
            </Button>
          )}
          {/* 测试阶段隐藏：{r.status === '已确认' && <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => handleSync(r.id)}>同步金蝶</Button>} */}
        </Space>
      ),
    },
  ];

  const planColumns = [
    {
      title: '供应商',
      key: 'supplier',
      width: 150,
      render: (_: any, r: any) => r.supplierName || r.supplierCode,
    },
    { title: '对账单号', dataIndex: 'reconCode', key: 'code', width: 130 },
    {
      title: '发票金额',
      dataIndex: 'invoiceAmount',
      key: 'ia',
      width: 100,
      render: (v: number) => '¥' + (v || 0).toFixed(2),
    },
    {
      title: '已付',
      dataIndex: 'paidAmount',
      key: 'paid',
      width: 100,
      render: (v: number) => '¥' + (v || 0).toFixed(2),
    },
    {
      title: '剩余',
      dataIndex: 'remaining',
      key: 'rem',
      width: 100,
      render: (v: number) => <span style={{ color: 'red' }}>{'¥' + (v || 0).toFixed(2)}</span>,
    },
    { title: '账期', dataIndex: 'paymentTerms', key: 'terms', width: 80 },
    {
      title: '应付日',
      dataIndex: 'dueDate',
      key: 'due',
      width: 110,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const color = v === '已逾期' ? 'red' : v === '即将到期' ? 'orange' : 'green';
        return <Tag color={color}>{v}</Tag>;
      },
    },
  ];
  const paymentColumns = [
    { title: '付款编号', dataIndex: 'paymentCode', key: 'code', width: 130 },
    {
      title: '对账单号',
      key: 'recon',
      width: 130,
      render: (_: any, r: any) => r.reconciliation?.reconCode || '-',
    },
    {
      title: '供应商',
      key: 'sup',
      width: 150,
      render: (_: any, r: any) => r.reconciliation?.supplier?.supplierName || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amt',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2)}`,
    },
    { title: '付款方式', dataIndex: 'paymentMethod', key: 'method', width: 100 },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'date',
      width: 110,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, r: any) => (
        <Popconfirm
          title="确定删除？"
          onConfirm={async () => {
            await financeApi.deletePayment(r.id);
            fetchAll();
          }}
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const diffColumns = [
    { title: '对账单号', dataIndex: 'reconCode', key: 'code', width: 130 },
    {
      title: '供应商',
      key: 'supplier',
      width: 150,
      render: (_: any, r: any) => r.supplier?.supplierName || '-',
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'oa',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '发票金额',
      dataIndex: 'invoiceAmount',
      key: 'ia',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '差异额',
      dataIndex: 'diffAmount',
      key: 'diff',
      width: 100,
      render: (v: number) => (
        <span style={{ color: 'red', fontWeight: 'bold' }}>¥{v?.toFixed(2)}</span>
      ),
    },
    {
      title: '差异类型',
      dataIndex: 'diffType',
      key: 'dtype',
      width: 100,
      render: (v: string) => <Tag color="red">{v}</Tag>,
    },
  ];

  const agingData = () => {
    const all: any[] = [];
    (aging.over90 || []).forEach((r: any) => all.push({ ...r, aging: '90天以上' }));
    (aging.within90 || []).forEach((r: any) => all.push({ ...r, aging: '61-90天' }));
    (aging.within60 || []).forEach((r: any) => all.push({ ...r, aging: '31-60天' }));
    (aging.within30 || []).forEach((r: any) => all.push({ ...r, aging: '1-30天' }));
    (aging.notDue || []).forEach((r: any) => all.push({ ...r, aging: '未到期' }));
    return all;
  };

  const agingColumns = [
    { title: '对账单号', dataIndex: 'reconCode', key: 'code', width: 130 },
    {
      title: '供应商',
      key: 'sup',
      width: 150,
      render: (_: any, r: any) => r.supplier?.supplierName || '-',
    },
    {
      title: '发票金额',
      dataIndex: 'invoiceAmount',
      key: 'ia',
      width: 100,
      render: (v: number) => `¥${v?.toFixed(2)}`,
    },
    {
      title: '未付余额',
      dataIndex: 'balance',
      key: 'bal',
      width: 100,
      render: (v: number) => <span style={{ color: 'red' }}>¥{v?.toFixed(2)}</span>,
    },
    {
      title: '账龄',
      dataIndex: 'aging',
      key: 'aging',
      width: 100,
      render: (v: string) => {
        const color =
          v === '90天以上'
            ? 'red'
            : v === '61-90天'
              ? 'orange'
              : v === '31-60天'
                ? 'gold'
                : v === '1-30天'
                  ? 'blue'
                  : 'default';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => <Tag color={recStatusColors[v]}>{v}</Tag>,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="对账总数" value={stats.totalRecs || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待对账"
              value={stats.pendingRecs || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="差异预警"
              value={stats.diffRecs || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="累计付款" value={stats.totalPaid || 0} prefix="¥" precision={2} />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'reconciliations',
            label: '对账管理',
            children: (
              <Card
                extra={
                  <Space>
                    <Button icon={<SyncOutlined />} onClick={handleFetchAp}>
                      读取金蝶应付
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        reconForm.resetFields();
                        setReconModalOpen(true);
                      }}
                    >
                      生成对账单
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={reconciliations}
                  columns={recColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'differences',
            label: (
              <span>
                <WarningOutlined /> 差异预警{' '}
                {differences.length > 0 && (
                  <Badge count={differences.length} size="small" style={{ marginLeft: 8 }} />
                )}
              </span>
            ),
            children: (
              <Card>
                <Table
                  dataSource={differences}
                  columns={diffColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'aging',
            label: (
              <span>
                <PieChartOutlined /> 账龄分析
              </span>
            ),
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="90天以上"
                        value={aging.over90?.length || 0}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="61-90天"
                        value={aging.within90?.length || 0}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="31-60天"
                        value={aging.within60?.length || 0}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="1-30天"
                        value={aging.within30?.length || 0}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic title="未到期" value={aging.notDue?.length || 0} />
                    </Card>
                  </Col>
                </Row>
                <Table
                  dataSource={agingData()}
                  columns={agingColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'paymentPlan',
            label: (
              <span>
                <DollarOutlined /> 付款计划
              </span>
            ),
            children: (
              <Card>
                <Table
                  dataSource={paymentPlan}
                  columns={planColumns}
                  rowKey="reconCode"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'payments',
            label: (
              <span>
                <BankOutlined /> 付款记录
              </span>
            ),
            children: (
              <Card>
                <Table
                  dataSource={payments}
                  columns={paymentColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="生成对账单"
        open={reconModalOpen}
        onOk={submitRecon}
        onCancel={() => setReconModalOpen(false)}
        width={480}
      >
        <Form form={reconForm} layout="vertical">
          <Form.Item name="purchaseOrderId" label="采购订单" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={purchaseOrders
                .filter((po: any) => ['已到货', '已入库'].includes(po.status))
                .map((po: any) => ({
                  value: po.id,
                  label: `${po.orderCode} - ¥${po.totalAmount || 0}`,
                }))}
            />
          </Form.Item>
          <Form.Item name="invoiceAmount" label="发票金额" rules={[{ required: true }]}>
            <InputNumber min={0} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`付款 - ${selectedRecon?.reconCode || ''}`}
        open={paymentModalOpen}
        onOk={submitPayment}
        onCancel={() => setPaymentModalOpen(false)}
        width={480}
      >
        <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="发票金额">
            ¥{selectedRecon?.invoiceAmount?.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="供应商">
            {selectedRecon?.supplier?.supplierName}
          </Descriptions.Item>
        </Descriptions>
        <Form form={paymentForm} layout="vertical">
          <Form.Item name="amount" label="付款金额" rules={[{ required: true }]}>
            <InputNumber min={0.01} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="付款方式" initialValue="银行转账">
            <Select
              options={['银行转账', '现金', '承兑汇票'].map((s) => ({ value: s, label: s }))}
            />
          </Form.Item>
          <Form.Item name="paymentDate" label="付款日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
