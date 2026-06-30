import WorkflowActions from '../components/WorkflowActions';
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
  Descriptions,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { manufacturingApi } from '../../services/manufacturing';;

const statusColors: Record<string, string> = {
  draft: 'default',
  released: 'blue',
  in_progress: 'processing',
  paused: 'warning',
  completed: 'success',
  closed: 'default',
  cancelled: 'red',
};
const priorityColors: Record<string, string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

export default function WorkOrderPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [detail, setDetail] = useState<any>(null);
  const [reportModal, setReportModal] = useState(false);
  const [reportForm] = Form.useForm();
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [issueModal, setIssueModal] = useState(false);
  const [issueForm] = Form.useForm();
  const [routings, setRoutings] = useState<any[]>([]);
  const [completeModal, setCompleteModal] = useState(false);
  const [completeForm] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      setData(await manufacturingApi.getOrders(statusFilter, undefined, keyword || undefined));
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
    form.setFieldsValue({ status: 'draft', priority: 'normal' });
    manufacturingApi
      .getRoutings()
      .then((rs: any) => setRoutings(rs))
      .catch(() => {});
    setModalOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      plannedStart: r.plannedStart?.split('T')[0],
      plannedEnd: r.plannedEnd?.split('T')[0],
    });
    setModalOpen(true);
  };
  const submit = async () => {
    const v = await form.validateFields();
    if (editing) {
      await manufacturingApi.updateOrder(editing.id, v);
      message.success('工单已更新');
    } else {
      await manufacturingApi.createOrder(v);
      message.success('工单已创建');
    }
    setModalOpen(false);
    fetch();
  };
  const remove = async (id: string) => {
    await manufacturingApi.deleteOrder(id);
    message.success('已删除');
    fetch();
  };
  const transition = async (id: string, toStatus: string) => {
    await manufacturingApi.transitionOrder(id, toStatus);
    message.success('状态已变更');
    fetch();
    setDetail(null);
  };
  const viewDetail = async (r: any) => {
    try {
      setDetail(await manufacturingApi.getOrder(r.id));
    } catch {
      setDetail(r);
    }
  };
  const transitionOp = async (opId: string, toStatus: string) => {
    await manufacturingApi.transitionOperation(opId, toStatus);
    message.success('工序状态已变更');
    if (detail) setDetail(await manufacturingApi.getOrder(detail.id));
  };
  const openReport = (op: any) => {
    setSelectedOp(op);
    reportForm.resetFields();
    reportForm.setFieldsValue({
      operationId: op.id,
      processedQty: 1,
      qualifiedQty: 1,
      defectQty: 0,
    });
    setReportModal(true);
  };
  const submitReport = async () => {
    const v = await reportForm.validateFields();
    await manufacturingApi.reportOperation(v);
    message.success('报工成功');
    setReportModal(false);
    if (detail) setDetail(await manufacturingApi.getOrder(detail.id));
  };
  const openIssue = () => {
    issueForm.resetFields();
    setIssueModal(true);
  };
  const submitIssue = async () => {
    if (!detail) return;
    const v = await issueForm.validateFields();
    await manufacturingApi.issueMaterial(detail.id, v);
    message.success('领料完成');
    setIssueModal(false);
    setDetail(await manufacturingApi.getOrder(detail.id));
  };
  const openComplete = () => {
    completeForm.resetFields();
    setCompleteModal(true);
  };
  const submitComplete = async () => {
    if (!detail) return;
    const v = await completeForm.validateFields().catch(() => null);
    await manufacturingApi.completeOrder(detail.id, v || {});
    message.success('完工入库完成');
    setCompleteModal(false);
    fetch();
    setDetail(null);
  };

  const columns = [
    { title: '工单号', dataIndex: 'orderCode', width: 130 },
    { title: '产品名称', dataIndex: 'productName' },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '已完工', dataIndex: 'completedQty', width: 70 },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 70,
      render: (v: string) => <Tag color={priorityColors[v]}>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
    {
      title: '计划开始',
      dataIndex: 'plannedStart',
      width: 110,
      render: (v: any) => v?.split('T')[0],
    },
    {
      title: '计划结束',
      dataIndex: 'plannedEnd',
      width: 110,
      render: (v: any) => v?.split('T')[0],
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<SearchOutlined />} onClick={() => viewDetail(r)}>
            明细
          </Button>
          {r.status === 'draft' && (
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => transition(r.id, 'released')}
            >
              发布
            </Button>
          )}
          {r.status === 'released' && (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => transition(r.id, 'in_progress')}
            >
              开工
            </Button>
          )}
          {r.status === 'in_progress' && (
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => transition(r.id, 'paused')}
            >
              暂停
            </Button>
          )}
          {r.status === 'paused' && (
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => transition(r.id, 'in_progress')}
            >
              恢复
            </Button>
          )}
          {r.status === 'in_progress' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => transition(r.id, 'completed')}
            >
              完工
            </Button>
          )}
          <Popconfirm title="确定删除?" onConfirm={() => remove(r.id)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="制造工单"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索工单号/产品"
              allowClear
              onSearch={setKeyword}
              style={{ width: 200 }}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已发布', value: 'released' },
                { label: '生产中', value: 'in_progress' },
                { label: '已暂停', value: 'paused' },
                { label: '已完工', value: 'completed' },
                { label: '已关闭', value: 'closed' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建工单
            </Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" size="middle" />
      </Card>

      <Modal
        title={editing ? '编辑工单' : '新建工单'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="productCode" label="产品编码">
            <Input />
          </Form.Item>
          <Form.Item name="routingId" label="工艺路线">
            <Select
              options={routings.map((r: any) => ({
                label: `${r.routingCode} ${r.productName}`,
                value: r.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="计划数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select
              options={[
                { label: '低', value: 'low' },
                { label: '普通', value: 'normal' },
                { label: '高', value: 'high' },
                { label: '紧急', value: 'urgent' },
              ]}
            />
          </Form.Item>
          <Form.Item name="plannedStart" label="计划开始">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="plannedEnd" label="计划结束">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="customerName" label="客户名称">
            <Input />
          </Form.Item>
          <Form.Item name="salesOrderCode" label="销售订单号">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`工单详情 - ${detail?.orderCode || ''}`}
        open={!!detail}
        onCancel={() => setDetail(null)}
        width={950}
        footer={null}
      >
        {detail && (
          <Tabs
            defaultActiveKey="operations"
            items={[
              {
                key: 'overview',
                label: '工单信息',
                children: (
                  <Descriptions bordered size="small" column={3}>
                    <Descriptions.Item label="工单号">{detail.orderCode}</Descriptions.Item>
                    <Descriptions.Item label="产品名称">{detail.productName}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={statusColors[detail.status]}>{detail.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="计划数量">{detail.quantity}</Descriptions.Item>
                    <Descriptions.Item label="已完工">{detail.completedQty}</Descriptions.Item>
                    <Descriptions.Item label="合格数">{detail.qualifiedQty}</Descriptions.Item>
                    <Descriptions.Item label="计划开始">
                      {detail.plannedStart?.split('T')[0]}
                    </Descriptions.Item>
                    <Descriptions.Item label="计划结束">
                      {detail.plannedEnd?.split('T')[0]}
                    </Descriptions.Item>
                    <Descriptions.Item label="优先级">{detail.priority}</Descriptions.Item>
                    <Descriptions.Item label="实际开始">
                      {detail.actualStart?.split('T')[0] || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="实际结束">
                      {detail.actualEnd?.split('T')[0] || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="备注">{detail.description || '-'}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'operations',
                label: '工序流程',
                children: (
                  <div>
                    <Table
                      dataSource={detail.operations || []}
                      rowKey="id"
                      size="small"
                      columns={[
                        { title: '序号', dataIndex: 'opSequence', width: 60 },
                        { title: '工序名称', dataIndex: 'opName', width: 140 },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          width: 80,
                          render: (v: string) => <Tag>{v}</Tag>,
                        },
                        { title: '工作中心', dataIndex: 'workCenter', width: 100 },
                        { title: '工人', dataIndex: 'assignedWorker', width: 80 },
                        { title: '计划工时', dataIndex: 'plannedHours', width: 80 },
                        { title: '实际工时', dataIndex: 'actualHours', width: 80 },
                        {
                          title: '投入/完工/合格/不良',
                          key: 'qty',
                          width: 120,
                          render: (_: any, op: any) =>
                            `${op.inputQty}/${op.completedQty}/${op.qualifiedQty}/${op.defectQty}`,
                        },
                        {
                          title: '操作',
                          key: 'opActions',
                          width: 160,
                          render: (_: any, op: any) => (
                            <Space size="small">
                              {op.status === 'pending' && (
                                <Button
                                  size="small"
                                  onClick={() => transitionOp(op.id, 'in_progress')}
                                >
                                  开始
                                </Button>
                              )}
                              {op.status === 'in_progress' && (
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<ScanOutlined />}
                                  onClick={() => openReport(op)}
                                >
                                  报工
                                </Button>
                              )}
                              {op.status === 'in_progress' && (
                                <Button
                                  size="small"
                                  onClick={() => transitionOp(op.id, 'completed')}
                                >
                                  完成
                                </Button>
                              )}
                            </Space>
                          ),
                        },
                      ]}
                    />
                    <Space style={{ marginTop: 12 }}>
                      <Button icon={<ScanOutlined />} onClick={openIssue}>
                        领料
                      </Button>
                      {detail.status === 'completed' && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={openComplete}
                        >
                          完工入库
                        </Button>
                      )}
                      {detail.status === 'in_progress' && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => transition(detail.id, 'completed')}
                        >
                          报完工
                        </Button>
            <WorkflowActions module="制造工单" docId={r.id} docCode={r.orderCode} docType="manufacturing_order" currentStatus={r.status} onTransitionDone={fetch} />
                      )}
                    </Space>
                  </div>
                ),
              },
              {
                key: 'issues',
                label: '领料记录',
                children: (
                  <Table
                    dataSource={detail.materialIssues || []}
                    rowKey="id"
                    size="small"
                    columns={[
                      { title: '领料单号', dataIndex: 'issueCode', width: 140 },
                      { title: '物料名称', dataIndex: 'materialName' },
                      { title: '数量', dataIndex: 'quantity' },
                      { title: '单位', dataIndex: 'unit' },
                      { title: '发料人', dataIndex: 'issuedBy' },
                      {
                        title: '时间',
                        dataIndex: 'issuedAt',
                        render: (v: any) => v?.split('T')[0],
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>

      <Modal
        title={`报工 - ${selectedOp?.opName || ''}`}
        open={reportModal}
        onOk={submitReport}
        onCancel={() => setReportModal(false)}
      >
        <Form form={reportForm} layout="vertical">
          <Form.Item name="operationId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="worker" label="操作工人">
            <Input />
          </Form.Item>
          <Form.Item name="shift" label="班次">
            <Select
              options={[
                { label: '白班', value: '白班' },
                { label: '夜班', value: '夜班' },
              ]}
            />
          </Form.Item>
          <Form.Item name="processedQty" label="加工数量">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="qualifiedQty" label="合格数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defectQty" label="不良数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defectReason" label="不良原因">
            <Input />
          </Form.Item>
          <Form.Item name="laborHours" label="实作工时">
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="scanCode" label="扫码">
            <Input placeholder="扫描工单条码" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="领料"
        open={issueModal}
        onOk={submitIssue}
        onCancel={() => setIssueModal(false)}
      >
        <Form form={issueForm} layout="vertical">
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="materialCode" label="物料编码">
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="issuedBy" label="发料人">
            <Input />
          </Form.Item>
          <Form.Item name="receivedBy" label="领料人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完工入库"
        open={completeModal}
        onOk={submitComplete}
        onCancel={() => setCompleteModal(false)}
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="warehouseId" label="仓库">
            <Input placeholder="仓库ID" />
          </Form.Item>
          <Form.Item name="materialId" label="物料编码">
            <Input placeholder="成品物料编码" />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称">
            <Input placeholder="成品物料名称" />
          </Form.Item>
          <Form.Item name="locationId" label="库位">
            <Input placeholder="库位ID" />
          </Form.Item>
          <Form.Item name="operator" label="操作人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
