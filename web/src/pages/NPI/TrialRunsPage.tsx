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
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { npiApi } from '../../services/api';

const statusColors: Record<string, string> = {
  计划中: 'blue',
  进行中: 'orange',
  已完成: 'green',
  已取消: 'red',
};

export default function TrialRunsPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [trialRuns, projs] = await Promise.all([npiApi.getTrialRuns(), npiApi.getProjects()]);
      setData(trialRuns);
      setProjects(projs);
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
      await npiApi.updateTrialRun(editing.id, values);
      message.success('已更新');
    } else {
      await npiApi.createTrialRun(values);
      message.success('已创建');
    }
    setModalOpen(false);
    fetch();
  };

  const columns = [
    { title: '试产编号', dataIndex: 'trialCode', key: 'trialCode', width: 140 },
    {
      title: '所属项目',
      key: 'project',
      width: 180,
      render: (_: any, r: any) =>
        projects.find((p) => p.id === r.projectId)?.projectName || r.projectId,
    },
    { title: '试产数量', dataIndex: 'batchSize', key: 'batchSize', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
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
    { title: '负责人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, r: any) => (
        <Button type="link" size="small" onClick={() => openEdit(r)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="试产管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建试产
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
        title={editing ? '编辑试产' : '新建试产'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.projectCode} - ${p.projectName}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="batchSize" label="试产数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="计划中">
            <Select
              options={['计划中', '进行中', '已完成', '已取消'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Form.Item>
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
          <Form.Item name="createdBy" label="负责人" rules={[{ required: true }]}>
            <Input placeholder="填写负责人姓名" />
          </Form.Item>
          <Form.Item name="result" label="试产结论">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
