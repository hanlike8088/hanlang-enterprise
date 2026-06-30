import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Space,
  Tag,
  message,
  Descriptions,
  Card,
  Table as AntTable,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { crmApi } from '../../services/crm';
import { plmApi } from '../../services/plm';;

interface Product {
  id: string;
  productCode: string;
  productName: string;
  category?: string;
}

interface Customer {
  id: string;
  customerName: string;
  customerCode: string;
}

interface QuoteItem {
  id?: string;
  materialCode: string;
  materialName: string;
  specification?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

interface Quote {
  id: string;
  quoteCode: string;
  productId: string;
  customerId?: string;
  customerName?: string;
  customer?: { id: string; customerName: string };
  materialCost: number;
  laborCost: number;
  manufacturingFee: number;
  referencePrice: number;
  profitRate: number;
  finalPrice: number;
  status: string;
  notes?: string;
  validUntil?: string;
  items: QuoteItem[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  submitted: 'blue',
  confirmed: 'green',
  rejected: 'red',
  expired: 'orange',
};

export default function 报价管理Page() {
  const [quotes, set报价管理] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const [products, set产品管理] = useState<Product[]>([]);
  const [customers, set客户管理] = useState<Customer[]>([]);
  const [bomItems, setBomItems] = useState<QuoteItem[]>([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetch报价管理 = async () => {
    setLoading(true);
    try {
      set报价管理(await crmApi.getQuotes(keyword || undefined, statusFilter));
    } catch {
      message.error('加载报价列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBasics = async () => {
    try {
      const [prods, custs] = await Promise.all([plmApi.getProducts(), crmApi.getCustomers()]);
      set产品管理(prods);
      set客户管理(custs);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetch报价管理();
    fetchBasics();
  }, []);

  const handleCreate = () => {
    setEditingQuote(null);
    setBomItems([]);
    form.resetFields();
    form.setFieldsValue({ status: 'draft', profitRate: 15, laborCost: 0, manufacturingFee: 0 });
    setModalVisible(true);
  };

  const handleEdit = async (quote: Quote) => {
    setEditingQuote(quote);
    setBomItems(quote.items.map((i) => ({ ...i })));
    form.setFieldsValue({
      productId: quote.productId,
      customerId: quote.customerId,
      customerName: quote.customerName,
      laborCost: quote.laborCost,
      manufacturingFee: quote.manufacturingFee,
      profitRate: quote.profitRate,
      status: quote.status,
      notes: quote.notes,
    });
    setModalVisible(true);
  };

  const handleViewDetail = async (quote: Quote) => {
    try {
      const detail = await crmApi.getQuote(quote.id);
      setSelectedQuote(detail);
      setDetailVisible(true);
    } catch {
      message.error('加载报价详情失败');
    }
  };

  const handleSelectProduct = async (productId: string) => {
    if (!productId) {
      setBomItems([]);
      return;
    }
    try {
      const bom = await crmApi.getProductBom(productId);
      setBomItems(
        bom.items.map((item: any, idx: number) => ({
          materialCode: item.materialCode,
          materialName: item.materialName,
          specification: item.specification,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * item.quantity,
          sortOrder: idx,
        })),
      );
    } catch {
      message.error('加载BOM失败');
    }
  };

  const handleItemPriceChange = (index: number, unitPrice: number) => {
    const updated = [...bomItems];
    updated[index].unitPrice = unitPrice;
    updated[index].totalPrice = unitPrice * updated[index].quantity;
    setBomItems(updated);
  };

  const calcTotals = () => {
    const materialCost = bomItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const labor = form.getFieldValue('laborCost') || 0;
    const manufacturing = form.getFieldValue('manufacturingFee') || 0;
    const referencePrice = materialCost + labor + manufacturing;
    const profitRate = form.getFieldValue('profitRate') || 15;
    const finalPrice = referencePrice * (1 + profitRate / 100);
    return { materialCost, referencePrice, finalPrice };
  };

  const totals = calcTotals();

  const handleSave = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);
      const values = form.getFieldsValue();
      // Validate that we have items
      if (bomItems.length === 0) {
        message.error('请先选择产品加载清单');
        setSubmitting(false);
        return;
      }
      // Validate all items have prices
      for (const item of bomItems) {
        if (item.unitPrice <= 0) {
          message.error('请输入所有物料的单价');
          setSubmitting(false);
          return;
        }
      }
      const payload = {
        ...values,
        items: bomItems.map((i) => ({
          materialCode: i.materialCode,
          materialName: i.materialName,
          specification: i.specification,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      if (editingQuote) {
        await crmApi.updateQuote(editingQuote.id, payload);
        message.success('报价已更新');
      } else {
        await crmApi.createQuote(payload);
        message.success('报价已创建');
      }
      setModalVisible(false);
      fetch报价管理();
    } catch (err: any) {
      if (err?.message && typeof err.message === 'string') message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await crmApi.deleteQuote(id);
      message.success('报价已删除');
      fetch报价管理();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '报价单号', dataIndex: 'quoteCode', key: 'quoteCode', width: 140 },
    {
      title: '客户',
      key: 'customer',
      width: 160,
      render: (_: any, r: Quote) => r.customer?.customerName || r.customerName || '-',
    },
    {
      title: '物料成本',
      dataIndex: 'materialCost',
      key: 'materialCost',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '人工',
      dataIndex: 'laborCost',
      key: 'laborCost',
      width: 80,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '制造费',
      dataIndex: 'manufacturingFee',
      key: 'manufacturingFee',
      width: 80,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '参考价',
      dataIndex: 'referencePrice',
      key: 'referencePrice',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '利润率',
      dataIndex: 'profitRate',
      key: 'profitRate',
      width: 80,
      render: (v: number) => `${v}%`,
    },
    {
      title: '最终报价',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      width: 110,
      render: (v: number, r: Quote) => (
        <strong style={{ color: '#1890ff' }}>¥{v.toFixed(2)}</strong>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: any, r: Quote) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此报价？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const bomColumns = [
    { title: '#', key: 'idx', width: 40, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '物料编码', dataIndex: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName' },
    { title: '规格', dataIndex: 'specification', width: 100, render: (v: string) => v || '-' },
    { title: '单位', dataIndex: 'unit', width: 50 },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 100,
      render: (_: any, __: any, idx: number) => (
        <InputNumber
          size="small"
          min={0}
          step={0.01}
          style={{ width: 80 }}
          value={bomItems[idx]?.unitPrice || 0}
          onChange={(v) => handleItemPriceChange(idx, v || 0)}
          prefix="¥"
        />
      ),
    },
    {
      title: '小计',
      dataIndex: 'totalPrice',
      width: 100,
      render: (v: number) => <strong>¥{v.toFixed(2)}</strong>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索报价单号/客户"
          allowClear
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => fetch报价管理()}
        />
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 120 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setTimeout(fetch报价管理, 0);
          }}
          options={[
            { label: '草稿', value: 'draft' },
            { label: '已提交', value: 'submitted' },
            { label: '已确认', value: 'confirmed' },
            { label: '已驳回', value: 'rejected' },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建报价
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={quotes}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 20 }}
        bordered
        size="small"
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingQuote ? '编辑报价' : '新建报价'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={900}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="选择产品"
                rules={[{ required: true, message: '请选择产品' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择产品"
                  onChange={handleSelectProduct}
                  options={products.map((p) => ({
                    label: `${p.productCode} ${p.productName}`,
                    value: p.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="profitRate" label="利润率(%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态">
                <Select
                  options={[
                    { label: '草稿', value: 'draft' },
                    { label: '已提交', value: 'submitted' },
                    { label: '已确认', value: 'confirmed' },
                    { label: '已驳回', value: 'rejected' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customerId" label="现有客户">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择客户"
                  options={customers.map((c) => ({
                    label: `${c.customerName} (${c.customerCode})`,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customerName" label="新客户名称">
                <Input placeholder="未注册客户可直接填写名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="notes" label="备注">
                <Input placeholder="报价备注" />
              </Form.Item>
            </Col>
          </Row>

          <Card title="物料清单" size="small" style={{ marginTop: 8 }}>
            <AntTable
              rowKey="sortOrder"
              dataSource={bomItems}
              columns={bomColumns}
              pagination={false}
              bordered
              size="small"
            />
            <Row gutter={16} style={{ marginTop: 12 }} justify="end">
              <Col>
                <Space direction="vertical" size={4}>
                  <Statistic
                    title="物料成本"
                    value={totals.materialCost}
                    precision={2}
                    prefix="¥"
                  />
                  <Form.Item name="laborCost" label="人工费" style={{ marginBottom: 0 }}>
                    <InputNumber min={0} step={1} prefix="¥" style={{ width: 140 }} />
                  </Form.Item>
                  <Form.Item name="manufacturingFee" label="制造费" style={{ marginBottom: 0 }}>
                    <InputNumber min={0} step={1} prefix="¥" style={{ width: 140 }} />
                  </Form.Item>
                  <Statistic
                    title="参考价格"
                    value={totals.referencePrice}
                    precision={2}
                    prefix="¥"
                  />
                  <Statistic
                    title="最终报价"
                    value={totals.finalPrice}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={selectedQuote ? `报价详情 - ${selectedQuote.quoteCode}` : ''}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={800}
        footer={null}
      >
        {selectedQuote && (
          <div>
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="报价单号">{selectedQuote.quoteCode}</Descriptions.Item>
              <Descriptions.Item label="客户">
                {selectedQuote.customer?.customerName || selectedQuote.customerName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLORS[selectedQuote.status]}>{selectedQuote.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="物料成本">
                ¥{selectedQuote.materialCost?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="人工费">
                ¥{selectedQuote.laborCost?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="制造费">
                ¥{selectedQuote.manufacturingFee?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="参考价格">
                ¥{selectedQuote.referencePrice?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="利润率">{selectedQuote.profitRate}%</Descriptions.Item>
              <Descriptions.Item label="最终报价">
                <strong style={{ color: '#1890ff', fontSize: 16 }}>
                  ¥{selectedQuote.finalPrice?.toFixed(2)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={3}>
                {new Date(selectedQuote.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {selectedQuote.notes && (
                <Descriptions.Item label="备注" span={3}>
                  {selectedQuote.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
            <Card title="物料清单" size="small" style={{ marginTop: 16 }}>
              <AntTable
                rowKey="sortOrder"
                dataSource={selectedQuote.items}
                columns={[
                  {
                    title: '#',
                    key: 'idx',
                    width: 40,
                    render: (_: any, __: any, idx: number) => idx + 1,
                  },
                  { title: '物料编码', dataIndex: 'materialCode', width: 120 },
                  { title: '物料名称', dataIndex: 'materialName' },
                  {
                    title: '规格',
                    dataIndex: 'specification',
                    width: 80,
                    render: (v: string) => v || '-',
                  },
                  { title: '数量', dataIndex: 'quantity', width: 60 },
                  {
                    title: '单价',
                    dataIndex: 'unitPrice',
                    width: 80,
                    render: (v: number) => `¥${v.toFixed(2)}`,
                  },
                  {
                    title: '小计',
                    dataIndex: 'totalPrice',
                    width: 90,
                    render: (v: number) => <strong>¥{v.toFixed(2)}</strong>,
                  },
                ]}
                pagination={false}
                bordered
                size="small"
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
