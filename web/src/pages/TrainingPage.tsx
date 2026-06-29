import { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Space, Tag, Typography, Empty, Divider, Tabs, Table, message, Modal, Form, InputNumber, DatePicker, Progress, Badge } from 'antd';
import { SearchOutlined, PlusOutlined, BookOutlined, SafetyCertificateOutlined, IdcardOutlined, TeamOutlined, CalendarOutlined, WarningOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const token = localStorage.getItem('access_token');
  const api = (url: string, opts?: RequestInit) => fetch(url, {
    ...opts,
    headers: { ...(opts?.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(r => r.json());

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, r, q, s, p, st] = await Promise.all([
        api('/api/training/courses'),
        api('/api/training/records'),
        api('/api/training/qualifications'),
        api('/api/training/skills'),
        api('/api/training/plans'),
        api('/api/training/stats'),
      ]);
      setCourses(c || []);
      setRecords(r || []);
      setQualifications(q || []);
      setSkills(s || []);
      setPlans(p || []);
      setStats(st);
    } catch { message.error('\u52a0\u8f7d\u6570\u636e\u5931\u8d25'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const openModal = (type: string, record?: any) => {
    setModalType(type);
    setEditingId(record?.id || null);
    if (record) {
      const vals = { ...record };
      if (vals.trainingDate) vals.trainingDate = dayjs(vals.trainingDate);
      if (vals.expiryDate) vals.expiryDate = dayjs(vals.expiryDate);
      if (vals.issueDate) vals.issueDate = dayjs(vals.issueDate);
      if (vals.assessedDate) vals.assessedDate = dayjs(vals.assessedDate);
      form.setFieldsValue(vals);
    } else {
      form.resetFields();
      if (type === 'plan') form.setFieldsValue({ planYear: new Date().getFullYear() });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const vals = await form.validateFields();
    ['trainingDate', 'expiryDate', 'issueDate', 'assessedDate'].forEach(k => {
      if (vals[k]) vals[k] = dayjs(vals[k]).format('YYYY-MM-DD');
    });
    try {
      let url = '';
      let method: string = editingId ? 'PATCH' : 'POST';
      switch (modalType) {
        case 'course': url = editingId ? `/api/training/courses/${editingId}` : '/api/training/courses'; break;
        case 'record': url = '/api/training/records'; break;
        case 'qualification': url = editingId ? `/api/training/qualifications/${editingId}` : '/api/training/qualifications'; break;
        case 'skill': url = editingId ? `/api/training/skills/${editingId}` : '/api/training/skills'; break;
        case 'plan': url = editingId ? `/api/training/plans/${editingId}` : '/api/training/plans'; break;
      }
      await api(url, { method, body: JSON.stringify(vals) });
      message.success(editingId ? '\u5df2\u66f4\u65b0' : '\u5df2\u521b\u5efa');
      setModalOpen(false);
      loadAll();
    } catch { message.error('\u64cd\u4f5c\u5931\u8d25'); }
  };

  const handleDelete = async (type: string, id: string) => {
    try {
      let url = '';
      switch (type) {
        case 'course': url = `/api/training/courses/${id}`; break;
        case 'qualification': url = `/api/training/qualifications/${id}`; break;
        case 'skill': url = `/api/training/skills/${id}`; break;
        case 'plan': url = `/api/training/plans/${id}`; break;
      }
      await api(url, { method: 'DELETE' });
      message.success('\u5df2\u5220\u9664');
      loadAll();
    } catch { message.error('\u5220\u9664\u5931\u8d25'); }
  };

  const courseColumns = [
    { title: '\u8bfe\u7a0b\u7f16\u53f7', dataIndex: 'courseCode', key: 'cc', width: 140 },
    { title: '\u8bfe\u7a0b\u540d\u79f0', dataIndex: 'courseName', key: 'cn' },
    { title: '\u7c7b\u578b', dataIndex: 'courseType', key: 'ct', width: 100, render: (v: string) => <Tag color={v === 'external' ? 'purple' : 'blue'}>{v === 'external' ? '\u5916\u90e8' : '\u5185\u90e8'}</Tag> },
    { title: '\u5206\u7c7b', dataIndex: 'category', key: 'cg', width: 100 },
    { title: '\u8bb2\u5e08', dataIndex: 'instructor', key: 'ins', width: 100, render: (v: string) => v || '-' },
    { title: '\u65f6\u957f(h)', dataIndex: 'duration', key: 'dur', width: 80 },
    { title: '\u64cd\u4f5c', key: 'op', width: 120, render: (_: any, r: any) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal('course', r)} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete('course', r.id)} />
      </Space>
    )},
  ];

  const recordColumns = [
    { title: '\u8bb0\u5f55\u7f16\u53f7', dataIndex: 'recordCode', key: 'rc', width: 140 },
    { title: '\u8bfe\u7a0b', dataIndex: ['course', 'courseName'], key: 'cn2', width: 150, render: (v: string, r: any) => v || r.courseName },
    { title: '\u5458\u5de5', dataIndex: ['employee', 'name'], key: 'en', width: 100, render: (v: string, r: any) => v || r.employeeName },
    { title: '\u57f9\u8bad\u65e5\u671f', dataIndex: 'trainingDate', key: 'td', width: 120, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '\u8bfe\u65f6(h)', dataIndex: 'hours', key: 'hrs', width: 80 },
    { title: '\u7ed3\u679c', dataIndex: 'result', key: 'res', width: 100, render: (v: string) => {
      const m: Record<string, { color: string; text: string }> = { completed: { color: 'green', text: '\u5b8c\u6210' }, failed: { color: 'red', text: '\u672a\u901a\u8fc7' }, absent: { color: 'orange', text: '\u7f3a\u5e2d' } };
      return <Tag color={m[v]?.color}>{m[v]?.text || v}</Tag>;
    }},
    { title: '\u5206\u6570', dataIndex: 'score', key: 'sc', width: 70, render: (v: number) => v != null ? v : '-' },
    { title: '\u8bc1\u4e66\u53f7', dataIndex: 'certificateNo', key: 'cert', width: 120, render: (v: string) => v || '-' },
  ];

  const qualColumns = [
    { title: '\u8d44\u8d28\u7f16\u53f7', dataIndex: 'qualCode', key: 'qc', width: 140 },
    { title: '\u8d44\u8d28\u540d\u79f0', dataIndex: 'qualName', key: 'qn' },
    { title: '\u5458\u5de5', dataIndex: ['employee', 'name'], key: 'en2', width: 100 },
    { title: '\u7c7b\u578b', dataIndex: 'qualType', key: 'qt', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: '\u9881\u53d1\u65e5\u671f', dataIndex: 'issueDate', key: 'idate', width: 120, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '\u5230\u671f\u65e5', dataIndex: 'expiryDate', key: 'edate', width: 120, render: (v: string) => {
      if (!v) return '-';
      const exp = dayjs(v);
      const diff = exp.diff(dayjs(), 'day');
      return <Text type={diff < 30 ? 'danger' : undefined}>{exp.format('YYYY-MM-DD')}</Text>;
    }},
    { title: '\u72b6\u6001', dataIndex: 'status', key: 'qs', width: 80, render: (v: string) => <Badge status={v === 'valid' ? 'success' : v === 'expired' ? 'error' : 'default'} text={v === 'valid' ? '\u6709\u6548' : v === 'expired' ? '\u8fc7\u671f' : v} /> },
    { title: '\u64cd\u4f5c', key: 'op2', width: 120, render: (_: any, r: any) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal('qualification', r)} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete('qualification', r.id)} />
      </Space>
    )},
  ];

  const skillColumns = [
    { title: '\u5458\u5de5', dataIndex: ['employee', 'name'], key: 'en3', width: 100 },
    { title: '\u6280\u80fd\u540d\u79f0', dataIndex: 'skillName', key: 'sn' },
    { title: '\u6280\u80fd\u5206\u7c7b', dataIndex: 'skillCategory', key: 'scat', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: '\u719f\u7ec3\u5ea6', dataIndex: 'proficiency', key: 'prof', width: 200, render: (v: string) => {
      const levels: Record<string, number> = { L1: 20, L2: 40, L3: 60, L4: 80, L5: 100 };
      return <Progress percent={levels[v] || 0} size="small" format={() => v} />;
    }},
    { title: '\u8bc4\u4f30\u65e5\u671f', dataIndex: 'assessedDate', key: 'adate', width: 120, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '\u8bc4\u4f30\u4eba', dataIndex: 'assessedBy', key: 'aby', width: 100, render: (v: string) => v || '-' },
    { title: '\u64cd\u4f5c', key: 'op3', width: 120, render: (_: any, r: any) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal('skill', r)} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete('skill', r.id)} />
      </Space>
    )},
  ];

  const planColumns = [
    { title: '\u8ba1\u5212\u7f16\u53f7', dataIndex: 'planCode', key: 'pc', width: 140 },
    { title: '\u8ba1\u5212\u540d\u79f0', dataIndex: 'planName', key: 'pn' },
    { title: '\u5e74\u5ea6', dataIndex: 'planYear', key: 'py', width: 80 },
    { title: '\u76ee\u6807\u7fa4\u4f53', dataIndex: 'targetGroup', key: 'tg', width: 120, render: (v: string) => v || '-' },
    { title: '\u76ee\u6807\u4eba\u6570', dataIndex: 'targetCount', key: 'tc', width: 80 },
    { title: '\u5b8c\u6210\u4eba\u6570', dataIndex: 'completedCount', key: 'cc2', width: 80 },
    { title: '\u5b8c\u6210\u7387', key: 'crate', width: 120, render: (_: any, r: any) => {
      const pct = r.targetCount > 0 ? Math.round(r.completedCount / r.targetCount * 100) : 0;
      return <Progress percent={pct} size="small" />;
    }},
    { title: '\u72b6\u6001', dataIndex: 'status', key: 'ps', width: 80, render: (v: string) => {
      const m: Record<string, string> = { draft: 'blue', active: 'green', completed: 'default' };
      return <Tag color={m[v]}>{v === 'draft' ? '\u8349\u7a3f' : v === 'active' ? '\u8fdb\u884c\u4e2d' : '\u5b8c\u6210'}</Tag>;
    }},
    { title: '\u64cd\u4f5c', key: 'op4', width: 120, render: (_: any, r: any) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal('plan', r)} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete('plan', r.id)} />
      </Space>
    )},
  ];

  const renderModal = () => {
    const titleMap: Record<string, string> = { course: '\u8bfe\u7a0b', record: '\u57f9\u8bad\u8bb0\u5f55', qualification: '\u8d44\u8d28', skill: '\u6280\u80fd', plan: '\u8ba1\u5212' };
    return (
      <Modal title={`${editingId ? '\u7f16\u8f91' : '\u65b0\u589e'}${titleMap[modalType]}`} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          {modalType === 'course' && <>
            <Form.Item name="courseName" label={'\u8bfe\u7a0b\u540d\u79f0'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="courseType" label={'\u7c7b\u578b'} initialValue="internal"><Select options={[{ value: 'internal', label: '\u5185\u90e8' }, { value: 'external', label: '\u5916\u90e8' }]} /></Form.Item>
            <Form.Item name="category" label={'\u5206\u7c7b'}><Input /></Form.Item>
            <Form.Item name="instructor" label={'\u8bb2\u5e08'}><Input /></Form.Item>
            <Form.Item name="duration" label={'\u65f6\u957f(\u5c0f\u65f6)'}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="description" label={'\u63cf\u8ff0'}><Input.TextArea rows={2} /></Form.Item>
          </>}
          {modalType === 'record' && <>
            <Form.Item name="employeeId" label={'\u5458\u5de5'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="employeeName" label={'\u5458\u5de5\u59d3\u540d'}><Input /></Form.Item>
            <Form.Item name="courseId" label={'\u8bfe\u7a0b'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="courseName" label={'\u8bfe\u7a0b\u540d\u79f0'}><Input /></Form.Item>
            <Form.Item name="trainingDate" label={'\u57f9\u8bad\u65e5\u671f'}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="hours" label={'\u8bfe\u65f6(h)'}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="result" label={'\u7ed3\u679c'} initialValue="completed"><Select options={[{ value: 'completed', label: '\u5b8c\u6210' }, { value: 'failed', label: '\u672a\u901a\u8fc7' }, { value: 'absent', label: '\u7f3a\u5e2d' }]} /></Form.Item>
            <Form.Item name="score" label={'\u5206\u6570'}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="evaluator" label={'\u8003\u6838\u4eba'}><Input /></Form.Item>
            <Form.Item name="certificateNo" label={'\u8bc1\u4e66\u7f16\u53f7'}><Input /></Form.Item>
            <Form.Item name="expiryDate" label={'\u8bc1\u4e66\u5230\u671f\u65e5'}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="remark" label={'\u5907\u6ce8'}><Input.TextArea rows={2} /></Form.Item>
          </>}
          {modalType === 'qualification' && <>
            <Form.Item name="qualName" label={'\u8d44\u8d28\u540d\u79f0'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="employeeId" label={'\u5458\u5de5ID'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="qualType" label={'\u8d44\u8d28\u7c7b\u578b'} initialValue="certification"><Select options={[{ value: 'certification', label: '\u8ba4\u8bc1\u8bc1\u4e66' }, { value: 'license', label: '\u64cd\u4f5c\u8bb8\u53ef\u8bc1' }, { value: 'degree', label: '\u5b66\u5386\u5b66\u4f4d' }, { value: 'other', label: '\u5176\u4ed6' }]} /></Form.Item>
            <Form.Item name="issuingAuthority" label={'\u9881\u53d1\u673a\u6784'}><Input /></Form.Item>
            <Form.Item name="certificateNo" label={'\u8bc1\u4e66\u7f16\u53f7'}><Input /></Form.Item>
            <Form.Item name="issueDate" label={'\u9881\u53d1\u65e5\u671f'}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="expiryDate" label={'\u5230\u671f\u65e5\u671f'}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="remark" label={'\u5907\u6ce8'}><Input.TextArea rows={2} /></Form.Item>
          </>}
          {modalType === 'skill' && <>
            <Form.Item name="employeeId" label={'\u5458\u5de5ID'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="skillName" label={'\u6280\u80fd\u540d\u79f0'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="skillCategory" label={'\u6280\u80fd\u5206\u7c7b'} initialValue="technical"><Select options={[{ value: 'technical', label: '\u6280\u672f' }, { value: 'quality', label: '\u8d28\u91cf' }, { value: 'safety', label: '\u5b89\u5168' }, { value: 'management', label: '\u7ba1\u7406' }, { value: 'operation', label: '\u64cd\u4f5c' }]} /></Form.Item>
            <Form.Item name="proficiency" label={'\u719f\u7ec3\u5ea6'} initialValue="L1"><Select options={[{ value: 'L1', label: 'L1 - \u5165\u95e8' }, { value: 'L2', label: 'L2 - \u57fa\u7840' }, { value: 'L3', label: 'L3 - \u719f\u7ec3' }, { value: 'L4', label: 'L4 - \u7cbe\u901a' }, { value: 'L5', label: 'L5 - \u4e13\u5bb6' }]} /></Form.Item>
            <Form.Item name="assessedBy" label={'\u8bc4\u4f30\u4eba'}><Input /></Form.Item>
            <Form.Item name="assessedDate" label={'\u8bc4\u4f30\u65e5\u671f'}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="remark" label={'\u5907\u6ce8'}><Input.TextArea rows={2} /></Form.Item>
          </>}
          {modalType === 'plan' && <>
            <Form.Item name="planName" label={'\u8ba1\u5212\u540d\u79f0'} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="planYear" label={'\u5e74\u5ea6'} rules={[{ required: true }]}><InputNumber min={2020} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="targetGroup" label={'\u76ee\u6807\u7fa4\u4f53'}><Input /></Form.Item>
            <Form.Item name="targetCount" label={'\u76ee\u6807\u4eba\u6570'}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="completedCount" label={'\u5b8c\u6210\u4eba\u6570'}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="status" label={'\u72b6\u6001'} initialValue="draft"><Select options={[{ value: 'draft', label: '\u8349\u7a3f' }, { value: 'active', label: '\u8fdb\u884c\u4e2d' }, { value: 'completed', label: '\u5b8c\u6210' }]} /></Form.Item>
          </>}
        </Form>
      </Modal>
    );
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}><SafetyCertificateOutlined /> {'\u57f9\u8bad\u7ba1\u7406'}</Title>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}><Card size="small"><Text type="secondary">{'\u8bfe\u7a0b\u6570'}</Text><Title level={5} style={{ margin: 0 }}>{stats.courseCount}</Title></Card></Col>
          <Col span={4}><Card size="small"><Text type="secondary">{'\u57f9\u8bad\u8bb0\u5f55'}</Text><Title level={5} style={{ margin: 0 }}>{stats.recordCount}</Title></Card></Col>
          <Col span={4}><Card size="small"><Text type="secondary">{'\u8d44\u8d28\u8bc1\u4e66'}</Text><Title level={5} style={{ margin: 0 }}>{stats.qualCount}</Title></Card></Col>
          <Col span={4}><Card size="small"><Text type="secondary">{'\u6280\u80fd\u8bb0\u5f55'}</Text><Title level={5} style={{ margin: 0 }}>{stats.skillCount}</Title></Card></Col>
          <Col span={4}><Card size="small"><Text type="secondary">{'\u57f9\u8bad\u8ba1\u5212'}</Text><Title level={5} style={{ margin: 0 }}>{stats.planCount}</Title></Card></Col>
          <Col span={4}>
            <Card size="small">
              <Text type="secondary">{'\u5373\u5c06\u8fc7\u671f\u8d44\u8d28'}</Text>
              <Title level={5} style={{ margin: 0, color: stats.expiringQualCount > 0 ? '#ff4d4f' : undefined }}>
                {stats.expiringQualCount}
              </Title>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'courses',
          label: <><BookOutlined /> {'\u57f9\u8bad\u8bfe\u7a0b'}</>,
          children: (
            <Card size="small" title={<>{'\u8bfe\u7a0b\u5217\u8868'}</>} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('course')}>{'\u65b0\u589e\u8bfe\u7a0b'}</Button>}>
              <Table dataSource={courses} columns={courseColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
        {
          key: 'records',
          label: <><CalendarOutlined /> {'\u57f9\u8bad\u8bb0\u5f55'}</>,
          children: (
            <Card size="small" title={<>{'\u57f9\u8bad\u8bb0\u5f55'}</>} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('record')}>{'\u65b0\u589e\u8bb0\u5f55'}</Button>}>
              <Table dataSource={records} columns={recordColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
        {
          key: 'qualifications',
          label: <><SafetyCertificateOutlined /> {'\u8d44\u8d28\u8ba4\u8bc1'}</>,
          children: (
            <>
              {stats?.expiringQualifications?.length > 0 && (
                <Card size="small" style={{ marginBottom: 12, borderColor: '#ff4d4f' }}>
                  <Space><WarningOutlined style={{ color: '#ff4d4f' }} /><Text type="danger">{'\u5373\u5c06\u8fc7\u671f\u8d44\u8d28'} ({stats.expiringQualCount}{'\u9879'})</Text></Space>
                  <Table
                    dataSource={stats.expiringQualifications}
                    columns={[
                      { title: '\u8d44\u8d28', dataIndex: 'qualName', key: 'qn' },
                      { title: '\u5458\u5de5', dataIndex: ['employee', 'name'], key: 'en' },
                      { title: '\u5230\u671f\u65e5', dataIndex: 'expiryDate', key: 'ed', render: (v: string) => <Text type="danger">{dayjs(v).format('YYYY-MM-DD')}</Text> },
                      { title: '\u8bc1\u4e66\u53f7', dataIndex: 'certificateNo', key: 'cn' },
                    ]}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                </Card>
              )}
              <Card size="small" title={<>{'\u8d44\u8d28\u5217\u8868'}</>} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('qualification')}>{'\u65b0\u589e\u8d44\u8d28'}</Button>}>
                <Table dataSource={qualifications} columns={qualColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 15 }} />
              </Card>
            </>
          ),
        },
        {
          key: 'skills',
          label: <><TeamOutlined /> {'\u6280\u80fd\u77e9\u9635'}</>,
          children: (
            <Card size="small" title={<>{'\u6280\u80fd\u77e9\u9635'}</>} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('skill')}>{'\u65b0\u589e\u6280\u80fd'}</Button>}>
              <Table dataSource={skills} columns={skillColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
        {
          key: 'plans',
          label: <><IdcardOutlined /> {'\u57f9\u8bad\u8ba1\u5212'}</>,
          children: (
            <Card size="small" title={<>{'\u57f9\u8bad\u8ba1\u5212'}</>} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('plan')}>{'\u65b0\u589e\u8ba1\u5212'}</Button>}>
              <Table dataSource={plans} columns={planColumns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
      ]} />

      {renderModal()}
    </div>
  );
}