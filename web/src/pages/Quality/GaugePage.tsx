import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Card,
  Tag,
  message,
  Popconfirm,
  Tabs,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Statistic,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  WarningOutlined,
  ToolOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { qualityApi } from '../../services/api';
import dayjs from 'dayjs';

const gaugeStatusColors: Record<string, string> = {
  使用中: 'green',
  维修中: 'orange',
  停用: 'default',
  报废: 'red',
};
const calResultColors: Record<string, string> = { 合格: 'green', 不合格: 'red' };

export default function GaugePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('list');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const [calModalOpen, setCalModalOpen] = useState(false);
  const [calGaugeId, setCalGaugeId] = useState<string>('');
  const [calForm] = Form.useForm();

  const [warnings, setWarnings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  const fetch = async () => {
    setLoading(true);
    try {
      const [d, s, w] = await Promise.all([
        qualityApi.getGauges(statusFilter, keyword || undefined),
        qualityApi.getStats(),
        qualityApi.getGaugeWarnings(),
      ]);
      setData(d);
      setStats(s);
      setWarnings(w);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, [keyword, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: '使用中', calibrationCycle: 12 });
    setModalOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      lastCalibrationDate: r.lastCalibrationDate ? dayjs(r.lastCalibrationDate) : undefined,
      nextCalibrationDate: r.nextCalibrationDate ? dayjs(r.nextCalibrationDate) : undefined,
    });
    setModalOpen(true);
  };
  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      ...v,
      lastCalibrationDate: v.lastCalibrationDate ? v.lastCalibrationDate.toISOString() : undefined,
    };
    if (editing) {
      await qualityApi.updateGauge(editing.id, payload);
      message.success('已更新');
    } else {
      await qualityApi.createGauge(payload);
      message.success('已创建');
    }
    setModalOpen(false);
    fetch();
  };
  const remove = async (id: string) => {
    await qualityApi.deleteGauge(id);
    message.success('已删除');
    fetch();
  };

  const viewDetail = async (r: any) => {
    const d = await qualityApi.getGauge(r.id);
    setDetail(d);
    setDetailOpen(true);
  };

  const openCalibration = (id: string) => {
    setCalGaugeId(id);
    calForm.resetFields();
    calForm.setFieldsValue({ calibrationDate: dayjs(), result: '合格' });
    setCalModalOpen(true);
  };
  const submitCalibration = async () => {
    const v = await calForm.validateFields();
    const payload = { ...v, calibrationDate: v.calibrationDate.toISOString() };
    await qualityApi.createCalibration(calGaugeId, payload);
    message.success('校准记录已保存');
    setCalModalOpen(false);
    fetch();
  };

  const columns = [
    { title: '编号', dataIndex: 'gaugeCode', width: 110 },
    { title: '名称', dataIndex: 'gaugeName', width: 120 },
    { title: '型号', dataIndex: 'modelNo', width: 100, render: (v: string) => v || '-' },
    { title: '厂商', dataIndex: 'manufacturer', width: 100, render: (v: string) => v || '-' },
    { title: '序列号', dataIndex: 'serialNo', width: 110, render: (v: string) => v || '-' },
    { title: '位置', dataIndex: 'location', width: 80, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (s: string) => <Tag color={gaugeStatusColors[s]}>{s}</Tag>,
    },
    { title: '校准周期(月)', dataIndex: 'calibrationCycle', width: 90 },
    {
      title: '上次校准',
      dataIndex: 'lastCalibrationDate',
      width: 110,
      render: (v: string) => (v ? v.split('T')[0] : '-'),
    },
    {
      title: '下次校准',
      dataIndex: 'nextCalibrationDate',
      width: 110,
      render: (v: string) => {
        if (!v) return '-';
        const d = new Date(v);
        const now = new Date();
        const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Tag color={diff < 0 ? 'red' : diff < 30 ? 'orange' : 'green'}>{v.split('T')[0]}</Tag>
        );
      },
    },
    {
      title: '最近校准结果',
      dataIndex: 'records',
      width: 100,
      render: (rs: any[]) =>
        rs?.length > 0 ? <Tag color={calResultColors[rs[0]?.result]}>{rs[0]?.result}</Tag> : '-',
    },
    {
      title: '操作',
      key: 'act',
      width: 220,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => viewDetail(r)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CalendarOutlined />}
            onClick={() => openCalibration(r.id)}
          >
            校准
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
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

  const warnColumns = [
    { title: '编号', dataIndex: 'gaugeCode', width: 110 },
    { title: '名称', dataIndex: 'gaugeName', width: 120 },
    {
      title: '下次校准',
      dataIndex: 'nextCalibrationDate',
      width: 110,
      render: (v: string) => {
        if (!v) return '-';
        const diff = Math.ceil((new Date(v).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <Tag color={diff < 0 ? 'red' : 'orange'}>
            {v.split('T')[0]} ({diff < 0 ? '已超期' : `${diff}天后到期`})
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (s: string) => <Tag color={gaugeStatusColors[s]}>{s}</Tag>,
    },
  ];

  return (
    <Card title="量具/仪器管理" bodyStyle={{ padding: 0 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: '量具台账',
            children: (
              <>
                <Row gutter={16} style={{ padding: 16 }}>
                  <Col span={6}>
                    <Statistic title="总量具" value={stats.gaugeTotal || 0} />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="校准预警"
                      value={stats.gaugeWarnings || 0}
                      valueStyle={{ color: stats.gaugeWarnings > 0 ? '#ff4d4f' : undefined }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="NCR待评审"
                      value={stats.ncrPending || 0}
                      valueStyle={{ color: stats.ncrPending > 0 ? '#faad14' : undefined }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic title="CAPA开放" value={stats.capaOpen || 0} />
                  </Col>
                </Row>
                <Space style={{ padding: '0 16px', marginBottom: 12 }}>
                  <Input.Search
                    placeholder="搜索名称/编号/序列号"
                    allowClear
                    onSearch={setKeyword}
                    style={{ width: 240 }}
                  />
                  <Select
                    placeholder="状态"
                    allowClear
                    style={{ width: 110 }}
                    onChange={setStatusFilter}
                    options={['使用中', '维修中', '停用', '报废'].map((v) => ({
                      label: v,
                      value: v,
                    }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    新增量具
                  </Button>
                </Space>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  loading={loading}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'warnings',
            label: `校准预警 (${warnings.length})`,
            children: (
              <Table columns={warnColumns} dataSource={warnings} rowKey="id" size="small" />
            ),
          },
        ]}
      />

      {/* Gauge Modal */}
      <Modal
        title={editing ? '编辑量具' : '新增量具'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="gaugeName" label="量具名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="modelNo" label="型号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturer" label="厂商">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serialNo" label="序列号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="存放位置">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select
                  options={['使用中', '维修中', '停用', '报废'].map((v) => ({
                    label: v,
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="calibrationCycle" label="校准周期(月)">
                <InputNumber style={{ width: '100%' }} min={1} max={60} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lastCalibrationDate" label="上次校准日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="量具详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="编号">{detail.gaugeCode}</Descriptions.Item>
              <Descriptions.Item label="名称">{detail.gaugeName}</Descriptions.Item>
              <Descriptions.Item label="型号">{detail.modelNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="厂商">{detail.manufacturer || '-'}</Descriptions.Item>
              <Descriptions.Item label="序列号">{detail.serialNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="位置">{detail.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={gaugeStatusColors[detail.status]}>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="校准周期">{detail.calibrationCycle} 月</Descriptions.Item>
              <Descriptions.Item label="上次校准">
                {detail.lastCalibrationDate ? detail.lastCalibrationDate.split('T')[0] : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下次校准">
                {detail.nextCalibrationDate ? detail.nextCalibrationDate.split('T')[0] : '-'}
              </Descriptions.Item>
            </Descriptions>
            {detail.records?.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>校准历史</h4>
                <Table
                  dataSource={detail.records}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: '日期',
                      dataIndex: 'calibrationDate',
                      render: (v: string) => v.split('T')[0],
                    },
                    {
                      title: '结果',
                      dataIndex: 'result',
                      render: (s: string) => <Tag color={calResultColors[s]}>{s}</Tag>,
                    },
                    { title: '机构', dataIndex: 'agency' },
                    { title: '证书号', dataIndex: 'certificateNo' },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>

      {/* Calibration Modal */}
      <Modal
        title="校准记录"
        open={calModalOpen}
        onOk={submitCalibration}
        onCancel={() => setCalModalOpen(false)}
      >
        <Form form={calForm} layout="vertical">
          <Form.Item name="calibrationDate" label="校准日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="result" label="校准结果" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '合格', value: '合格' },
                { label: '不合格', value: '不合格' },
              ]}
            />
          </Form.Item>
          <Form.Item name="agency" label="校准机构">
            <Input />
          </Form.Item>
          <Form.Item name="certificateNo" label="证书编号">
            <Input />
          </Form.Item>
          <Form.Item name="calibratedBy" label="校准人">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
