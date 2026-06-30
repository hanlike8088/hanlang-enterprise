import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  Tabs,
  Table,
  message,
  Modal,
  Form,
  DatePicker,
  Descriptions,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  FileProtectOutlined,
  SendOutlined,
  StopOutlined,
  HistoryOutlined,
  EditOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function DocumentControlPage() {
  const [activeTab, setActiveTab] = useState('approvals');
  const [approvals, setApprovals] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [obsoletes, setObsoletes] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form] = Form.useForm();
  const token = localStorage.getItem('access_token');
  const api = (url: string, opts?: RequestInit) =>
    fetch(url, {
      ...opts,
      headers: {
        ...(opts?.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).then((r) => r.json());

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, d, o, c, st] = await Promise.all([
        api('/api/document-control/approvals'),
        api('/api/document-control/distributions'),
        api('/api/document-control/obsoletes'),
        api('/api/document-control/changes'),
        api('/api/document-control/stats'),
      ]);
      setApprovals(a || []);
      setDistributions(d || []);
      setObsoletes(o || []);
      setChanges(c || []);
      setStats(st);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openModal = (type: string) => {
    setModalType(type);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const vals = await form.validateFields();
    try {
      let url = '';
      const method = 'POST';
      switch (modalType) {
        case 'approval':
          url = '/api/document-control/approvals';
          break;
        case 'distribution':
          url = '/api/document-control/distributions';
          break;
        case 'obsolete':
          url = '/api/document-control/obsoletes';
          break;
        case 'change':
          url = '/api/document-control/changes';
          break;
      }
      await api(url, { method, body: JSON.stringify(vals) });
      message.success('已创建');
      setModalOpen(false);
      loadAll();
    } catch {
      message.error('操作失败');
    }
  };

  const handleApprove = async (id: string, decision: string) => {
    Modal.confirm({
      title: decision === 'approved' ? '确认批准' : '确认退回',
      content: decision === 'approved' ? '确定批准此文档发布？' : '确定退回此文档审批？',
      onOk: async () => {
        try {
          const approver = localStorage.getItem('currentUserName') || 'admin';
          await api(`/api/document-control/approvals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ approver, decision, comment: '' }),
          });
          message.success(decision === 'approved' ? '已批准' : '已退回');
          loadAll();
        } catch {
          message.error('审批失败');
        }
      },
    });
  };

  const handleRecall = async (id: string) => {
    Modal.confirm({
      title: '确认回收',
      content: '确定回收此文件发放记录？',
      onOk: async () => {
        try {
          await api(`/api/document-control/distributions/${id}/recall`, { method: 'PATCH' });
          message.success('已回收');
          loadAll();
        } catch {
          message.error('回收失败');
        }
      },
    });
  };

  const approvalColumns = [
    { title: '审批编号', dataIndex: 'approvalCode', key: 'ac', width: 140 },
    {
      title: '文档类型',
      dataIndex: 'docType',
      key: 'dt',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '文档名称', dataIndex: 'docName', key: 'dn' },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'act',
      width: 80,
      render: (v: string) => (
        <Tag color={v === 'publish' ? 'blue' : 'orange'}>{v === 'publish' ? '发布' : v}</Tag>
      ),
    },
    {
      title: '申请人',
      dataIndex: 'requestedBy',
      key: 'rb',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'apr',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '决定',
      dataIndex: 'decision',
      key: 'dec',
      width: 80,
      render: (v: string) => {
        const m: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待审批' },
          approved: { color: 'green', text: '通过' },
          rejected: { color: 'red', text: '退回' },
        };
        return <Badge status={m[v]?.color as any} text={m[v]?.text || v} />;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'requestedAt',
      key: 'rat',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'op',
      width: 160,
      render: (_: any, r: any) =>
        r.decision === 'pending' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(r.id, 'approved')}
            >
              通过
            </Button>
            <Button
              size="small"
              danger
              icon={<RollbackOutlined />}
              onClick={() => handleApprove(r.id, 'rejected')}
            >
              退回
            </Button>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  const distColumns = [
    { title: '发放编号', dataIndex: 'distributeCode', key: 'dc', width: 140 },
    {
      title: '文档类型',
      dataIndex: 'docType',
      key: 'dt2',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '文档名称', dataIndex: 'docName', key: 'dn2' },
    { title: '接收人', dataIndex: 'recipient', key: 'rcp', width: 100 },
    {
      title: '接收部门',
      dataIndex: 'recipientOrg',
      key: 'rog',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'st',
      width: 100,
      render: (v: string) => (
        <Badge
          status={v === 'distributed' ? 'success' : 'warning'}
          text={v === 'distributed' ? '已发放' : '已回收'}
        />
      ),
    },
    {
      title: '发放时间',
      dataIndex: 'distributedAt',
      key: 'dat',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'op2',
      width: 80,
      render: (_: any, r: any) =>
        r.status === 'distributed' ? (
          <Button
            size="small"
            danger
            icon={<RollbackOutlined />}
            onClick={() => handleRecall(r.id)}
          >
            回收
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  const obsoleteColumns = [
    { title: '废止编号', dataIndex: 'obsoleteCode', key: 'oc', width: 140 },
    {
      title: '文档类型',
      dataIndex: 'docType',
      key: 'dt3',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '文档名称', dataIndex: 'docName', key: 'dn3' },
    {
      title: '替换为',
      dataIndex: 'replacedBy',
      key: 'rby',
      width: 180,
      render: (v: string) => v || '-',
    },
    { title: '原因', dataIndex: 'reason', key: 'rsn', width: 150, render: (v: string) => v || '-' },
    {
      title: '批准人',
      dataIndex: 'approvedBy',
      key: 'aby',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '废止日期',
      dataIndex: 'obsoleteDate',
      key: 'od',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
  ];

  const changeColumns = [
    { title: '变更编号', dataIndex: 'changeCode', key: 'cc', width: 140 },
    {
      title: '文档类型',
      dataIndex: 'docType',
      key: 'dt4',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '文档名称', dataIndex: 'docName', key: 'dn4' },
    {
      title: '变更类型',
      dataIndex: 'changeType',
      key: 'ct',
      width: 100,
      render: (v: string) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: '旧版本',
      dataIndex: 'fromVersion',
      key: 'fv',
      width: 80,
      render: (v: string) => v || '-',
    },
    {
      title: '新版本',
      dataIndex: 'toVersion',
      key: 'tv',
      width: 80,
      render: (v: string) => v || '-',
    },
    { title: '变更说明', dataIndex: 'changeNote', key: 'cn', width: 200, ellipsis: true },
    {
      title: '变更人',
      dataIndex: 'changedBy',
      key: 'cb',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '变更时间',
      dataIndex: 'changedAt',
      key: 'cat',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const renderModal = () => {
    const titleMap: Record<string, string> = {
      approval: '审批',
      distribution: '发放',
      obsolete: '废止',
      change: '变更',
    };
    return (
      <Modal
        title={`新增${titleMap[modalType]}`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {modalType === 'approval' && (
            <>
              <Form.Item name="docType" label="文档类型" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'drawing', label: '图纸' },
                    { value: 'bom', label: '物料清单' },
                    { value: 'procedure', label: '作业指导书' },
                    { value: 'quality_manual', label: '质量手册' },
                    { value: 'standard', label: '标准规范' },
                    { value: 'other', label: '其他' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="docId" label="文档ID" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docName" label="文档名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docCode" label="文档编码">
                <Input />
              </Form.Item>
              <Form.Item name="action" label="动作" initialValue="publish">
                <Select
                  options={[
                    { value: 'publish', label: '发布' },
                    { value: 'revise', label: '修订' },
                    { value: 'obsolete', label: '废止' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="requestedBy" label="申请人">
                <Input />
              </Form.Item>
              <Form.Item name="comment" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
          {modalType === 'distribution' && (
            <>
              <Form.Item name="docType" label="文档类型" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docId" label="文档ID" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docName" label="文档名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="recipient" label="接收人" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="recipientOrg" label="接收部门">
                <Input />
              </Form.Item>
              <Form.Item name="createdBy" label="发放人">
                <Input />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
          {modalType === 'obsolete' && (
            <>
              <Form.Item name="docType" label="文档类型" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docId" label="文档ID" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docName" label="文档名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="replacedBy" label="替换为">
                <Input />
              </Form.Item>
              <Form.Item name="reason" label="废止原因">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="approvedBy" label="批准人">
                <Input />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
          {modalType === 'change' && (
            <>
              <Form.Item name="docType" label="文档类型" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docId" label="文档ID" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="docName" label="文档名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="changeType" label="变更类型" initialValue="revision">
                <Select
                  options={[
                    { value: 'revision', label: '修订' },
                    { value: 'version_up', label: '版本升级' },
                    { value: 'correction', label: '纠错' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="fromVersion" label="旧版本">
                <Input />
              </Form.Item>
              <Form.Item name="toVersion" label="新版本">
                <Input />
              </Form.Item>
              <Form.Item name="changeNote" label="变更说明" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="changedBy" label="变更人">
                <Input />
              </Form.Item>
              <Form.Item name="approvedBy" label="批准人">
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    );
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <FileProtectOutlined /> 文档控制
      </Title>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Text type="secondary">审批总数</Text>
              <Title level={5} style={{ margin: 0 }}>
                {stats.approvalCount}
              </Title>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Text type="secondary">发放记录</Text>
              <Title level={5} style={{ margin: 0 }}>
                {stats.distCount}
              </Title>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Text type="secondary">废止记录</Text>
              <Title level={5} style={{ margin: 0 }}>
                {stats.obsoleteCount}
              </Title>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Text type="secondary">变更记录</Text>
              <Title level={5} style={{ margin: 0 }}>
                {stats.changeCount}
              </Title>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Text type="secondary">待审批</Text>
              <Title
                level={5}
                style={{ margin: 0, color: stats.pendingApprovals > 0 ? '#fa8c16' : undefined }}
              >
                {stats.pendingApprovals}
              </Title>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'approvals',
            label: (
              <>
                <FileProtectOutlined /> 文档审批
              </>
            ),
            children: (
              <Card
                size="small"
                title={<>审批列表</>}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openModal('approval')}
                  >
                    新增审批
                  </Button>
                }
              >
                <Table
                  dataSource={approvals}
                  columns={approvalColumns}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'distributions',
            label: (
              <>
                <SendOutlined /> 文件发放
              </>
            ),
            children: (
              <Card
                size="small"
                title={<>发放记录</>}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openModal('distribution')}
                  >
                    新增发放
                  </Button>
                }
              >
                <Table
                  dataSource={distributions}
                  columns={distColumns}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'obsoletes',
            label: (
              <>
                <StopOutlined /> 文件废止
              </>
            ),
            children: (
              <Card
                size="small"
                title={<>废止记录</>}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openModal('obsolete')}
                  >
                    新增废止
                  </Button>
                }
              >
                <Table
                  dataSource={obsoletes}
                  columns={obsoleteColumns}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'changes',
            label: (
              <>
                <HistoryOutlined /> 变更记录
              </>
            ),
            children: (
              <Card
                size="small"
                title={<>变更记录</>}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openModal('change')}
                  >
                    新增变更
                  </Button>
                }
              >
                <Table
                  dataSource={changes}
                  columns={changeColumns}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {renderModal()}
    </div>
  );
}
