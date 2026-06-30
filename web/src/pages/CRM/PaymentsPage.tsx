import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  DatePicker,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { crmApi } from '../../services/crm';;

interface Payment {
  id: string;
  paymentCode: string;
  customerId: string;
  orderId?: string;
  reconciliationId?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNo?: string;
  notes?: string;
  customer?: { id: string; customerName: string };
  reconciliation?: { id: string; reconciliationCode: string };
}

const methodOptions = [
  { label: '银行转账', value: 'bank_transfer' },
  { label: '现金', value: 'cash' },
  { label: '支票', value: 'check' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信', value: 'wechat' },
  { label: '其他', value: 'other' },
];

export default function 回款管理Page() {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [customers, set客户管理] = useState<any[]>([]);
  const [reconciliations, set对账管理s] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      const res = await crmApi.get(`/crm/payments?${params}`);
      setData(res.data);
    } catch {
      message.error('加载回款记录失败');
    }
    setLoading(false);
  };

  const fetchRefs = async () => {
    try {
      const [custRes, recRes] = await Promise.all([
        crmApi.get('/crm/customers'),
        crmApi.get('/crm/reconciliations'),
      ]);
      set客户管理(custRes.data);
      set对账管理s(recRes.data);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchRefs();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ paymentDate: dayjs(), paymentMethod: 'bank_transfer' });
    setModalOpen(true);
  };

  const handleEdit = (record: Payment) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : dayjs(),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = { ...values, paymentDate: values.paymentDate.toISOString() };
    try {
      if (editing) {
        await crmApi.patch(`/crm/payments/${editing.id}`, payload);
        message.success('回款已更新');
      } else {
        await crmApi.post('/crm/payments', payload);
        message.success('回款已记录');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await crmApi.delete(`/crm/payments/${id}`);
      message.success('已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<Payment> = [
    { title: '回款编号', dataIndex: 'paymentCode', width: 140 },
    { title: '客户', render: (_, r) => r.customer?.customerName || '-', width: 150 },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v) => `¥${v?.toLocaleString()}` },
    {
      title: '方式',
      dataIndex: 'paymentMethod',
      width: 90,
      render: (v) => <Tag>{methodOptions.find((m) => m.value === v)?.label || v}</Tag>,
    },
    {
      title: '回款日期',
      render: (_, r) => new Date(r.paymentDate).toLocaleDateString(),
      width: 110,
    },
    { title: '参考号', dataIndex: 'referenceNo', width: 140, render: (v) => v || '-' },
    {
      title: '关联对账',
      render: (_, r) => r.reconciliation?.reconciliationCode || '-',
      width: 140,
    },
    {
      title: '操作',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="客户回款"
      extra={
        <Space>
          <Input.Search
            placeholder="搜索回款"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={fetchData}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            记录回款
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1000 }}
      />
      <Modal
        title={editing ? '编辑回款' : '记录回款'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择客户"
              options={customers.map((c) => ({ label: c.customerName, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="收款方式">
            <Select options={methodOptions} />
          </Form.Item>
          <Form.Item name="paymentDate" label="回款日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reconciliationId" label="关联对账单">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="选择对账单(可选)"
              options={reconciliations.map((r) => ({
                label: `${r.reconciliationCode} - ¥${r.totalAmount}`,
                value: r.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="referenceNo" label="参考号">
            <Input placeholder="银行流水号等" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
