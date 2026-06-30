import { useEffect, useState } from 'react';
import { CloudSyncOutlined } from '@ant-design/icons';
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
  Descriptions,
  message,
  Popconfirm,
  Tabs,
  InputNumber,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supplierApi } from '../services/supplier';;

const catColors: Record<string, string> = {
  原材料: 'blue',
  外协件: 'purple',
  辅料: 'green',
  设备: 'orange',
};
const statusColors: Record<string, string> = {
  潜在: 'default',
  准入中: 'processing',
  合格: 'success',
  观察: 'warning',
  淘汰: 'error',
};
const ratingColors: Record<string, string> = { A: 'green', B: 'blue', C: 'orange', D: 'red' };

export default function SupplierPage() {
  const handleSync = async () => {
    try {
      const result = await supplierApi.syncFromK3();
      message.success('已同步 ' + result.synced + ' 个供应商，跳过 ' + result.skipped + ' 个');
      fetch();
    } catch (e: any) {
      message.error('同步失败: ' + (e?.response?.data?.message || e.message));
    }
  };
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [qcdsOpen, setQcdsOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form] = Form.useForm();
  const [qcdsForm] = Form.useForm();
  const [approvalForm] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      setData(await supplierApi.getAll());
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
    form.setFieldsValue(r);
    setModalOpen(true);
  };
  const submit = async () => {
    const v = await form.validateFields();
    editing ? await supplierApi.update(editing.id, v) : await supplierApi.create(v);
    message.success(editing ? '已更新' : '已创建');
    setModalOpen(false);
    fetch();
  };
  const remove = async (id: string) => {
    await supplierApi.delete(id);
    message.success('已删除');
    fetch();
  };
  const submitQcds = async () => {
    const v = await qcdsForm.validateFields();
    await supplierApi.createQcds(selected.id, v);
    message.success('评分已提交');
    setQcdsOpen(false);
    fetch();
  };
  const submitApproval = async () => {
    const v = await approvalForm.validateFields();
    await supplierApi.createApproval(selected.id, v);
    message.success('审批已提交');
    setApprovalOpen(false);
  };

  const columns = [
    { title: '编码', dataIndex: 'supplierCode', key: 'code', width: 120 },
    { title: '名称', dataIndex: 'supplierName', key: 'name', ellipsis: true },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'cat',
      width: 80,
      render: (v: string) => <Tag color={catColors[v]}>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 60,
      render: (v: string) => <Tag color={ratingColors[v]}>{v}</Tag>,
    },
    { title: '联系人', dataIndex: 'contactPerson', key: 'contact', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelected(r);
              setQcdsOpen(true);
            }}
          >
            评分
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelected(r);
              setApprovalOpen(true);
            }}
          >
            审批
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

  return (
    <div>
      <Card
        title="供应商管理"
        extra={
          <Space>
            <Button icon={<CloudSyncOutlined />} onClick={handleSync}>
              同步金蝶
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建供应商
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
        />
      </Card>

      <Modal
        title={editing ? '编辑供应商' : '新建供应商'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplierName" label="供应商名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="category" label="类别" initialValue="原材料" style={{ width: 200 }}>
              <Select
                options={['原材料', '外协件', '辅料', '设备'].map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="潜在" style={{ width: 180 }}>
              <Select
                options={['潜在', '准入中', '合格', '观察', '淘汰'].map((s) => ({
                  value: s,
                  label: s,
                }))}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="contactPerson" label="联系人" style={{ width: 200 }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="电话" style={{ width: 200 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="bankAccount" label="银行账号">
            <Input />
          </Form.Item>
          <Form.Item name="taxId" label="税号">
            <Input />
          </Form.Item>
          <Form.Item name="paymentTerms" label="账期">
            <Input placeholder="如：30天、60天、90天" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`QCDS评分 - ${selected?.supplierName || ''}`}
        open={qcdsOpen}
        onOk={submitQcds}
        onCancel={() => setQcdsOpen(false)}
        width={480}
      >
        {selected?.qcdsScores?.length > 0 && (
          <Descriptions size="small" column={4} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="质量">
              {selected.qcdsScores[0]?.qualityScore}
            </Descriptions.Item>
            <Descriptions.Item label="成本">{selected.qcdsScores[0]?.costScore}</Descriptions.Item>
            <Descriptions.Item label="交付">
              {selected.qcdsScores[0]?.deliveryScore}
            </Descriptions.Item>
            <Descriptions.Item label="服务">
              {selected.qcdsScores[0]?.serviceScore}
            </Descriptions.Item>
          </Descriptions>
        )}
        <Form form={qcdsForm} layout="vertical">
          <Form.Item
            name="period"
            label="评分期间"
            initialValue={`2026-Q${Math.ceil(new Date().getMonth() / 3)}`}
          >
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="qualityScore" label="质量(30%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="costScore" label="成本(20%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="deliveryScore" label="交付(30%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="serviceScore" label="服务(20%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={`发起审批 - ${selected?.supplierName || ''}`}
        open={approvalOpen}
        onOk={submitApproval}
        onCancel={() => setApprovalOpen(false)}
        width={480}
      >
        <Form form={approvalForm} layout="vertical">
          <Form.Item name="approvalType" label="审批类型" rules={[{ required: true }]}>
            <Select
              options={['准入', '升级', '降级', '淘汰'].map((s) => ({ value: s, label: s }))}
            />
          </Form.Item>
          <Form.Item name="applicant" label="申请人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
