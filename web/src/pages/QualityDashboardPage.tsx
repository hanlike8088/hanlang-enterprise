import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  Table,
  Tag,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Popconfirm,
  message,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function QualityDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [objModalOpen, setObjModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<any>(null);
  const [objForm] = Form.useForm();
  const [objectives, setObjectives] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/quality-kpi').then((r) => r.json()),
      fetch('/api/quality/objectives').then((r) => r.json()),
    ])
      .then(([d, objs]) => {
        setData(d);
        setObjectives(objs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchObjectives = async () => {
    const res = await fetch('/api/quality/objectives');
    setObjectives(await res.json());
  };

  const openObjModal = (obj?: any) => {
    setEditingObj(obj || null);
    if (obj) {
      objForm.setFieldsValue(obj);
    } else {
      objForm.resetFields();
      objForm.setFieldsValue({
        periodYear: new Date().getFullYear(),
        periodMonth: new Date().getMonth() + 1,
        period: 'monthly',
        status: 'active',
        category: '质量',
        unit: '%',
      });
    }
    setObjModalOpen(true);
  };

  const handleObjOk = async () => {
    const values = await objForm.validateFields();
    const url = editingObj ? `/api/quality/objectives/${editingObj.id}` : '/api/quality/objectives';
    const method = editingObj ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      message.success(editingObj ? '已更新' : '已创建');
      setObjModalOpen(false);
      await fetchObjectives();
    } else {
      message.error('操作失败');
    }
  };

  const deleteObj = async (id: string) => {
    await fetch(`/api/quality/objectives/${id}`, { method: 'DELETE' });
    message.success('已删除');
    await fetchObjectives();
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data) return <Empty description="暂无数据" />;

  const { complaints, quality, training, suppliers } = data;

  const objectiveColumns = [
    { title: '目标名称', dataIndex: 'objName', key: 'objName' },
    { title: '类别', dataIndex: 'category', key: 'category', width: 80 },
    {
      title: '达成率',
      key: 'rate',
      width: 200,
      render: (_: any, r: any) => {
        const pct = r.targetValue > 0 ? (r.currentValue / r.targetValue) * 100 : 0;
        return (
          <Progress
            percent={Math.min(pct, 100)}
            size="small"
            status={pct >= 100 ? 'success' : pct >= 80 ? 'active' : 'exception'}
            format={() => `${r.currentValue}/${r.targetValue}${r.unit}`}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '进行中' : s}</Tag>
      ),
    },
  ];

  const complaintMonthColumns = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 60, render: (v: number) => `${v}月` },
    {
      title: '投诉数',
      dataIndex: 'count',
      key: 'count',
      render: (v: number, _: any, i: number) => {
        const max = Math.max(...complaints.byMonth.map((m: any) => m.count), 1);
        const pct = (v / max) * 100;
        return (
          <Progress
            percent={pct}
            showInfo={false}
            size="small"
            strokeColor={v > max * 0.7 ? '#ff4d4f' : '#52c41a'}
            format={() => `${v}`}
          />
        );
      },
    },
    { title: '', dataIndex: 'count', key: 'count2', width: 40 },
  ];

  return (
    <div>
      <Title level={4}>质量 KPI 仪表盘 (管理评审)</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="客诉总数 (本年)"
              value={complaints.total}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="未关闭客诉"
              value={complaints.openCount}
              valueStyle={{ color: complaints.openCount > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="OQC 合格率"
              value={quality.oqcPassRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: quality.oqcPassRate >= 95 ? '#52c41a' : '#ff4d4f' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="IQC 合格率"
              value={quality.iqcPassRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: quality.iqcPassRate >= 95 ? '#52c41a' : '#ff4d4f' }}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="CAPA 关闭率"
              value={quality.capa.closeRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: quality.capa.closeRate >= 80 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="OTIF 准时交付率"
              value={quality.otifRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: quality.otifRate >= 90 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="NCR 总数"
              value={quality.ncr.total}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="未关闭 NCR"
              value={quality.ncr.open}
              valueStyle={{ color: quality.ncr.open > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="培训记录 (本年)" value={training.thisYear} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="即将过期资质"
              value={training.expiringQualifications}
              valueStyle={{ color: training.expiringQualifications > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="合格供应商"
              value={
                suppliers.ratings
                  ?.filter((r: any) => r.rating === 'A' || r.rating === 'B')
                  .reduce((s: number, r: any) => s + r.count, 0) || 0
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="需淘汰供应商"
              value={suppliers.ratings?.find((r: any) => r.rating === 'D')?.count || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="质量目标达成" size="small">
            {objectives && objectives.length > 0 ? (
              <Table
                dataSource={objectives}
                columns={objectiveColumns}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : (
              <Empty description="暂无质量目标数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title={`客诉月度趋势 (${new Date().getFullYear()})`} size="small">
            {complaints.byMonth && complaints.byMonth.length > 0 ? (
              <Table
                dataSource={complaints.byMonth}
                columns={complaintMonthColumns}
                rowKey="month"
                size="small"
                pagination={false}
                showHeader={false}
              />
            ) : (
              <Empty description="暂无客诉数据" />
            )}
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">按类型: </Text>
              {complaints.byType?.map((t: any) => (
                <Tag key={t.type}>
                  {t.type}: {t.count}
                </Tag>
              ))}
            </div>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">按严重度: </Text>
              {complaints.bySeverity?.map((s: any) => (
                <Tag
                  key={s.severity}
                  color={
                    s.severity === 'critical' ? 'red' : s.severity === 'major' ? 'orange' : 'blue'
                  }
                >
                  {s.severity}: {s.count}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="NCR 缺陷类型分布" size="small">
            {quality.ncr.byDefectType && quality.ncr.byDefectType.length > 0 ? (
              quality.ncr.byDefectType.map((d: any) => (
                <div key={d.type} style={{ marginBottom: 8 }}>
                  <Text>{d.type}</Text>
                  <Progress
                    percent={Math.round((d.count / quality.ncr.total) * 100)}
                    size="small"
                  />
                </div>
              ))
            ) : (
              <Empty description="暂无 NCR 数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="供应商评级分布" size="small">
            {suppliers.ratings && suppliers.ratings.length > 0 ? (
              suppliers.ratings.map((r: any) => {
                const total = suppliers.ratings.reduce((s: number, x: any) => s + x.count, 0);
                return (
                  <div key={r.rating} style={{ marginBottom: 8 }}>
                    <Tag
                      color={
                        r.rating === 'A'
                          ? 'green'
                          : r.rating === 'B'
                            ? 'blue'
                            : r.rating === 'C'
                              ? 'orange'
                              : 'red'
                      }
                    >
                      {r.rating}级
                    </Tag>
                    <Progress
                      percent={Math.round((r.count / total) * 100)}
                      size="small"
                      format={() => `${r.count}家`}
                    />
                  </div>
                );
              })
            ) : (
              <Empty description="暂无供应商评级数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="质量目标管理"
            size="small"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openObjModal()}
              >
                新建目标
              </Button>
            }
          >
            {objectives && objectives.length > 0 ? (
              <Table
                dataSource={objectives}
                size="small"
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '目标编号', dataIndex: 'objCode', width: 140 },
                  { title: '目标名称', dataIndex: 'objName' },
                  { title: '类别', dataIndex: 'category', width: 80 },
                  {
                    title: '目标值',
                    dataIndex: 'targetValue',
                    width: 80,
                    render: (v: number) => v,
                  },
                  {
                    title: '当前值',
                    dataIndex: 'currentValue',
                    width: 80,
                    render: (v: number) => v,
                  },
                  {
                    title: '周期',
                    key: 'period',
                    width: 120,
                    render: (_: any, r: any) => `${r.periodYear}年`,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 80,
                    render: (s: string) => (
                      <Tag color={s === 'active' ? 'green' : 'default'}>
                        {s === 'active' ? '进行中' : s}
                      </Tag>
                    ),
                  },
                  {
                    title: '',
                    key: 'actions',
                    width: 100,
                    render: (_: any, r: any) => (
                      <Space size="small">
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openObjModal(r)}
                        />
                        <Popconfirm title="确认删除？" onConfirm={() => deleteObj(r.id)}>
                          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂未设定质量目标，点击右上角新建" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Quality Objective Modal */}
      <Modal
        title={editingObj ? '编辑质量目标' : '新建质量目标'}
        open={objModalOpen}
        onOk={handleObjOk}
        onCancel={() => setObjModalOpen(false)}
        destroyOnClose
        width={560}
      >
        <Form form={objForm} layout="vertical">
          <Form.Item
            name="objName"
            label="目标名称"
            rules={[{ required: true, message: '请输入目标名称' }]}
          >
            <Input placeholder="如：OQC合格率" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="类别" initialValue="质量">
                <Select
                  options={[
                    { label: '质量', value: '质量' },
                    { label: '交付', value: '交付' },
                    { label: '成本', value: '成本' },
                    { label: '安全', value: '安全' },
                    { label: '培训', value: '培训' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetValue" label="目标值" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位" initialValue="%">
                <Select
                  options={[
                    { label: '%', value: '%' },
                    { label: '次', value: '次' },
                    { label: '件', value: '件' },
                    { label: '天', value: '天' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currentValue" label="当前值" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="periodYear" label="年度" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={2020} max={2100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="periodMonth" label="月份">
                <InputNumber style={{ width: '100%' }} min={1} max={12} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="period" label="周期" initialValue="monthly">
                <Select
                  options={[
                    { label: '月度', value: 'monthly' },
                    { label: '季度', value: 'quarterly' },
                    { label: '年度', value: 'yearly' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select
                  options={[
                    { label: '进行中', value: 'active' },
                    { label: '已达成', value: 'achieved' },
                    { label: '已关闭', value: 'closed' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="responsible" label="责任人">
            <Input placeholder="如：张三" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <Text type="secondary">
          数据快照时间: {data.snapshotDate ? new Date(data.snapshotDate).toLocaleString() : '-'}
        </Text>
      </div>
    </div>
  );
}
