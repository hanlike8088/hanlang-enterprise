import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Card,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { erpApi, plmApi } from '../../services/api';

const statusColors: Record<string, string> = {
  待生产: 'blue',
  生产中: 'orange',
  已完成: 'green',
  已取消: 'red',
};
const priorityColors: Record<string, string> = { 高: 'red', 中: 'orange', 低: 'green' };

export default function WorkOrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [orders, prods] = await Promise.all([erpApi.getWorkOrders(), plmApi.getProducts()]);
      setData(orders);
      setProducts(prods);
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
      startDate: dayjs(r.startDate),
      endDate: r.endDate ? dayjs(r.endDate) : undefined,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await erpApi.updateWorkOrder(editing.id, values);
      message.success('工单已更新');
    } else {
      await erpApi.createWorkOrder(values);
      message.success('工单已创建');
    }
    setModalOpen(false);
    fetch();
  };

  const remove = async (id: string) => {
    await erpApi.deleteWorkOrder(id);
    message.success('工单已删除');
    fetch();
  };

  const columns = [
    { title: '工单编号', dataIndex: 'orderCode', key: 'orderCode', width: 150 },
    {
      title: '产品',
      key: 'product',
      width: 180,
      render: (_: any, r: any) =>
        products.find((p) => p.id === r.productId)?.productName || r.productId,
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => <Tag color={priorityColors[p]}>{p}</Tag>,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 110,
      render: (d: string | null) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该工单？" onConfirm={() => remove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="ERP 生产工单"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建工单
        </Button>
      }
    >
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑工单' : '新建工单'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
            <Select
              options={products.map((p) => ({
                value: p.id,
                label: `${p.productCode} - ${p.productName}`,
              }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              name="quantity"
              label="生产数量"
              rules={[{ required: true }]}
              style={{ width: 200 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="priority" label="优先级" initialValue="中" style={{ width: 150 }}>
              <Select options={['高', '中', '低'].map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true }]}
              style={{ width: 240 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期" style={{ width: 240 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="status" label="状态" initialValue="待生产">
            <Select
              options={['待生产', '生产中', '已完成', '已取消'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
