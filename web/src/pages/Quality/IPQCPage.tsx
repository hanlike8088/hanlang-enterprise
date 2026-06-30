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
  Tabs,
  DatePicker,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { qualityApi } from '../../services/api';
import dayjs from 'dayjs';

const fpStatusColors: Record<string, string> = {
  待检验: 'blue',
  检验中: 'orange',
  合格: 'green',
  不合格: 'red',
};
const planStatusColors: Record<string, string> = {
  待执行: 'blue',
  执行中: 'orange',
  已完成: 'green',
  异常: 'red',
};

export default function IPQCPage() {
  const [activeTab, setActiveTab] = useState('first-piece');
  const [loading, setLoading] = useState(false);

  // First Piece
  const [fpData, setFpData] = useState<any[]>([]);
  const [fpStatusFilter, setFpStatusFilter] = useState<string | undefined>();
  const [fpModalOpen, setFpModalOpen] = useState(false);
  const [editingFp, setEditingFp] = useState<any>(null);
  const [fpForm] = Form.useForm();

  // Patrol
  const [plans, setPlans] = useState<any[]>([]);
  const [planStatusFilter, setPlanStatusFilter] = useState<string | undefined>();
  const [planDate, setPlanDate] = useState<string | undefined>();
  const [patrolModalOpen, setPatrolModalOpen] = useState(false);
  const [patrolPlanId, setPatrolPlanId] = useState<string>('');
  const [patrolForm] = Form.useForm();

  const fetchFp = async () => {
    setLoading(true);
    try {
      const d = await qualityApi.getFirstPieces(fpStatusFilter);
      setFpData(d);
    } finally {
      setLoading(false);
    }
  };
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const d = await qualityApi.getPatrolPlans(planStatusFilter, planDate);
      setPlans(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'first-piece') fetchFp();
  }, [activeTab, fpStatusFilter]);
  useEffect(() => {
    if (activeTab === 'patrol') fetchPlans();
  }, [activeTab, planStatusFilter, planDate]);

  // First Piece CRUD
  const openFpCreate = () => {
    setEditingFp(null);
    fpForm.resetFields();
    fpForm.setFieldsValue({ shift: '白班' });
    setFpModalOpen(true);
  };
  const submitFp = async () => {
    const v = await fpForm.validateFields();
    if (editingFp) {
      await qualityApi.updateFirstPiece(editingFp.id, v);
      message.success('首件已更新');
    } else {
      await qualityApi.createFirstPiece(v);
      message.success('首件已创建');
    }
    setFpModalOpen(false);
    fetchFp();
  };
  const judgeFp = async (r: any, result: string) => {
    await qualityApi.updateFirstPiece(r.id, {
      result,
      status: result === '合格' ? '已完成' : '不合格',
      inspector: '质检员',
    });
    message.success(`首件判定: ${result}`);
    fetchFp();
  };

  // Patrol
  const generatePlans = async () => {
    const res = await qualityApi.generatePatrolPlans(7);
    message.success(`已生成 ${res.length} 个巡检计划`);
    fetchPlans();
  };
  const openPatrolCheck = (plan: any) => {
    setPatrolPlanId(plan.id);
    patrolForm.resetFields();
    patrolForm.setFieldsValue({ productName: plan.productLine });
    setPatrolModalOpen(true);
  };
  const submitPatrolCheck = async () => {
    const v = await patrolForm.validateFields();
    await qualityApi.executePatrolCheck(patrolPlanId, v);
    message.success('巡检已记录');
    setPatrolModalOpen(false);
    fetchPlans();
  };

  const fpColumns = [
    { title: '首件单号', dataIndex: 'inspectionCode', width: 120 },
    { title: '产品名称', dataIndex: 'productName', width: 140 },
    { title: '班次', dataIndex: 'shift', width: 70 },
    { title: '机台', dataIndex: 'machineNo', width: 80, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => <Tag color={fpStatusColors[s]}>{s}</Tag>,
    },
    {
      title: '检验结果',
      dataIndex: 'result',
      width: 80,
      render: (r: string) => (r ? <Tag color={r === '合格' ? 'green' : 'red'}>{r}</Tag> : '-'),
    },
    { title: '备注', dataIndex: 'note', width: 120, ellipsis: true },
    {
      title: '操作',
      key: 'act',
      width: 180,
      render: (_: any, r: any) => (
        <Space size="small">
          {r.status === '待检验' && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => judgeFp(r, '合格')}
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
              >
                合格
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => judgeFp(r, '不合格')}
                icon={<WarningOutlined />}
                danger
              >
                不合格
              </Button>
            </>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingFp(r);
              fpForm.setFieldsValue(r);
              setFpModalOpen(true);
            }}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const planColumns = [
    { title: '计划编号', dataIndex: 'planCode', width: 120 },
    {
      title: '巡检日期',
      dataIndex: 'checkDate',
      width: 110,
      render: (v: string) => (v ? v.split('T')[0] : '-'),
    },
    { title: '班次', dataIndex: 'shift', width: 70 },
    { title: '产线', dataIndex: 'productLine', width: 90, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => <Tag color={planStatusColors[s]}>{s}</Tag>,
    },
    { title: '记录数', dataIndex: 'records', width: 70, render: (rs: any[]) => rs?.length || 0 },
    {
      title: '操作',
      key: 'act',
      width: 120,
      render: (_: any, r: any) =>
        r.status === '待执行' || r.status === '执行中' ? (
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => openPatrolCheck(r)}
          >
            巡检
          </Button>
        ) : null,
    },
  ];

  return (
    <Card title="过程检验 IPQC" bodyStyle={{ padding: 0 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'first-piece',
            label: '首件确认',
            children: (
              <>
                <Space style={{ padding: '16px', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openFpCreate}>
                    新增首件
                  </Button>
                  <Select
                    placeholder="状态"
                    allowClear
                    style={{ width: 110 }}
                    onChange={setFpStatusFilter}
                    options={['待检验', '已完成', '不合格'].map((v) => ({ label: v, value: v }))}
                  />
                </Space>
                <Table
                  columns={fpColumns}
                  dataSource={fpData}
                  rowKey="id"
                  loading={loading}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'patrol',
            label: '巡检管理',
            children: (
              <>
                <Space style={{ padding: '16px', marginBottom: 12 }}>
                  <Button type="primary" icon={<ScheduleOutlined />} onClick={generatePlans}>
                    生成巡检计划(7天)
                  </Button>
                  <Select
                    placeholder="状态"
                    allowClear
                    style={{ width: 110 }}
                    onChange={setPlanStatusFilter}
                    options={['待执行', '执行中', '已完成', '异常'].map((v) => ({
                      label: v,
                      value: v,
                    }))}
                  />
                  <DatePicker
                    onChange={(d) => setPlanDate(d ? d.format('YYYY-MM-DD') : undefined)}
                    placeholder="按日期筛选"
                  />
                </Space>
                <Table
                  columns={planColumns}
                  dataSource={plans}
                  rowKey="id"
                  loading={loading}
                  size="small"
                />
              </>
            ),
          },
        ]}
      />

      {/* First Piece Modal */}
      <Modal
        title={editingFp ? '编辑首件检验' : '新增首件检验'}
        open={fpModalOpen}
        onOk={submitFp}
        onCancel={() => setFpModalOpen(false)}
      >
        <Form form={fpForm} layout="vertical">
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="workOrderId" label="工单号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shift" label="班次">
                <Select
                  options={[
                    { label: '白班', value: '白班' },
                    { label: '夜班', value: '夜班' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="machineNo" label="机台号">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Patrol Check Modal */}
      <Modal
        title="巡检记录"
        open={patrolModalOpen}
        onOk={submitPatrolCheck}
        onCancel={() => setPatrolModalOpen(false)}
      >
        <Form form={patrolForm} layout="vertical">
          <Form.Item name="checkItem" label="检验项目" rules={[{ required: true }]}>
            <Select
              options={['外观检查', '尺寸检查', '电气测试', '噪音测试', '功能测试', '温度测试'].map(
                (v) => ({ label: v, value: v }),
              )}
            />
          </Form.Item>
          <Form.Item name="productName" label="产品/产线">
            <Input />
          </Form.Item>
          <Form.Item name="checkResult" label="检验结果" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '合格', value: '合格' },
                { label: '异常', value: '异常' },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="triggeredNcr" label="触发NCR" valuePropName="checked">
            <Select
              options={[
                { label: '是', value: true },
                { label: '否', value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
