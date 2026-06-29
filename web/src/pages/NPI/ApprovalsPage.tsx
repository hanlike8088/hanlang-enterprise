import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Card, Tag, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { npiApi } from '../../services/api';

const statusColors: Record<string, string> = { '待审批': 'orange', '已通过': 'green', '已驳回': 'red' };
const typeColors: Record<string, string> = { '试产审批': 'blue', '转量产审批': 'purple', 'ECN审批': 'cyan' };

export default function ApprovalsPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewing, setReviewing] = useState<any>(null);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [approvals, projs] = await Promise.all([npiApi.getApprovals(), npiApi.getProjects()]);
      setData(approvals);
      setProjects(projs);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const submit = async () => {
    const values = await form.validateFields();
    await npiApi.createApproval(values);
    message.success('审批申请已提交');
    setModalOpen(false);
    fetch();
  };

  const openReview = (r: any) => {
    setReviewing(r);
    reviewForm.resetFields();
    setReviewModal(true);
  };

  const submitReview = async () => {
    const values = await reviewForm.validateFields();
    await npiApi.reviewApproval(reviewing.id, values);
    message.success('审批完成');
    setReviewModal(false);
    fetch();
  };

  const columns = [
    { title: '项目', key: 'project', width: 180, render: (_: any, r: any) => projects.find(p => p.id === r.projectId)?.projectName || r.projectId },
    {
      title: '审批类型', dataIndex: 'approvalType', key: 'approvalType', width: 120,
      render: (t: string) => <Tag color={typeColors[t]}>{t}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
    { title: '审批人', dataIndex: 'approver', key: 'approver', width: 100, render: (v: string | null) => v || '-' },
    { title: '备注', dataIndex: 'comment', key: 'comment', ellipsis: true },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, r: any) => r.status === '待审批' ? (
        <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openReview(r)}>审批</Button>
      ) : '-',
    },
  ];

  return (
    <Card title="审批管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>发起审批</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="发起审批" open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select options={projects.map(p => ({ value: p.id, label: `${p.projectCode} - ${p.projectName}` }))} />
          </Form.Item>
          <Form.Item name="approvalType" label="审批类型" rules={[{ required: true }]}>
            <Select options={['试产审批','转量产审批','ECN审批'].map(t => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="applicant" label="申请人" rules={[{ required: true }]}>
            <Input placeholder="填写申请人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="审批确认" open={reviewModal} onOk={submitReview} onCancel={() => setReviewModal(false)} width={480}>
        {reviewing && <p style={{ marginBottom: 16 }}><strong>{reviewing.approvalType}</strong> — {projects.find(p => p.id === reviewing.projectId)?.projectName}</p>}
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="status" label="审批结果" rules={[{ required: true }]}>
            <Select options={[
              { value: '已通过', label: <><CheckCircleOutlined style={{ color: '#52c41a' }} /> 通过</> },
              { value: '已驳回', label: <><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 驳回</> },
            ]} />
          </Form.Item>
          <Form.Item name="approver" label="审批人" rules={[{ required: true }]}>
            <Input placeholder="填写审批人姓名" />
          </Form.Item>
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
