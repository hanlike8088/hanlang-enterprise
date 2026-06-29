import { useState, useEffect } from 'react';
import {
  Button, Table, Card, Space, Tag, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tabs,
  Typography, Statistic, Row, Col, InputNumber, Badge,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'plan' | 'checklist' | 'finding'>('plan');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, cr, fr] = await Promise.all([
        fetch('/api/audit/plans').then(r => r.json()),
        fetch('/api/audit/checklists').then(r => r.json()),
        fetch('/api/audit/findings').then(r => r.json()),
      ]);
      setPlans(pr); setChecklists(cr); setFindings(fr);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    const res = await fetch('/api/audit/stats');
    setStats(await res.json());
  };

  useEffect(() => { fetchData(); fetchStats(); }, []);

  const openModal = (type: 'plan' | 'checklist' | 'finding', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    if (item) form.setFieldsValue({ ...item, startDate: item.startDate ? dayjs(item.startDate) : null, endDate: item.endDate ? dayjs(item.endDate) : null, deadline: item.deadline ? dayjs(item.deadline) : null });
    else form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    if (values.startDate) values.startDate = values.startDate.toISOString();
    if (values.endDate) values.endDate = values.endDate.toISOString();
    if (values.deadline) values.deadline = values.deadline.toISOString();

    let url; let method; let body;
    if (modalType === 'plan') {
      url = editingItem ? `/api/audit/plans/${editingItem.id}` : '/api/audit/plans';
      method = editingItem ? 'PATCH' : 'POST';
    } else if (modalType === 'checklist') {
      url = editingItem ? `/api/audit/checklists/${editingItem.id}` : '/api/audit/checklists';
      method = editingItem ? 'PATCH' : 'POST';
      if (!editingItem) values.planId = selectedPlanId;
    } else {
      url = editingItem ? `/api/audit/findings/${editingItem.id}` : '/api/audit/findings';
      method = editingItem ? 'PATCH' : 'POST';
      if (!editingItem) values.planId = selectedPlanId;
    }

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      message.success(editingItem ? '已更新' : '已创建');
      setModalOpen(false);
      await fetchData();
    } else {
      message.error('操作失败');
    }
  };

  const deleteItem = async (type: string, id: string) => {
    await fetch(`/api/audit/${type}/${id}`, { method: 'DELETE' });
    message.success('已删除');
    await fetchData();
  };

  const planColumns = [
    { title: '计划编号', dataIndex: 'planCode', key: 'planCode', width: 140 },
    { title: '计划名称', dataIndex: 'planName', key: 'planName' },
    { title: '审核类型', dataIndex: 'auditType', key: 'auditType', width: 100 },
    { title: '审核年份', dataIndex: 'planYear', key: 'planYear', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: '草稿' },
          planned: { color: 'processing', text: '已计划' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'green', text: '已完成' },
        };
        const m = map[s] || { color: 'default', text: s };
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    { title: '审核组长', dataIndex: 'leadAuditor', key: 'leadAuditor', width: 100 },
    { title: '范围', dataIndex: 'scope', key: 'scope', ellipsis: true },
    {
      title: '', key: 'actions', width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPlanId(record.id); setActiveTab('checklists'); }}>检查</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal('plan', record)} />
          <Popconfirm title="确认删除？" onConfirm={() => deleteItem('plans', record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const checklistColumns = [
    { title: '编号', dataIndex: 'checklistCode', key: 'checklistCode', width: 130 },
    { title: '序号', dataIndex: 'itemNo', key: 'itemNo', width: 60 },
    { title: '条款', dataIndex: 'clause', key: 'clause', width: 100 },
    { title: '检查内容', dataIndex: 'checkContent', key: 'checkContent' },
    { title: '审核方法', dataIndex: 'checkMethod', key: 'checkMethod', width: 100 },
    {
      title: '结果', dataIndex: 'result', key: 'result', width: 90,
      render: (s: string) => {
        const map: Record<string, { color: string }> = {
          '待审核': { color: 'default' }, '符合': { color: 'green' }, '不符合': { color: 'red' }, '不适用': { color: 'orange' },
        };
        return <Tag color={map[s]?.color || 'default'}>{s}</Tag>;
      },
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal('checklist', record)} />
          <Popconfirm title="确认删除？" onConfirm={() => deleteItem('checklists', record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const findingColumns = [
    { title: '发现编号', dataIndex: 'findingCode', key: 'findingCode', width: 140 },
    { title: '类型', dataIndex: 'findingType', key: 'findingType', width: 90, render: (s: string) => <Tag>{s}</Tag> },
    {
      title: '严重度', dataIndex: 'severity', key: 'severity', width: 80,
      render: (s: string) => {
        const color = s === '严重' ? 'red' : s === '一般' ? 'orange' : 'blue';
        return <Tag color={color}>{s}</Tag>;
      },
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '条款', dataIndex: 'clause', key: 'clause', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          open: { color: 'red', text: '未关闭' },
          in_progress: { color: 'processing', text: '处理中' },
          closed: { color: 'green', text: '已关闭' },
        };
        const m = map[s] || { color: 'default', text: s };
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal('finding', record)} />
          <Popconfirm title="确认删除？" onConfirm={() => deleteItem('findings', record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderModalContent = () => {
    if (modalType === 'plan') return (
      <Form form={form} layout="vertical">
        <Form.Item name="planName" label="计划名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="auditType" label="审核类型" initialValue="内部审核">
          <Select options={[{ label: '内部审核', value: '内部审核' }, { label: '供应商审核', value: '供应商审核' }, { label: '过程审核', value: '过程审核' }]} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="planYear" label="审核年份" rules={[{ required: true }]} initialValue={new Date().getFullYear()}>
              <InputNumber style={{ width: '100%' }} min={2020} max={2100} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="planMonth" label="审核月份"><InputNumber style={{ width: '100%' }} min={1} max={12} /></Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="状态" initialValue="draft">
              <Select options={[{ label: '草稿', value: 'draft' }, { label: '已计划', value: 'planned' }, { label: '进行中', value: 'in_progress' }, { label: '已完成', value: 'completed' }]} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="startDate" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="endDate" label="结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Col>
        </Row>
        <Form.Item name="leadAuditor" label="审核组长"><Input /></Form.Item>
        <Form.Item name="team" label="审核组成员"><Input.TextArea rows={2} placeholder="多人以逗号分隔" /></Form.Item>
        <Form.Item name="scope" label="审核范围"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    );

    if (modalType === 'checklist') return (
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="itemNo" label="序号" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item name="clause" label="体系条款" rules={[{ required: true }]}>
              <Input placeholder="如 ISO 9001:2015 8.5.1" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="checkContent" label="检查内容" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="checkMethod" label="审核方法" initialValue="现场检查">
              <Select options={[{ label: '现场检查', value: '现场检查' }, { label: '文件审查', value: '文件审查' }, { label: '人员访谈', value: '人员访谈' }, { label: '记录抽查', value: '记录抽查' }]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="responsible" label="责任人"><Input /></Form.Item>
          </Col>
        </Row>
        <Form.Item name="result" label="审核结果" initialValue="待审核">
          <Select options={[{ label: '待审核', value: '待审核' }, { label: '符合', value: '符合' }, { label: '不符合', value: '不符合' }, { label: '不适用', value: '不适用' }]} />
        </Form.Item>
        <Form.Item name="evidence" label="客观证据"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    );

    return (
      <Form form={form} layout="vertical">
        <Form.Item name="findingType" label="发现类型" initialValue="不符合项">
          <Select options={[{ label: '不符合项', value: '不符合项' }, { label: '观察项', value: '观察项' }, { label: '改进机会', value: '改进机会' }]} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="severity" label="严重度" initialValue="一般">
              <Select options={[{ label: '严重', value: '严重' }, { label: '一般', value: '一般' }, { label: '轻微', value: '轻微' }]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态" initialValue="open">
              <Select options={[{ label: '未关闭', value: 'open' }, { label: '处理中', value: 'in_progress' }, { label: '已关闭', value: 'closed' }]} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="不符合描述" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="clause" label="对应条款"><Input placeholder="如 ISO 9001:2015 8.5.2" /></Form.Item>
        <Form.Item name="evidence" label="客观证据"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="responsible" label="责任人"><Input /></Form.Item>
        <Form.Item name="deadline" label="整改期限"><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="correctiveAction" label="纠正措施"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="note" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    );
  };

  return (
    <div>
      <Title level={4}>内部审核管理</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="审核计划总数" value={stats?.totalPlans || 0} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="进行中计划" value={stats?.activePlans || 0} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="未关闭发现项" value={stats?.openFindings || 0} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="检查表总数" value={checklists.length} /></Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { openModal(activeTab === 'plans' ? 'plan' : activeTab === 'checklists' ? 'checklist' : 'finding'); }}>
              新建{activeTab === 'plans' ? '审核计划' : activeTab === 'checklists' ? '检查项' : '发现项'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); fetchStats(); }} />
          </Space>
        }>
          <Tabs.TabPane tab={`审核计划 (${plans.length})`} key="plans">
            <Table dataSource={plans} columns={planColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 10 }} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={`检查表 (${checklists.length})`} key="checklists">
            <Table dataSource={checklists} columns={checklistColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 10 }} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={`发现项 (${findings.length})`} key="findings">
            <Table dataSource={findings} columns={findingColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 10 }} />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingItem ? `编辑${modalType === 'plan' ? '审核计划' : modalType === 'checklist' ? '检查项' : '发现项'}` : `新建${modalType === 'plan' ? '审核计划' : modalType === 'checklist' ? '检查项' : '发现项'}`}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
