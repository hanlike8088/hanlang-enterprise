import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Card, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { npiApi } from '../../services/api';

const severityColors: Record<string, string> = {
  严重: 'red',
  主要: 'orange',
  次要: 'blue',
  建议: 'green',
};
const statusColors: Record<string, string> = {
  待处理: 'red',
  处理中: 'orange',
  已解决: 'green',
  已关闭: 'default',
};

export default function IssuesPage() {
  const [data, setData] = useState<any[]>([]);
  const [trialRuns, setTrialRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [issues, trs] = await Promise.all([npiApi.getIssues(), npiApi.getTrialRuns()]);
      setData(issues);
      setTrialRuns(trs);
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
    const values = await form.validateFields();
    if (editing) {
      await npiApi.updateIssue(editing.id, values);
      message.success('问题已更新');
    } else {
      await npiApi.createIssue(values);
      message.success('问题已创建');
    }
    setModalOpen(false);
    fetch();
  };

  const columns = [
    { title: '问题编号', dataIndex: 'issueCode', key: 'issueCode', width: 130 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: string) => <Tag color={severityColors[s]}>{s}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, r: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setDetail(r);
              setDetailOpen(true);
            }}
          >
            详情
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(r)}>
            处理
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="问题跟踪"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          提交问题
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
        title={editing ? '处理问题' : '提交问题'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="trialRunId" label="所属试产" rules={[{ required: true }]}>
            <Select options={trialRuns.map((tr) => ({ value: tr.id, label: tr.trialCode }))} />
          </Form.Item>
          <Form.Item name="title" label="问题标题" rules={[{ required: true }]}>
            <Input placeholder="问题简要描述" />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="severity" label="严重程度" initialValue="主要" style={{ width: 180 }}>
              <Select
                options={['严重', '主要', '次要', '建议'].map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="待处理" style={{ width: 180 }}>
              <Select
                options={['待处理', '处理中', '已解决', '已关闭'].map((s) => ({
                  value: s,
                  label: s,
                }))}
              />
            </Form.Item>
          </Space>
          <Form.Item name="assignee" label="负责人">
            <Input placeholder="指定处理人" />
          </Form.Item>
          <Form.Item name="solution" label="解决方案">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="问题详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={520}
      >
        {detail && (
          <div>
            <p>
              <strong>编号：</strong>
              {detail.issueCode}
            </p>
            <p>
              <strong>标题：</strong>
              {detail.title}
            </p>
            <p>
              <strong>描述：</strong>
              {detail.description || '-'}
            </p>
            <p>
              <strong>严重程度：</strong>
              <Tag color={severityColors[detail.severity]}>{detail.severity}</Tag>
            </p>
            <p>
              <strong>状态：</strong>
              <Tag color={statusColors[detail.status]}>{detail.status}</Tag>
            </p>
            <p>
              <strong>负责人：</strong>
              {detail.assignee || '-'}
            </p>
            <p>
              <strong>解决方案：</strong>
              {detail.solution || '-'}
            </p>
            <p>
              <strong>解决时间：</strong>
              {detail.resolvedAt ? new Date(detail.resolvedAt).toLocaleDateString() : '-'}
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
