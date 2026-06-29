import { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { crmApi } from '../../services/api';

interface Complaint {
  id: string;
  complaintCode: string;
  customerId: string;
  orderId?: string;
  title: string;
  description?: string;
  complaintType: string;
  severity: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  customer?: { id: string; customerName: string };
  order?: { id: string; orderCode: string };
}

const typeOptions = [
  { label: "质量", value: "quality" },
  { label: "交付", value: "delivery" },
  { label: "服务", value: "service" },
  { label: "其他", value: "other" },
];

const severityOptions = [
  { label: "轻微", value: "minor" },
  { label: "重大", value: "major" },
  { label: "严重", value: "critical" },
];

const statusOptions = [
  { label: "待处理", value: "pending" },
  { label: "调查中", value: "investigating" },
  { label: "已解决", value: "resolved" },
  { label: "已关闭", value: "closed" },
];

export default function 客诉管理Page() {
  const [complaints, set客诉管理] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [customers, set客户管理] = useState<any[]>([]);
  const [orders, set销售订单] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (filterType) params.set("complaintType", filterType);
      if (filterSeverity) params.set("severity", filterSeverity);
      if (filterStatus) params.set("status", filterStatus);
      const res = await crmApi.get(`/crm/complaints?${params}`);
      set客诉管理(res.data);
    } catch { message.error("加载投诉列表失败"); }
    setLoading(false);
  };

  const fetch客户管理 = async () => {
    try {
      const res = await crmApi.get("/crm/customers");
      set客户管理(res.data);
    } catch {}
  };

  const fetch销售订单 = async () => {
    try {
      const res = await crmApi.get("/crm/orders");
      set销售订单(res.data);
    } catch {}
  };

  useEffect(() => { fetchData(); fetch客户管理(); fetch销售订单(); }, []);

  const handleCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Complaint) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await crmApi.patch(`/crm/complaints/${editing.id}`, values);
        message.success("投诉已更新");
      } else {
        await crmApi.post("/crm/complaints", values);
        message.success("投诉已创建");
      }
      setModalOpen(false);
      fetchData();
    } catch { message.error("操作失败"); }
  };

  const handleDelete = async (id: string) => {
    try { await crmApi.delete(`/crm/complaints/${id}`); message.success("已删除"); fetchData(); }
    catch { message.error("删除失败"); }
  };

  const columns: ColumnsType<Complaint> = [
    { title: "投诉编号", dataIndex: "complaintCode", width: 140 },
    { title: "标题", dataIndex: "title", ellipsis: true },
    { title: "客户", render: (_, r) => r.customer?.customerName || "-", width: 150 },
    { title: "关联订单", render: (_, r) => r.order?.orderCode || "-", width: 140 },
    {
      title: "类型", dataIndex: "complaintType", width: 90,
      render: (v) => <Tag>{typeOptions.find(t => t.value === v)?.label || v}</Tag>,
    },
    {
      title: "严重程度", dataIndex: "severity", width: 100,
      render: (v) => <Tag color={v === "critical" ? "red" : v === "major" ? "orange" : "blue"}>{severityOptions.find(s => s.value === v)?.label || v}</Tag>,
    },
    {
      title: "状态", dataIndex: "status", width: 100,
      render: (v) => {
        const colors: Record<string, string> = { pending: "default", investigating: "processing", resolved: "success", closed: "default" };
        return <Tag color={colors[v]}>{statusOptions.find(s => s.value === v)?.label || v}</Tag>;
      },
    },
    { title: "创建时间", render: (_, r) => new Date(r.createdAt).toLocaleDateString(), width: 110 },
    {
      title: "操作", width: 140,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}><Button size="small" danger>删除</Button></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="客户投诉" extra={
      <Space>
        <Input.Search placeholder="搜索投诉" value={keyword} onChange={e => setKeyword(e.target.value)} onSearch={fetchData} style={{ width: 200 }}/>
        <Select allowClear placeholder="类型" value={filterType} onChange={setFilterType} style={{ width: 100 }} options={typeOptions} />
        <Select allowClear placeholder="严重" value={filterSeverity} onChange={setFilterSeverity} style={{ width: 100 }} options={severityOptions} />
        <Select allowClear placeholder="状态" value={filterStatus} onChange={setFilterStatus} style={{ width: 100 }} options={statusOptions} />
        <Button icon={<ReloadOutlined />} onClick={fetchData} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建投诉</Button>
      </Space>
    }>
      <Table rowKey="id" columns={columns} dataSource={complaints} loading={loading} scroll={{ x: 1100 }} />
      <Modal title={editing ? "编辑投诉" : "新建投诉"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="选择客户" options={customers.map(c => ({ label: c.customerName, value: c.id }))} />
          </Form.Item>
          <Form.Item name="orderId" label="关联订单">
            <Select allowClear showSearch optionFilterProp="label" placeholder="选择订单(可选)" options={orders.map(o => ({ label: `${o.orderCode} - ${o.productName}`, value: o.id }))} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="投诉标题" />
          </Form.Item>
          <Form.Item name="complaintType" label="类型">
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item name="severity" label="严重程度">
            <Select options={severityOptions} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="投诉详情" />
          </Form.Item>
          {editing && (
            <>
              <Form.Item name="status" label="状态">
                <Select options={statusOptions} />
              </Form.Item>
              <Form.Item name="resolution" label="处理结果">
                <Input.TextArea rows={2} placeholder="处理措施和结果" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
