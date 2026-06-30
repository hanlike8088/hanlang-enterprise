import WorkflowActions from '../components/WorkflowActions';
import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
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
import { npiApi } from '../../services/npi';;

const statusColors: Record<string, string> = {
  立项: 'blue',
  样机: 'orange',
  试产: 'purple',
  验证: 'gold',
  量产: 'green',
};
const priorityColors: Record<string, string> = { 高: 'red', 中: 'orange', 低: 'green' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      setProjects(await npiApi.getProjects());
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
      targetDate: dayjs(r.targetDate),
      actualEndDate: r.actualEndDate ? dayjs(r.actualEndDate) : undefined,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await npiApi.updateProject(editing.id, values);
      message.success('项目已更新');
    } else {
      await npiApi.createProject(values);
      message.success('项目已创建');
    }
    setModalOpen(false);
    fetch();
  };

  const remove = async (id: string) => {
    await npiApi.deleteProject(id);
    message.success('项目已删除');
    fetch();
  };

  const columns = [
    { title: '项目编号', dataIndex: 'projectCode', key: 'projectCode', width: 140 },
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
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
      title: '目标日期',
      dataIndex: 'targetDate',
      key: 'targetDate',
      width: 110,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '试产数',
      key: 'trialRuns',
      width: 70,
      render: (_: any, r: any) => r.trialRuns?.length || 0,
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
          <Popconfirm title="确定删除该项目？" onConfirm={() => remove(r.id)}>
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
      title="NPI 项目管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建项目
        </Button>
      }
    >
      <Table
        dataSource={projects}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectName" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="如：静音电机试产" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="status" label="状态" initialValue="立项" style={{ width: 180 }}>
              <Select
                options={['立项', '样机', '试产', '验证', '量产'].map((s) => ({
                  value: s,
                  label: s,
                }))}
              />
            </Form.Item>
            <Form.Item name="priority" label="优先级" initialValue="中" style={{ width: 140 }}>
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
            <Form.Item
              name="targetDate"
              label="目标日期"
              rules={[{ required: true }]}
              style={{ width: 240 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="项目简介、目标等" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
