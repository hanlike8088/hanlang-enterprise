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
  CheckCircleOutlined,
  WarningOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { qualityApi } from '../../services/api';

const statusColors: Record<string, string> = {
  待检: 'blue',
  合格: 'green',
  不合格: 'red',
  已处置: 'purple',
};
const resultColors: Record<string, string> = { 合格: 'green', 不合格: 'red', 待判: 'default' };
const dispColors: Record<string, string> = { 让步接收: 'orange', 退货: 'red', 降级使用: 'blue' };

export default function IQCPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [standards, setStandards] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('list');

  // Standards
  const [stdModalOpen, setStdModalOpen] = useState(false);
  const [editingStd, setEditingStd] = useState<any>(null);
  const [stdForm] = Form.useForm();

  // Incoming
  const [incModalOpen, setIncModalOpen] = useState(false);
  const [editingInc, setEditingInc] = useState<any>(null);
  const [incForm] = Form.useForm();

  // Inspection & Detail
  const [inspModalOpen, setInspModalOpen] = useState(false);
  const [inspIncoming, setInspIncoming] = useState<any>(null);
  const [inspForm] = Form.useForm();
  const [inspItems, setInspItems] = useState<any[]>([]);

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  // Disposition
  const [dispModalOpen, setDispModalOpen] = useState(false);
  const [dispIncomingId, setDispIncomingId] = useState<string>('');
  const [dispForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        qualityApi.getIncomings(statusFilter, undefined, keyword || undefined),
        qualityApi.getIqcStats(),
      ]);
      setData(d);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };
  const fetchStandards = async () => {
    const s = await qualityApi.getStandards();
    setStandards(s);
  };
  useEffect(() => {
    fetchData();
    if (activeTab === 'standards') fetchStandards();
  }, [keyword, statusFilter]);
  useEffect(() => {
    if (activeTab === 'standards') fetchStandards();
  }, [activeTab]);

  // Standards CRUD
  const openStdCreate = () => {
    setEditingStd(null);
    stdForm.resetFields();
    setStdModalOpen(true);
  };
  const openStdEdit = (r: any) => {
    setEditingStd(r);
    stdForm.setFieldsValue(r);
    setStdModalOpen(true);
  };
  const submitStd = async () => {
    const v = await stdForm.validateFields();
    if (editingStd) {
      await qualityApi.updateStandard(editingStd.id, v);
      message.success('已更新');
    } else {
      await qualityApi.createStandard(v);
      message.success('已创建');
    }
    setStdModalOpen(false);
    fetchStandards();
  };
  const removeStd = async (id: string) => {
    await qualityApi.deleteStandard(id);
    message.success('已删除');
    fetchStandards();
  };

  // Incoming CRUD
  const openIncCreate = () => {
    setEditingInc(null);
    incForm.resetFields();
    incForm.setFieldsValue({ quantity: 0, unit: '个' });
    setIncModalOpen(true);
  };
  const submitInc = async () => {
    const v = await incForm.validateFields();
    if (editingInc) {
      await qualityApi.updateIncoming(editingInc.id, v);
      message.success('已更新');
    } else {
      await qualityApi.createIncoming(v);
      message.success('已创建');
    }
    setIncModalOpen(false);
    fetchData();
  };

  // Inspection
  const openInspection = async (r: any) => {
    setInspIncoming(r);
    setInspModalOpen(true);
    const stds = await qualityApi.getStandards(r.materialId);
    const items = stds.map((s: any) => ({ ...s, measuredValue: null }));
    setInspItems(items);
    inspForm.resetFields();
  };
  const submitInspection = async () => {
    const items = inspItems.map((it: any) => ({ ...it, measuredValue: it.measuredValue }));
    if ((items || []).some((i: any) => i.measuredValue == null)) {
      message.warning('请完成所有检验项目的测量值录入');
      return;
    }
    const result = await qualityApi.submitInspection(inspIncoming.id, items, '质检员');
    message.success(result.hasFail ? '检验完成: 判定为不合格' : '检验完成: 判定为合格');
    setInspModalOpen(false);
    fetchData();
  };
  const updateReading = (index: number, value: number | null) => {
    const items = [...inspItems];
    items[index].measuredValue = value;
    // Auto judge
    if (value != null) {
      const item = items[index];
      if (item.specLower != null && value < item.specLower) items[index]._result = '不合格';
      else if (item.specUpper != null && value > item.specUpper) items[index]._result = '不合格';
      else items[index]._result = '合格';
    } else {
      items[index]._result = '待判';
    }
    setInspItems(items);
  };

  // Detail
  const viewDetail = async (r: any) => {
    const d = await qualityApi.getIncoming(r.id);
    setDetail(d);
    setDetailOpen(true);
  };

  // Disposition
  const openDisposition = (id: string) => {
    setDispIncomingId(id);
    dispForm.resetFields();
    dispForm.setFieldsValue({ disposition: '退货' });
    setDispModalOpen(true);
  };
  const submitDisposition = async () => {
    const v = await dispForm.validateFields();
    await qualityApi.createDisposition(dispIncomingId, v);
    message.success('不合格品已处置');
    setDispModalOpen(false);
    fetchData();
  };

  const stdColumns = [
    { title: '物料编码', dataIndex: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', width: 120 },
    { title: '检验项目', dataIndex: 'itemName', width: 120 },
    { title: '规格下限', dataIndex: 'specLower', width: 90 },
    { title: '规格上限', dataIndex: 'specUpper', width: 90 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: 'AQL', dataIndex: 'aql', width: 60, render: (v: string) => v || '-' },
    { title: '检验方法', dataIndex: 'testMethod', width: 100, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'act',
      width: 120,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openStdEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => removeStd(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const incColumns = [
    { title: '检验单号', dataIndex: 'inspectionCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', width: 120 },
    { title: '物料编码', dataIndex: 'materialCode', width: 120, render: (v: string) => v || '-' },
    { title: '供应商', dataIndex: 'supplierName', width: 120, render: (v: string) => v || '-' },
    { title: '批次', dataIndex: 'batchNo', width: 100, render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '单位', dataIndex: 'unit', width: 50 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'act',
      width: 280,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => viewDetail(r)}>
            详情
          </Button>
          {(r.status === '待检' || r.status === '不合格') && !r.disposition && (
            <Button
              type="link"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => openInspection(r)}
            >
              检验
            </Button>
          )}
          {r.status === '不合格' && !r.disposition && (
            <Button
              type="link"
              size="small"
              icon={<WarningOutlined />}
              onClick={() => openDisposition(r.id)}
            >
              处置
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingInc(r);
              incForm.setFieldsValue({
                ...r,
                arrivalDate: r.arrivalDate ? r.arrivalDate.split('T')[0] : undefined,
              });
              setIncModalOpen(true);
            }}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="来料检验 IQC" bodyStyle={{ padding: 0 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: '来料检验',
            children: (
              <>
                <Row gutter={16} style={{ padding: 16 }}>
                  <Col span={6}>
                    <Statistic
                      title="待检总数"
                      value={stats.byStatus?.find((s: any) => s.status === '待检')?._count || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="合格"
                      value={stats.byStatus?.find((s: any) => s.status === '合格')?._count || 0}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="不合格"
                      value={stats.byStatus?.find((s: any) => s.status === '不合格')?._count || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="已处置"
                      value={stats.byStatus?.find((s: any) => s.status === '已处置')?._count || 0}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                </Row>
                <Space style={{ padding: '0 16px', marginBottom: 12 }}>
                  <Input.Search
                    placeholder="搜索物料/供应商"
                    allowClear
                    onSearch={setKeyword}
                    style={{ width: 220 }}
                  />
                  <Select
                    placeholder="状态"
                    allowClear
                    style={{ width: 110 }}
                    onChange={setStatusFilter}
                    options={['待检', '合格', '不合格', '已处置'].map((v) => ({
                      label: v,
                      value: v,
                    }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={openIncCreate}>
                    来料登记
                  </Button>
                </Space>
                <Table
                  columns={incColumns}
                  dataSource={data}
                  rowKey="id"
                  loading={loading}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'standards',
            label: '检验标准',
            children: (
              <>
                <Space style={{ padding: '16px', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openStdCreate}>
                    新增标准
                  </Button>
                </Space>
                <Table columns={stdColumns} dataSource={standards} rowKey="id" size="small" />
              </>
            ),
          },
        ]}
      />

      {/* Standard Modal */}
      <Modal
        title={editingStd ? '编辑检验标准' : '新增检验标准'}
        open={stdModalOpen}
        onOk={submitStd}
        onCancel={() => setStdModalOpen(false)}
      >
        <Form form={stdForm} layout="vertical">
          <Form.Item name="materialId" label="物料ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="materialCode" label="物料编码">
            <Input />
          </Form.Item>
          <Form.Item name="itemName" label="检验项目" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="specLower" label="规格下限">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specUpper" label="规格上限">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="aql" label="AQL">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="testMethod" label="检验方法">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Incoming Modal */}
      <Modal
        title={editingInc ? '编辑来料登记' : '来料登记'}
        open={incModalOpen}
        onOk={submitInc}
        onCancel={() => setIncModalOpen(false)}
        width={560}
      >
        <Form form={incForm} layout="vertical">
          <Form.Item name="materialId" label="物料ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="materialCode" label="物料编码">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierName" label="供应商">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchNo" label="批次号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label="数量">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="purchaseOrderId" label="采购单号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Inspection Modal */}
      <Modal
        title={`检验录入 - ${inspIncoming?.materialName || ''}`}
        open={inspModalOpen}
        onOk={submitInspection}
        onCancel={() => setInspModalOpen(false)}
        width={800}
        okText="提交检验"
      >
        <Table
          dataSource={inspItems}
          rowKey="itemName"
          size="small"
          pagination={false}
          columns={[
            { title: '检验项目', dataIndex: 'itemName', width: 120 },
            { title: '规格下限', dataIndex: 'specLower', width: 80 },
            { title: '规格上限', dataIndex: 'specUpper', width: 80 },
            { title: '单位', dataIndex: 'unit', width: 60 },
            {
              title: '测量值',
              key: 'reading',
              width: 120,
              render: (_: any, r: any, index: number) => (
                <InputNumber
                  style={{ width: 100 }}
                  value={r.measuredValue}
                  onChange={(v) => updateReading(index, v)}
                />
              ),
            },
            {
              title: '自动判定',
              key: 'result',
              width: 80,
              render: (_: any, r: any) => (
                <Tag color={resultColors[r._result]}>{r._result || '待判'}</Tag>
              ),
            },
          ]}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="来料检验详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="检验单号">{detail.inspectionCode}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[detail.status]}>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="物料名称">{detail.materialName}</Descriptions.Item>
              <Descriptions.Item label="供应商">{detail.supplierName || '-'}</Descriptions.Item>
              <Descriptions.Item label="批次">{detail.batchNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="数量">
                {detail.quantity} {detail.unit}
              </Descriptions.Item>
            </Descriptions>
            {detail.records?.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>检验记录</h4>
                <Table
                  dataSource={detail.records}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '项目', dataIndex: 'itemName' },
                    { title: '下限', dataIndex: 'specLower' },
                    { title: '上限', dataIndex: 'specUpper' },
                    { title: '测量值', dataIndex: 'measuredValue' },
                    {
                      title: '判定',
                      dataIndex: 'result',
                      render: (s: string) => <Tag color={resultColors[s]}>{s}</Tag>,
                    },
                  ]}
                />
              </>
            )}
            {detail.disposition && (
              <>
                <h4 style={{ marginTop: 16 }}>不合格处置</h4>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="处置方式">
                    <Tag color={dispColors[detail.disposition.disposition]}>
                      {detail.disposition.disposition}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="处置数量">
                    {detail.disposition.quantity || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="原因" span={2}>
                    {detail.disposition.reason || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Disposition Modal */}
      <Modal
        title="不合格品处置"
        open={dispModalOpen}
        onOk={submitDisposition}
        onCancel={() => setDispModalOpen(false)}
      >
        <Form form={dispForm} layout="vertical">
          <Form.Item name="disposition" label="处置方式" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '让步接收', value: '让步接收' },
                { label: '退货', value: '退货' },
                { label: '降级使用', value: '降级使用' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reason" label="处置原因">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="quantity" label="处置数量">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="approvedBy" label="审批人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
