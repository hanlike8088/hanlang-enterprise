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
  DatePicker,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  SendOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  InboxOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { CloudSyncOutlined } from '@ant-design/icons';
import { purchaseApi, supplierApi, crmApi, warehouseApi } from '../services/api';
import { erpApi } from '../services/api';
import dayjs from 'dayjs';

const STATUS_ORDER = [
  '草稿',
  '已确认',
  '供应商确认',
  '已发货',
  '已到货',
  '检验中',
  '已入库',
  '已关闭',
];
const statusColors: Record<string, string> = {
  草稿: 'default',
  已确认: 'blue',
  供应商确认: 'cyan',
  已发货: 'gold',
  已到货: 'orange',
  检验中: 'processing',
  已入库: 'green',
  已关闭: 'default',
};
const NEXT_STATUS_MAP: Record<string, string> = {
  草稿: '已确认',
  已确认: '供应商确认',
  供应商确认: '已发货',
  已发货: '已到货',
  已到货: '检验中',
  检验中: '已入库',
  已入库: '已关闭',
};

export default function PurchasePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [receipts, setReceipts] = useState<any[]>([]);
  const [linkedOrders, setLinkedOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [receiptForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('orders');

  const handleSyncMaterials = async () => {
    try {
      const result = await erpApi.syncMaterialsFromK3();
      message.success('已同步 ' + result.synced + ' 个物料，跳过 ' + result.skipped + ' 个');
    } catch (e: any) {
      message.error('同步物料失败: ' + (e?.response?.data?.message || e.message));
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      setData(await purchaseApi.getAll());
      setSuppliers(await supplierApi.getAll());
      setWarnings(await purchaseApi.getWarnings());
      setStats(await purchaseApi.getStats());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      expectedDate: r.expectedDate ? dayjs(r.expectedDate) : undefined,
      orderDate: r.orderDate ? dayjs(r.orderDate) : undefined,
    });
    setModalOpen(true);
  };
  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      ...v,
      expectedDate: v.expectedDate?.toISOString(),
      orderDate: v.orderDate?.toISOString(),
      items: v.items || [
        {
          materialName: v.materialName,
          quantity: v.quantity,
          unit: v.unit,
          unitPrice: v.unitPrice,
        },
      ],
    };
    editing ? await purchaseApi.update(editing.id, payload) : await purchaseApi.create(payload);
    message.success(editing ? '已更新' : '已创建');
    setModalOpen(false);
    fetch();
  };
  const remove = async (id: string) => {
    await purchaseApi.delete(id);
    message.success('已删除');
    fetch();
  };

  const advanceStatus = async (id: string) => {
    const order = data.find((d) => d.id === id);
    const nextStatus = NEXT_STATUS_MAP[order?.status || ''];
    if (!nextStatus) {
      message.warning('当前状态无法继续流转');
      return;
    }
    await purchaseApi.advanceStatus(id, nextStatus);
    message.success(`状态已更新为: ${nextStatus}`);
    fetch();
  };

  const openReceipt = async (order: any) => {
    setSelected(order);
    receiptForm.resetFields();
    setReceipts(await purchaseApi.getReceipts(order.id));
    setReceiptOpen(true);
  };
  const submitReceipt = async () => {
    const v = await receiptForm.validateFields();
    await purchaseApi.createReceipt(selected.id, v);
    message.success('到货记录已添加');
    setReceipts(await purchaseApi.getReceipts(selected.id));
    receiptForm.resetFields();
  };

  const openLink = async (order: any) => {
    setSelected(order);
    linkForm.resetFields();
    const [links, orders] = await Promise.all([
      purchaseApi.getLinkedSaleOrders(order.id),
      crmApi.get('crm/orders').then((r: any) => r.data),
    ]);
    setLinkedOrders(links);
    setSalesOrders(orders);
    setLinkOpen(true);
  };
  const submitLink = async () => {
    const v = await linkForm.validateFields();
    await purchaseApi.linkSaleOrder(selected.id, v.saleOrderId);
    message.success('已关联销售订单');
    const links = await purchaseApi.getLinkedSaleOrders(selected.id);
    setLinkedOrders(links);
    linkForm.resetFields();
  };

  const columns = [
    { title: '订单编号', dataIndex: 'orderCode', key: 'code', width: 130 },
    {
      title: '供应商',
      key: 'supplier',
      width: 130,
      render: (_: any, r: any) => r.supplier?.supplierName || '-',
    },
    {
      title: '物料',
      key: 'materials',
      ellipsis: true,
      render: (_: any, r: any) => r.items?.map((i: any) => i.materialName).join(', ') || '-',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'amount',
      width: 100,
      render: (v: number) => (v ? `¥${v.toFixed(2)}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
    {
      title: '交期',
      dataIndex: 'expectedDate',
      key: 'deadline',
      width: 110,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '预警',
      key: 'warning',
      width: 70,
      render: (_: any, r: any) => {
        const w = warnings.find((x) => x.id === r.id);
        if (!w) return null;
        if (w.warning === 'red') return <Badge status="error" text="超期" />;
        if (w.warning === 'yellow') return <Badge status="warning" text="临近" />;
        return null;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          {NEXT_STATUS_MAP[r.status] && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => advanceStatus(r.id)}
            >
              {NEXT_STATUS_MAP[r.status]}
            </Button>
          )}
          <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => openReceipt(r)}>
            到货
          </Button>
          <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => openLink(r)}>
            关联
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => remove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const warningColumns = [
    { title: '订单编号', dataIndex: 'orderCode', key: 'code', width: 130 },
    {
      title: '供应商',
      key: 'supplier',
      width: 130,
      render: (_: any, r: any) => r.supplier?.supplierName || '-',
    },
    {
      title: '交期',
      dataIndex: 'expectedDate',
      key: 'deadline',
      width: 110,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '预警',
      dataIndex: 'warning',
      key: 'warning',
      width: 80,
      render: (v: string) =>
        v === 'red' ? (
          <Badge status="error" text="已超期" />
        ) : v === 'yellow' ? (
          <Badge status="warning" text="即将到期" />
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
  ];

  const receiptColumns = [
    { title: '到货编号', dataIndex: 'receiptCode', key: 'code', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'qty', width: 80 },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 80,
      render: (v: string) => (
        <Tag color={v === '合格' ? 'green' : v === '不合格' ? 'red' : 'orange'}>{v}</Tag>
      ),
    },
    { title: '检验员', dataIndex: 'inspector', key: 'inspector', width: 100 },
    {
      title: '到货时间',
      dataIndex: 'acceptedAt',
      key: 'time',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const linkColumns = [
    { title: '销售订单ID', dataIndex: 'saleOrderId', key: 'soid', width: 200 },
    {
      title: '关联时间',
      dataIndex: 'createdAt',
      key: 'time',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, r: any) => (
        <Popconfirm
          title="取消关联？"
          onConfirm={async () => {
            await purchaseApi.unlinkSaleOrder(r.id);
            setLinkedOrders(await purchaseApi.getLinkedSaleOrders(selected.id));
          }}
        >
          <Button type="link" danger size="small">
            取消
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="采购订单总数" value={stats.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="预警订单"
              value={stats.warningCount || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待入库"
              value={stats.byStatus?.find((s: any) => s.status === '已到货')?._count || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="检验中"
              value={stats.byStatus?.find((s: any) => s.status === '检验中')?._count || 0}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'orders',
            label: '采购订单',
            children: (
              <Card
                extra={
                  <Space>
                    <Button icon={<CloudSyncOutlined />} onClick={handleSyncMaterials}>
                      同步金蝶物料
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                      新建采购订单
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={data}
                  columns={columns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                  scroll={{ x: 1100 }}
                />
              </Card>
            ),
          },
          {
            key: 'warnings',
            label: (
              <span>
                <WarningOutlined /> 交期预警
              </span>
            ),
            children: (
              <Card>
                <Table
                  dataSource={warnings.filter((w) => w.warning !== 'none')}
                  columns={warningColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑采购订单' : '新建采购订单'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={suppliers.map((s: any) => ({
                value: s.id,
                label: `${s.supplierCode} ${s.supplierName}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              name="quantity"
              label="数量"
              rules={[{ required: true }]}
              style={{ width: 150 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="unit" label="单位" initialValue="个" style={{ width: 120 }}>
              <Input />
            </Form.Item>
            <Form.Item name="unitPrice" label="单价" style={{ width: 150 }}>
              <InputNumber min={0} prefix="¥" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="expectedDate" label="期望交期" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="orderDate" label="下单日期" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分批到货 - ${selected?.orderCode || ''}`}
        open={receiptOpen}
        onCancel={() => setReceiptOpen(false)}
        width={680}
        footer={null}
      >
        <Table
          dataSource={receipts}
          columns={receiptColumns}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
        <Card title="新增到货" size="small">
          <Form form={receiptForm} layout="inline" onFinish={submitReceipt}>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="inspector" label="检验员">
              <Input style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="result" label="结果" initialValue="合格">
              <Select
                style={{ width: 100 }}
                options={['合格', '不合格', '待检'].map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
            <Form.Item name="notes" label="备注">
              <Input style={{ width: 150 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<InboxOutlined />}>
                确认到货
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Modal>

      <Modal
        title={`关联销售订单 - ${selected?.orderCode || ''}`}
        open={linkOpen}
        onCancel={() => setLinkOpen(false)}
        width={680}
        footer={null}
      >
        <Table
          dataSource={linkedOrders}
          columns={linkColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: '暂未关联销售订单' }}
          style={{ marginBottom: 16 }}
        />
        <Card title="新增关联" size="small">
          <Form form={linkForm} layout="inline" onFinish={submitLink}>
            <Form.Item name="saleOrderId" label="销售订单" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: 300 }}
                options={salesOrders.map((so: any) => ({
                  value: so.id,
                  label: `${so.orderCode} - ${so.customerName || '-'} ¥${so.totalAmount || 0}`,
                }))}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<LinkOutlined />}>
                关联
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </div>
  );
}
