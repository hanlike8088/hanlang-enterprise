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

interface 对账管理 {
  id: string;
  reconciliationCode: string;
  customerId: string;
  orderId?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentDueDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  customer?: { id: string; customerName: string };
  order?: { id: string; orderCode: string };
}

const statusOptions = [
  { label: '待收款', value: 'pending' },
  { label: '部分收款', value: 'partial' },
  { label: '已收款', value: 'paid' },
  { label: '逾期', value: 'overdue' },
];

export default function 对账管理Page() {
  const [data, setData] = useState<对账管理[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<对账管理 | null>(null);
  const [customers, set客户管理] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (filterStatus) params.set('status', filterStatus);
      const res = await crmApi.get(`/crm/reconciliations?${params}`);
      setData(res.data);
    } catch {
      message.error('加载对账单失败');
    }
    setLoading(false);
  };

  const fetch客户管理 = async () => {
    try {
      const res = await crmApi.get('/crm/customers');
      set客户管理(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetch客户管理();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ paidAmount: 0 });
    setModalOpen(true);
  };

  const handleEdit = (record: 对账管理) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      paymentDueDate: record.paymentDueDate ? dayjs(record.paymentDueDate) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      paymentDueDate: values.paymentDueDate ? values.paymentDueDate.toISOString() : undefined,
    };
    try {
      if (editing) {
        await crmApi.patch(`/crm/reconciliations/${editing.id}`, payload);
        message.success('对账单已更新');
      } else {
        await crmApi.post('/crm/reconciliations', payload);
        message.success('对账单已创建');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await crmApi.delete(`/crm/reconciliations/${id}`);
      message.success('已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<对账管理> = [
    { title: '对账编号', dataIndex: 'reconciliationCode', width: 140 },
    { title: '客户', render: (_, r) => r.customer?.customerName || '-', width: 150 },
    {
      title: '应收金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v) => `¥${v?.toLocaleString()}`,
    },
    {
      title: '已收金额',
      dataIndex: 'paidAmount',
      width: 120,
      render: (v) => `¥${v?.toLocaleString()}`,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 120,
      render: (v, r) => (
        <span style={{ color: v > 0 ? 'red' : 'green' }}>¥{v?.toLocaleString()}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const colors: Record<string, string> = {
          pending: 'default',
          partial: 'processing',
          paid: 'success',
          overdue: 'error',
        };
        return <Tag color={colors[v]}>{statusOptions.find((s) => s.value === v)?.label || v}</Tag>;
      },
    },
    {
      title: '付款期限',
      render: (_, r) => (r.paymentDueDate ? new Date(r.paymentDueDate).toLocaleDateString() : '-'),
      width: 110,
    },
    { title: '创建时间', render: (_, r) => new Date(r.createdAt).toLocaleDateString(), width: 110 },
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
      title="客户对账"
      extra={
        <Space>
          <Input.Search
            placeholder="搜索对账单"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={fetchData}
            style={{ width: 200 }}
          />
          <Select
            allowClear
            placeholder="状态"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 120 }}
            options={statusOptions}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建对账
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
        title={editing ? '编辑对账' : '新建对账'}
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
          <Form.Item name="totalAmount" label="应收金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="paidAmount" label="已收金额">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="paymentDueDate" label="付款期限">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="状态">
              <Select options={statusOptions} />
            </Form.Item>
          )}
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
