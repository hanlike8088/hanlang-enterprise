﻿﻿﻿﻿import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Tag, message, Descriptions, Row, Col, Card, Badge, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, RetweetOutlined } from '@ant-design/icons';
import { crmApi, plmApi } from '../../services/api';
import dayjs from 'dayjs';

interface OrderItem {
  id?: string; materialCode: string; materialName: string;
  specification?: string; unit: string; quantity: number;
  unitPrice: number; totalPrice: number; sortOrder: number;
}

interface Order {
  id: string; orderCode: string; quoteId?: string;
  productId: string; productName: string;
  customerId?: string; customerName?: string;
  customer?: { id: string; customerName: string };
  totalAmount: number; currency: string; quantity: number;
  deliveryDate?: string; status: string; notes?: string;
  items: OrderItem[]; createdAt: string;
}

interface Quote {
  id: string; quoteCode: string; customerName?: string;
  productId: string; finalPrice: number;
}

interface Customer {
  id: string; customerName: string;
}

interface Product {
  id: string; productCode: string; productName: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_confirm: { label: '待确认', color: 'orange' },
  confirmed: { label: '已确认', color: 'blue' },
  in_production: { label: '生产中', color: 'cyan' },
  shipped: { label: '已发货', color: 'purple' },
  signed: { label: '已签收', color: 'geekblue' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' },
};

const statusOptions = [
  { value: 'pending_confirm', label: '待确认'},
  { value: 'confirmed', label: '已确认'},
  { value: 'in_production', label: '生产中'},
  { value: 'shipped', label: '已发货'},
  { value: 'signed', label: '已签收'},
  { value: 'completed', label: '已完成'},
  { value: 'cancelled', label: '已取消'},
];

export default function 销售订单Page() {
  const [orders, set销售订单] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [quotes, set报价管理] = useState<Quote[]>([]);
  const [customers, set客户管理] = useState<Customer[]>([]);
  const [products, set产品管理] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bomItems, setBomItems] = useState<OrderItem[]>([]);
  const [form] = Form.useForm();
  const [convertForm] = Form.useForm();

  const fetch销售订单 = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getOrders(keyword || undefined, statusFilter);
      set销售订单(data);
    } catch { message.error('加载订单失败'); }
    setLoading(false);
  };

  const fetch客户管理 = async () => {
    try { const data = await crmApi.getCustomers(); set客户管理(data); } catch {}
  };

  const fetch产品管理 = async () => {
    try { const data = await plmApi.getProducts(); set产品管理(data); } catch {}
  };

  const fetch报价管理 = async () => {
    try { const data = await crmApi.getQuotes(undefined, 'draft'); set报价管理(data.filter((q: any) => q.status !== 'voided')); } catch {}
  };

  useEffect(() => { fetch销售订单(); fetch客户管理(); fetch产品管理(); fetch报价管理(); }, []);

  const handleSearch = () => fetch销售订单();

  const handleCreate = () => {
    setEditingOrder(null);
    setSelectedProduct(null);
    setBomItems([]);
    form.resetFields();
    setModalOpen(true);
  };

  const handleConvert = () => {
    convertForm.resetFields();
    setConvertModalOpen(true);
  };

  const handleProductChange = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    form.setFieldsValue({ productName: product?.productName || '' });
    if (productId) {
      try {
        const bom = await crmApi.getProductBom(productId);
        const items = bom.items.map((item: any) => ({
          materialCode: item.materialCode,
          materialName: item.materialName,
          specification: item.specification || undefined,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * item.quantity,
          sortOrder: item.sortOrder,
        }));
        setBomItems(items);
      } catch { setBomItems([]); }
    } else {
      setBomItems([]);
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const items = bomItems.map(it => ({
      materialCode: it.materialCode,
      materialName: it.materialName,
      specification: it.specification,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));

    if (editingOrder) {
      await crmApi.updateOrder(editingOrder.id, { ...values, items, deliveryDate: values.deliveryDate?.toISOString() });
      message.success('订单已更新');
    } else {
      await crmApi.createOrder({ ...values, items, deliveryDate: values.deliveryDate?.toISOString() });
      message.success('订单已创建');
    }
    setModalOpen(false);
    fetch销售订单();
  };

  const handleDelete = async (id: string) => {
    await crmApi.deleteOrder(id);
    message.success('订单已删除');
    fetch销售订单();
  };

  const handleView = async (order: Order) => {
    try {
      const data = await crmApi.getOrder(order.id);
      setDetailOrder(data);
      setDetailOpen(true);
    } catch { message.error('加载订单详情失败'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await crmApi.updateOrder(id, { status });
    message.success('状态已更新');
    fetch销售订单();
  };

  const handleConvertSubmit = async () => {
    const values = await convertForm.validateFields();
    await crmApi.convertQuoteToOrder({ ...values, deliveryDate: values.deliveryDate?.toISOString() });
    message.success('报价单已转为订单');
    setConvertModalOpen(false);
    fetch销售订单();
    fetch报价管理();
  };

  const columns = [
    { title: '订单编号', dataIndex: 'orderCode', width: 160 },
    {
      title: '客户', width: 140,
      render: (_: any, r: Order) => r.customer?.customerName || r.customerName || '-',
    },
    { title: '产品', dataIndex: 'productName', width: 160 },
    {
      title: '金额', width: 120, align: 'right' as const,
      render: (_: any, r: Order) => `¥${r.totalAmount.toLocaleString()}`,
    },
    {
      title: '交期', width: 110,
      render: (_: any, r: Order) => {
        if (!r.deliveryDate) return '-';
        const d = dayjs(r.deliveryDate);
        const daysLeft = d.diff(dayjs(), 'day');
        return <span style={{ color: daysLeft <= 3 && r.status !== 'completed' ? 'red' : undefined }}>{d.format('MM-DD')} {daysLeft >= 0 ? `(${daysLeft}d)` : `({Math.abs(daysLeft)}d)`}</span>;
      },
    },
    {
      title: '交货日期', width: 100,
      render: (_: any, r: Order) => {
        const s = STATUS_MAP[r.status] || { label: r.status, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '操作', width: 280, fixed: 'right' as const,
      render: (_: any, r: Order) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>详情</Button>
          <Select
            size="small"
            value={r.status}
            style={{ width: 90 }}
            onChange={(val) => handleStatusChange(r.id, val)}
            options={statusOptions}
          />
          <Popconfirm title="确定删除此订单？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Input.Search
            placeholder="搜索订单单客户/产品"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 280 }}
            allowClear
          />
        </Col>
        <Col>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={v => { setStatusFilter(v); }}
            options={statusOptions}
          />
        </Col>
        <Col flex="auto" />
        <Col>
          <Space>
            <Button icon={<RetweetOutlined />} onClick={handleConvert}>报价单转订单</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建订单</Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 20 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingOrder ? '编辑订单' : '新建订单'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={800}
        okText="保存"
      >
        <Form form={form} layout="vertical" initialValues={editingOrder ? {
          productId: editingOrder.productId,
          productName: editingOrder.productName,
          customerId: editingOrder.customerId,
          customerName: editingOrder.customerName,
          quantity: editingOrder.quantity,
          deliveryDate: editingOrder.deliveryDate ? dayjs(editingOrder.deliveryDate) : undefined,
          notes: editingOrder.notes,
        } : {}}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="productId" label="产品" rules={[{ required: true, message: '请选择产品' }]}>
                <Select
                  showSearch
                  placeholder="选择产品"
                  filterOption={(input, option) => (option?.children as unknown as string || '').toLowerCase().includes(input.toLowerCase())}
                  onChange={handleProductChange}
                  disabled={!!editingOrder}
                >
                  {products.map(p => <Select.Option key={p.id} value={p.id}>{p.productCode} {p.productName}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerId" label="客户">
                <Select allowClear showSearch placeholder="选择客户" filterOption={(input, option) => (option?.children as unknown as string || '').toLowerCase().includes(input.toLowerCase())}>
                  {customers.map(c => <Select.Option key={c.id} value={c.id}>{c.customerName}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerName" label="客户名称（手动输入）">
                <Input placeholder="如未选择客户可手动输入" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="quantity" label="数量" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="deliveryDate" label="交期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="productName" label="产品名称" hidden>
            <Input />
          </Form.Item>

          {/* BOM Items Table */}
          {bomItems.length > 0 && (
            <Card title="订单明细 (BOM)" size="small" style={{ marginTop: 8 }}>
              <Table
                rowKey={(r) => r.materialCode + r.sortOrder}
                dataSource={bomItems}
                pagination={false}
                size="small"
                columns={[
                  { title: '物料编码', dataIndex: 'materialCode', width: 120 },
                  { title: '物料名称', dataIndex: 'materialName', width: 140 },
                  { title: '规格', dataIndex: 'specification', width: 100 },
                  { title: '单位', dataIndex: 'unit', width: 60 },
                  {
                    title: '数量', dataIndex: 'quantity', width: 80,
                    render: (_: any, r: OrderItem, idx: number) => (
                      <InputNumber size="small" min={0} value={r.quantity} style={{ width: 70 }}
                        onChange={v => {
                          const next = [...bomItems];
                          next[idx] = { ...next[idx], quantity: v || 0, totalPrice: (v || 0) * next[idx].unitPrice };
                          setBomItems(next);
                        }} />
                    ),
                  },
                  {
                    title: '单价', dataIndex: 'unitPrice', width: 90,
                    render: (_: any, r: OrderItem, idx: number) => (
                      <InputNumber size="small" min={0} precision={2} value={r.unitPrice} style={{ width: 80 }}
                        onChange={v => {
                          const next = [...bomItems];
                          next[idx] = { ...next[idx], unitPrice: v || 0, totalPrice: (v || 0) * next[idx].quantity };
                          setBomItems(next);
                        }} />
                    ),
                  },
                  {
                    title: '小计', width: 100, align: 'right' as const,
                    render: (_: any, r: OrderItem) => `¥${r.totalPrice.toLocaleString()}`,
                  },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={7} align="right">
                      <strong>总计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <strong>¥{bomItems.reduce((s, i) => s + i.totalPrice, 0).toLocaleString()}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          )}

          <Form.Item name="notes" label="备注" style={{ marginTop: 12 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Convert Modal */}
      <Modal
        title="报价单转销售订单" open={convertModalOpen}
        onCancel={() => setConvertModalOpen(false)}
        onOk={handleConvertSubmit}
        okText="转为订单"
      >
        <Form form={convertForm} layout="vertical">
          <Form.Item name="quoteId" label="选择报价单" rules={[{ required: true, message: ''}]}>
            <Select showSearch placeholder="选择报价单" filterOption={(input, option) => (option?.children as unknown as string || '').toLowerCase().includes(input.toLowerCase())}>
              {quotes.map(q => <Select.Option key={q.id} value={q.id}>{q.quoteCode} - {q.customerName || ''} ¥{q.finalPrice?.toLocaleString()}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="customerId" label="客户">
            <Select allowClear showSearch placeholder="选择客户" filterOption={(input, option) => (option?.children as unknown as string || '').toLowerCase().includes(input.toLowerCase())}>
              {customers.map(c => <Select.Option key={c.id} value={c.id}>{c.customerName}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="数量" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deliveryDate" label="交期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`订单详情 - ${detailOrder?.orderCode || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detailOrder && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="订单编号">{detailOrder.orderCode}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_MAP[detailOrder.status]?.color}>{STATUS_MAP[detailOrder.status]?.label || detailOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{detailOrder.customer?.customerName || detailOrder.customerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="产品">{detailOrder.productName}</Descriptions.Item>
              <Descriptions.Item label="数量">{detailOrder.quantity}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{detailOrder.totalAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="交期">{detailOrder.deliveryDate ? dayjs(detailOrder.deliveryDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="备注">{detailOrder.notes || '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="订单明细" size="small" style={{ marginTop: 12 }}>
              <Table
                rowKey={(r) => r.materialCode + r.sortOrder}
                dataSource={detailOrder.items}
                pagination={false}
                size="small"
                columns={[
                  { title: '物料编码', dataIndex: 'materialCode', width: 120 },
                  { title: '物料名称', dataIndex: 'materialName', width: 140 },
                  { title: '规格', dataIndex: 'specification', width: 100 },
                  { title: '单位', dataIndex: 'unit', width: 60 },
                  { title: '数量', dataIndex: 'quantity', width: 70 },
                  { title: '单价', dataIndex: 'unitPrice', width: 90, render: (v: number) => `¥${v.toFixed(2)}` },
                  { title: '小计', width: 100, render: (_: any, r: OrderItem) => `¥${r.totalPrice.toLocaleString()}` },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={7} align="right"><strong>总计</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right"><strong>¥{detailOrder.totalAmount.toLocaleString()}</strong></Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
