import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Tag, Space, message, Statistic, Row, Col, Card,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined,
  PlayCircleOutlined, PauseCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { samplingApi, drawingApi } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  pending_approval: { color: 'gold', label: '待审批' },
  approved: { color: 'blue', label: '已审批' },
  assigned: { color: 'purple', label: '已分配' },
  in_progress: { color: 'processing', label: '进行中' },
  exception_paused: { color: 'red', label: '异常暂停' },
  completed: { color: 'green', label: '已完成' },
  rejected: { color: 'default', label: '已驳回' },
};

export default function 打样管理Work销售订单Page() {
  const [orders, set销售订单] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [drawings, set图纸管理] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const load销售订单 = async () => {
    setLoading(true);
    try {
      const data = await samplingApi.getOrders(filterStatus);
      set销售订单(data);
    } catch (e: any) {
      message.error('加载打样工单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await samplingApi.getStats();
      setStats(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load销售订单();
    loadStats();
    drawingApi.getDrawings().then(set图纸管理).catch(() => {});
  }, [filterStatus]);

  const handleCreate = async (values: any) => {
    try {
      await samplingApi.createOrder({
        productName: values.productName,
        quantity: values.quantity,
        deadline: values.deadline.toISOString(),
        description: values.description,
        applicant: values.applicant,
        customerName: values.customerName,
        drawingId: values.drawingId || undefined,
      });
      message.success('打样工单创建成功');
      setModalOpen(false);
      form.resetFields();
      load销售订单();
      loadStats();
    } catch (e: any) {
      message.error(e.response?.data?.message || '创建失败');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await samplingApi.approveOrder(id, { approver: '当前操作人' });
      message.success('审批通过');
      load销售订单();
    } catch (e: any) {
      message.error(e.response?.data?.message || '审批失败');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await samplingApi.rejectOrder(id, { approver: '当前操作人', comment: '审批驳回' });
      message.success('已驳回');
      load销售订单();
    } catch (e: any) {
      message.error(e.response?.data?.message || '驳回失败');
    }
  };

  const handleAssign = (id: string, assignee: string) => {
    Modal.confirm({
      title: '分配打样任务',
      content: <Input placeholder="打样技术员" id="assigneeInput" defaultValue={assignee} />,
      onOk: async () => {
        const val = (document.getElementById('assigneeInput') as HTMLInputElement)?.value || assignee;
        try {
          await samplingApi.assignOrder(id, { assignee: val });
          message.success('分配成功');
          load销售订单();
        } catch { message.error('分配失败'); }
      },
    });
  };

  const handleStart = async (id: string) => {
    try {
      await samplingApi.startProgress(id);
      message.success('开始打样');
      load销售订单();
    } catch (e: any) { message.error(e.response?.data?.message || '操作失败'); }
  };

  const handlePause = (id: string) => {
    Modal.confirm({
      title: '暂停打样',
      content: <Input.TextArea placeholder="暂停原因" id="pauseReason" rows={3} />,
      onOk: async () => {
        const reason = (document.getElementById('pauseReason') as HTMLTextAreaElement)?.value || '未说明';
        try {
          await samplingApi.pauseProgress(id, reason);
          message.success('已暂停');
          load销售订单();
        } catch { message.error('暂停失败'); }
      },
    });
  };

  const handleComplete = async (id: string) => {
    Modal.confirm({
      title: '确认完成',
      content: '确认该打样工单已完成？',
      onOk: async () => {
        try {
          await samplingApi.completeProgress(id);
          message.success('打样完成');
          load销售订单();
        } catch { message.error('操作失败'); }
      },
    });
  };

  const handleViewDetail = async (order: any) => {
    setDetailOrder(order);
    setDetailOpen(true);
  };

  const columns = [
    { title: '工单号', dataIndex: 'orderCode', key: 'orderCode', width: 150 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 180 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => {
        const st = STATUS_MAP[s] || { color: 'default', label: s };
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', width: 120, render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'pending_approval' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.id)}>通过</Button>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleReject(record.id)}>驳回</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleAssign(record.id, record.assignee)}>分配</Button>
          )}
          {(record.status === 'assigned' || record.status === 'exception_paused') && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)}>开始</Button>
          )}
          {record.status === 'in_progress' && (
            <>
              <Button size="small" danger icon={<PauseCircleOutlined />} onClick={() => handlePause(record.id)}>暂停</Button>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="总工单数" value={stats?.total || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="超期工单" value={stats?.overdue || 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={12}>
          <Card>
            <Space>
              <span>状态筛选：</span>
              <Select
                allowClear
                placeholder="全部"
                style={{ width: 160 }}
                value={filterStatus}
                onChange={setFilterStatus}
                options={Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v.label, value: k }))}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建打样工单
        </Button>
      </div>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="新建打样工单"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item name="quantity" label="打样数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deadline" label="要求完成日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="applicant" label="申请人" rules={[{ required: true }]}>
            <Input placeholder="需求提交人" />
          </Form.Item>
          <Form.Item name="customerName" label="客户名称">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="drawingId" label="参考图纸">
            <Select allowClear placeholder="选择相关图纸" options={drawings.filter((d:any) => d.status === 'active').map((d:any) => ({ value: d.id, label: d.drawingCode + ' - ' + d.drawingName }))} />
          </Form.Item>
          <Form.Item name="description" label="打样说明">
            <TextArea rows={3} placeholder="打样要求、规格说明等" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="打样工单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
        width={600}
      >
        {detailOrder && (
          <div>
            <p><strong>工单号：</strong>{detailOrder.orderCode}</p>
            <p><strong>产品名称：</strong>{detailOrder.productName}</p>
            <p><strong>数量：</strong>{detailOrder.quantity}</p>
            <p><strong>状态：</strong><Tag color={STATUS_MAP[detailOrder.status]?.color}>{STATUS_MAP[detailOrder.status]?.label}</Tag></p>
            <p><strong>申请人：</strong>{detailOrder.applicant}</p>
            <p><strong>客户：</strong>{detailOrder.customerName || '-'}</p>
            <p><strong>截止日期：</strong>{detailOrder.deadline ? dayjs(detailOrder.deadline).format('YYYY-MM-DD') : '-'}</p>
            <p><strong>打样说明：</strong>{detailOrder.description || '-'}</p>
            <p><strong>打样技术员：</strong>{detailOrder.assignee || '-'}</p>
            <p><strong>审批人：</strong>{detailOrder.approver || '-'}</p>
            <p><strong>审批意见：</strong>{detailOrder.approverComment || '-'}</p>
            <p><strong>异常原因：</strong>{detailOrder.exceptionReason || '-'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
