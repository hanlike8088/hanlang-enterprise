import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Card,
  Tabs,
  Popconfirm,
  message,
  Tag,
  Row,
  Col,
  Typography,
  Statistic,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LineChartOutlined,
  EditOutlined,
  FundOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

interface SpcStudy {
  id: string;
  studyCode: string;
  studyName: string;
  chartType: string;
  characteristic: string;
  specificationLow?: number;
  specificationHigh?: number;
  nominalValue?: number;
  unit: string;
  subgroupSize: number;
  status: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  _count?: { measurements: number };
}

interface SpcChartResult {
  chartType: string;
  xbarData?: {
    labels: string[];
    values: number[];
    mean: number;
    ucl: number;
    lcl: number;
    usl?: number;
    lsl?: number;
  };
  rangeData?: { labels: string[]; values: number[]; mean: number; ucl: number; lcl: number };
  xData?: {
    labels: string[];
    values: number[];
    mean: number;
    ucl: number;
    lcl: number;
    usl?: number;
    lsl?: number;
  };
  mrData?: { labels: string[]; values: number[]; mean: number; ucl: number; lcl: number };
  data?: {
    labels: string[];
    values: number[];
    mean: number;
    ucl: number;
    lcl: number;
    usl?: number;
    lsl?: number;
  };
  summary?: any;
}

const CHART_TYPE_LABELS: Record<string, string> = {
  'xbar-r': 'X-bar / R 控制图',
  'xbar-s': 'X-bar / S 控制图',
  'x-mr': 'I-MR 单值移动极差图',
  'p-chart': 'P 控制图（不合格品率）',
  'np-chart': 'NP 控制图（不合格品数）',
};

export default function SPCPage() {
  const [studies, setStudies] = useState<SpcStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<SpcStudy | null>(null);
  const [form] = Form.useForm();
  const [selectedStudy, setSelectedStudy] = useState<SpcStudy | null>(null);
  const [chartData, setChartData] = useState<SpcChartResult | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Measurement entry state
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [measureForm] = Form.useForm();
  const [measureBatchForm] = Form.useForm();
  const [batchMode, setBatchMode] = useState(false);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/spc/studies');
      setStudies(res.data);
    } catch {
      message.error('获取SPC研究列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  useEffect(() => {
    if (selectedStudy) {
      fetchChart(selectedStudy.id);
    }
  }, [selectedStudy?.id]);

  const fetchChart = async (studyId: string) => {
    setChartLoading(true);
    try {
      const res = await axios.get(`/api/spc/studies/${studyId}/chart`);
      setChartData(res.data);
    } catch {
      message.error('计算控制图失败');
    } finally {
      setChartLoading(false);
    }
  };

  const handleSaveStudy = async () => {
    try {
      const values = await form.validateFields();
      if (editingStudy) {
        await axios.put(`/api/spc/studies/${editingStudy.id}`, values);
        message.success('SPC研究已更新');
      } else {
        await axios.post('/api/spc/studies', values);
        message.success('SPC研究已创建');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingStudy(null);
      fetchStudies();
    } catch {
      /* validation error */
    }
  };

  const handleDeleteStudy = async (id: string) => {
    try {
      await axios.delete(`/api/spc/studies/${id}`);
      message.success('已删除');
      if (selectedStudy?.id === id) setSelectedStudy(null);
      fetchStudies();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddMeasurement = async () => {
    if (!selectedStudy) return;
    try {
      const values = await measureForm.validateFields();
      await axios.post(`/api/spc/studies/${selectedStudy.id}/measurements`, values);
      message.success('测量数据已添加');
      measureForm.resetFields();
      setMeasureModalOpen(false);
      fetchChart(selectedStudy.id);
    } catch {
      /* validation error */
    }
  };

  const handleAddBatch = async () => {
    if (!selectedStudy) return;
    try {
      const values = await measureBatchForm.validateFields();
      const { subgroupNo, samples } = values;
      const measurements = samples.map((v: number, i: number) => ({
        subgroupNo,
        sampleNo: i + 1,
        measuredValue: v,
      }));
      await axios.post(`/api/spc/studies/${selectedStudy.id}/measurements/batch`, { measurements });
      message.success(`已批量添加第 ${subgroupNo} 组测量数据`);
      measureBatchForm.resetFields();
      fetchChart(selectedStudy.id);
    } catch {
      /* validation error */
    }
  };

  const columns = [
    { title: '研究编号', dataIndex: 'studyCode', width: 100 },
    { title: '研究名称', dataIndex: 'studyName', width: 140 },
    {
      title: '图表类型',
      dataIndex: 'chartType',
      width: 100,
      render: (t: string) => CHART_TYPE_LABELS[t] || t,
    },
    { title: '特性', dataIndex: 'characteristic', width: 100 },
    {
      title: '规格/单位',
      width: 100,
      render: (_: any, r: SpcStudy) => {
        const lo = r.specificationLow !== undefined ? r.specificationLow : '-';
        const hi = r.specificationHigh !== undefined ? r.specificationHigh : '-';
        return `${lo} ~ ${hi} ${r.unit}`;
      },
    },
    { title: '子组大小', dataIndex: 'subgroupSize', width: 70 },
    { title: '测量数', width: 70, render: (_: any, r: SpcStudy) => r._count?.measurements ?? 0 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag>,
    },
    { title: '创建人', dataIndex: 'createdBy', width: 80 },
    {
      title: '操作',
      width: 100,
      render: (_: any, r: SpcStudy) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingStudy(r);
              form.setFieldsValue(r);
              setModalOpen(true);
            }}
          />
          <Popconfirm title="确定删除?" onConfirm={() => handleDeleteStudy(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Build chart data for Recharts
  const xbarChartPoints = useMemo(() => {
    if (!chartData?.xbarData) return [];
    return chartData.xbarData.labels.map((l, i) => ({
      label: l,
      value: chartData.xbarData!.values[i],
      mean: chartData.xbarData!.mean,
      ucl: chartData.xbarData!.ucl,
      lcl: chartData.xbarData!.lcl,
      usl: chartData.xbarData!.usl,
      lsl: chartData.xbarData!.lsl,
    }));
  }, [chartData]);

  const rangeChartPoints = useMemo(() => {
    if (!chartData?.rangeData) return [];
    return chartData.rangeData.labels.map((l, i) => ({
      label: l,
      value: chartData.rangeData!.values[i],
      mean: chartData.rangeData!.mean,
      ucl: chartData.rangeData!.ucl,
      lcl: chartData.rangeData!.lcl,
    }));
  }, [chartData]);

  const xChartPoints = useMemo(() => {
    if (!chartData?.xData) return [];
    return chartData.xData.labels.map((l, i) => ({
      label: l,
      value: chartData.xData!.values[i],
      mean: chartData.xData!.mean,
      ucl: chartData.xData!.ucl,
      lcl: chartData.xData!.lcl,
      usl: chartData.xData!.usl,
      lsl: chartData.xData!.lsl,
    }));
  }, [chartData]);

  const mrChartPoints = useMemo(() => {
    if (!chartData?.mrData) return [];
    return chartData.mrData.labels.map((l, i) => ({
      label: l,
      value: chartData.mrData!.values[i],
      mean: chartData.mrData!.mean,
      ucl: chartData.mrData!.ucl,
      lcl: chartData.mrData!.lcl,
    }));
  }, [chartData]);

  const attrChartPoints = useMemo(() => {
    if (!chartData?.data) return [];
    return chartData.data.labels.map((l, i) => ({
      label: l,
      value: chartData.data!.values[i],
      mean: chartData.data!.mean,
      ucl: chartData.data!.ucl,
      lcl: chartData.data!.lcl,
      usl: chartData.data!.usl,
      lsl: chartData.data!.lsl,
    }));
  }, [chartData]);

  const isAttribute =
    chartData?.chartType?.endsWith('-chart') ||
    chartData?.chartType === 'p-chart' ||
    chartData?.chartType === 'np-chart';

  return (
    <div style={{ padding: 16 }}>
      <Title level={4}>
        <FundOutlined /> SPC 统计过程控制
      </Title>

      <Tabs
        defaultActiveKey="studies"
        items={[
          {
            key: 'studies',
            label: 'SPC 研究列表',
            children: (
              <Card
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingStudy(null);
                      form.resetFields();
                      setModalOpen(true);
                    }}
                  >
                    新建研究
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={studies}
                  loading={loading}
                  size="small"
                  pagination={{ pageSize: 20 }}
                  onRow={(record) => ({
                    onClick: () => {
                      if (selectedStudy?.id !== record.id) setSelectedStudy(record);
                    },
                    style: {
                      cursor: 'pointer',
                      background: selectedStudy?.id === record.id ? '#e6f7ff' : undefined,
                    },
                  })}
                />
              </Card>
            ),
          },
          {
            key: 'chart',
            label: selectedStudy ? `控制图: ${selectedStudy.studyName}` : '控制图',
            disabled: !selectedStudy,
            children: selectedStudy ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={4}>
                    <Statistic title="研究编号" value={selectedStudy.studyCode} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="研究名称" value={selectedStudy.studyName} />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="图表类型"
                      value={CHART_TYPE_LABELS[selectedStudy.chartType] || selectedStudy.chartType}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic title="特性" value={selectedStudy.characteristic} />
                  </Col>
                  {chartData?.summary?.cp !== undefined && (
                    <Col span={3}>
                      <Statistic title="Cp" value={chartData.summary.cp} precision={2} />
                    </Col>
                  )}
                  {chartData?.summary?.cpk !== undefined && (
                    <Col span={3}>
                      <Statistic
                        title="Cpk"
                        value={chartData.summary.cpk}
                        precision={2}
                        valueStyle={{ color: chartData.summary.cpk < 1.33 ? '#cf1322' : '#3f8600' }}
                      />
                    </Col>
                  )}
                </Row>

                {chartLoading ? (
                  <Text>计算中...</Text>
                ) : (
                  <div>
                    {isAttribute && attrChartPoints.length > 0 && (
                      <Card title="控制图" size="small" style={{ marginBottom: 16 }}>
                        <ResponsiveContainer width="100%" height={340}>
                          <LineChart data={attrChartPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <ReferenceLine
                              y={attrChartPoints[0].mean}
                              stroke="#faad14"
                              strokeDasharray="5 5"
                              label="Mean"
                            />
                            <ReferenceLine
                              y={attrChartPoints[0].ucl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="UCL"
                            />
                            <ReferenceLine
                              y={attrChartPoints[0].lcl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="LCL"
                            />
                            {attrChartPoints[0].usl && (
                              <ReferenceLine
                                y={attrChartPoints[0].usl}
                                stroke="#722ed1"
                                strokeDasharray="4 4"
                                label="USL"
                              />
                            )}
                            {attrChartPoints[0].lsl && (
                              <ReferenceLine
                                y={attrChartPoints[0].lsl}
                                stroke="#722ed1"
                                strokeDasharray="4 4"
                                label="LSL"
                              />
                            )}
                            <Line
                              name="测量值"
                              type="monotone"
                              dataKey="value"
                              stroke="#1890ff"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {xbarChartPoints.length > 0 && (
                      <Card
                        title="X-bar 控制图（均值图）"
                        size="small"
                        style={{ marginBottom: 16 }}
                      >
                        <ResponsiveContainer width="100%" height={340}>
                          <LineChart data={xbarChartPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <ReferenceLine
                              y={xbarChartPoints[0].mean}
                              stroke="#faad14"
                              strokeDasharray="5 5"
                              label="CL"
                            />
                            <ReferenceLine
                              y={xbarChartPoints[0].ucl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="UCL"
                            />
                            <ReferenceLine
                              y={xbarChartPoints[0].lcl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="LCL"
                            />
                            {xbarChartPoints[0].usl && (
                              <ReferenceLine
                                y={xbarChartPoints[0].usl}
                                stroke="#722ed1"
                                strokeDasharray="4 4"
                                label="USL"
                              />
                            )}
                            {xbarChartPoints[0].lsl && (
                              <ReferenceLine
                                y={xbarChartPoints[0].lsl}
                                stroke="#722ed1"
                                strokeDasharray="4 4"
                                label="LSL"
                              />
                            )}
                            <Line
                              name="X-bar"
                              type="monotone"
                              dataKey="value"
                              stroke="#1890ff"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                            <Line
                              name="CL"
                              type="monotone"
                              dataKey="mean"
                              stroke="#faad14"
                              strokeWidth={1}
                              dot={false}
                              legendType="none"
                            />
                            <Line
                              name="UCL"
                              type="monotone"
                              dataKey="ucl"
                              stroke="#ff4d4f"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                              dot={false}
                              legendType="none"
                            />
                            <Line
                              name="LCL"
                              type="monotone"
                              dataKey="lcl"
                              stroke="#ff4d4f"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                              dot={false}
                              legendType="none"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {rangeChartPoints.length > 0 && (
                      <Card title="R 控制图（极差图）" size="small" style={{ marginBottom: 16 }}>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={rangeChartPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <ReferenceLine
                              y={rangeChartPoints[0].mean}
                              stroke="#faad14"
                              strokeDasharray="5 5"
                              label="CL"
                            />
                            <ReferenceLine
                              y={rangeChartPoints[0].ucl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="UCL"
                            />
                            <ReferenceLine
                              y={rangeChartPoints[0].lcl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="LCL"
                            />
                            <Bar name="Range" dataKey="value" fill="#52c41a" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {xChartPoints.length > 0 && (
                      <Card title="I 控制图（单值图）" size="small" style={{ marginBottom: 16 }}>
                        <ResponsiveContainer width="100%" height={340}>
                          <LineChart data={xChartPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <ReferenceLine
                              y={xChartPoints[0].mean}
                              stroke="#faad14"
                              strokeDasharray="5 5"
                              label="CL"
                            />
                            <ReferenceLine
                              y={xChartPoints[0].ucl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="UCL"
                            />
                            <ReferenceLine
                              y={xChartPoints[0].lcl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="LCL"
                            />
                            {xChartPoints[0].usl && (
                              <ReferenceLine
                                y={xChartPoints[0].usl}
                                stroke="#722ed1"
                                strokeDasharray="4 4"
                                label="USL"
                              />
                            )}
                            {xChartPoints[0].lsl && (
                              <ReferenceLine
                                y={xChartPoints[0].lsl}
                                stroke="#722ed1"
                                strokeDasharray="4 4"
                                label="LSL"
                              />
                            )}
                            <Line
                              name="X"
                              type="monotone"
                              dataKey="value"
                              stroke="#1890ff"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {mrChartPoints.length > 0 && (
                      <Card
                        title="MR 控制图（移动极差图）"
                        size="small"
                        style={{ marginBottom: 16 }}
                      >
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={mrChartPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <ReferenceLine
                              y={mrChartPoints[0].mean}
                              stroke="#faad14"
                              strokeDasharray="5 5"
                              label="CL"
                            />
                            <ReferenceLine
                              y={mrChartPoints[0].ucl}
                              stroke="red"
                              strokeDasharray="3 3"
                              label="UCL"
                            />
                            <Bar name="MR" dataKey="value" fill="#fa8c16" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {chartData?.summary && (
                      <Card title="统计摘要" size="small">
                        <Row gutter={12}>
                          {Object.entries(chartData.summary).map(([k, v]) => (
                            <Col key={k} span={4}>
                              <Statistic
                                title={k}
                                value={typeof v === 'number' ? v.toFixed(4) : String(v)}
                              />
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Empty description="请先在研究列表中选中一个研究" />
            ),
          },
          {
            key: 'data',
            label: '数据录入',
            disabled: !selectedStudy,
            children: selectedStudy ? (
              <Card
                title={`向 [${selectedStudy.studyName}] 添加测量数据`}
                extra={
                  <Button onClick={() => setBatchMode(!batchMode)}>
                    {batchMode ? '单次录入' : '批量录入（整组）'}
                  </Button>
                }
              >
                {batchMode ? (
                  <Form form={measureBatchForm} layout="inline" onFinish={handleAddBatch}>
                    <Form.Item name="subgroupNo" label="子组号" rules={[{ required: true }]}>
                      <InputNumber min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item
                      name="samples"
                      label="样本值（逗号分隔）"
                      rules={[{ required: true }]}
                    >
                      <Input
                        placeholder="如: 10.2, 10.5, 10.1, 10.3, 10.4"
                        style={{ width: 280 }}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        批量提交
                      </Button>
                    </Form.Item>
                  </Form>
                ) : (
                  <Form form={measureForm} layout="inline" onFinish={handleAddMeasurement}>
                    <Form.Item name="subgroupNo" label="子组号" rules={[{ required: true }]}>
                      <InputNumber min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item name="sampleNo" label="样本号" rules={[{ required: true }]}>
                      <InputNumber
                        min={1}
                        max={selectedStudy.subgroupSize || 25}
                        style={{ width: 80 }}
                      />
                    </Form.Item>
                    <Form.Item name="measuredValue" label="测量值" rules={[{ required: true }]}>
                      <InputNumber step={0.001} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item name="note" label="备注">
                      <Input style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        提交
                      </Button>
                    </Form.Item>
                  </Form>
                )}
                {chartData && (
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">
                      已录子组数:{' '}
                      {chartData.summary?.subgroupCount ?? chartData.summary?.count ?? 0}
                    </Text>
                  </div>
                )}
              </Card>
            ) : (
              <Empty description="请先选择研究" />
            ),
          },
        ]}
        onChange={(key) => {
          if (key === 'studies') fetchStudies();
        }}
      />

      {/* Study Create/Edit Modal */}
      <Modal
        title={editingStudy ? '编辑 SPC 研究' : '新建 SPC 研究'}
        open={modalOpen}
        onOk={handleSaveStudy}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingStudy(null);
        }}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="studyName" label="研究名称" rules={[{ required: true }]}>
            <Input placeholder="如: 漆包线线径X-bar R控制图" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="chartType"
                label="图表类型"
                initialValue="xbar-r"
                rules={[{ required: true }]}
              >
                <Select>
                  {Object.entries(CHART_TYPE_LABELS).map(([k, v]) => (
                    <Option key={k} value={k}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="characteristic" label="质量特性" rules={[{ required: true }]}>
                <Input placeholder="如: 线径" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="specificationLow" label="规格下限">
                <InputNumber step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="specificationHigh" label="规格上限">
                <InputNumber step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="nominalValue" label="公称值">
                <InputNumber step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unit" label="单位" initialValue="mm">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="subgroupSize"
            label="子组大小 (n)"
            initialValue={5}
            rules={[{ required: true }]}
          >
            <InputNumber min={2} max={25} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="archived">归档</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
