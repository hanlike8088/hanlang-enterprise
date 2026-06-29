import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Card, Tag, message, Tabs, Descriptions, Statistic, Row, Col } from 'antd';
import { PlusOutlined, ToolOutlined, CheckCircleOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { equipmentApi } from '../../services/api';
import dayjs from 'dayjs';

const sevColors: Record<string, string> = { '一般': 'blue', '紧急': 'orange', '停机': 'red' };
const reqStatusColors: Record<string, string> = { '待派工': 'blue', '已派工': 'orange', '维修中': 'processing', '待验收': 'gold', '已关闭': 'green' };

export default function RepairPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dispatchModal, setDispatchModal] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form] = Form.useForm();
  const [dispatchForm] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [reqs, eqs, st] = await Promise.all([
        equipmentApi.getRepairRequests(), equipmentApi.getEquipments(), equipmentApi.getRepairStats()
      ]);
      setRequests(reqs); setEquipments(eqs); setStats(st);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { form.resetFields(); setModalOpen(true); };
  const submit = async () => {
    const v = await form.validateFields();
    await equipmentApi.createRepairRequest(v);
    message.success('报修单已创建'); setModalOpen(false); fetch();
  };

  const openDispatch = (r: any) => { setDispatchModal(r); dispatchForm.resetFields(); };
  const submitDispatch = async () => {
    const v = await dispatchForm.validateFields();
    await equipmentApi.dispatchRepair(dispatchModal.id, v);
    message.success('派工完成'); setDispatchModal(null); fetch();
  };

  const startRepair = async (woId: string) => { await equipmentApi.startRepair(woId); message.success('维修已开始'); fetch(); };
  const completeRepair = async (woId: string) => {
    const v = { result: prompt('维修结果') || '已完成', partsUsed: prompt('更换备件（可选）') || undefined };
    await equipmentApi.completeRepair(woId, v);
    message.success('维修完成，待验收'); fetch();
  };
  const verifyRepair = async (woId: string) => {
    await equipmentApi.verifyRepair(woId, { verifiedBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : '管理员' });
    message.success('验收通过'); fetch();
  };

  const viewDetail = async (r: any) => {
    try { setDetail(await equipmentApi.getRepairRequest(r.id)); } catch {}
  };

  const columns = [
    { title: '报修编号', dataIndex: 'requestCode', width: 120 },
    { title: '设备', render: (_: any, r: any) => r.equipment?.equipmentName || '-' },
    { title: '故障描述', dataIndex: 'faultDescription', ellipsis: true },
    { title: '严重程度', dataIndex: 'severity', width: 80, render: (s: string) => <Tag color={sevColors[s]}>{s}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={reqStatusColors[s]}>{s}</Tag> },
    { title: '报修人', dataIndex: 'reporter', width: 80 },
    { title: '时间', dataIndex: 'reportedAt', width: 110, render: (v: string) => v?.split('T')[0] },
    { title: '操作', width: 240, render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => viewDetail(r)}>详情</Button>
          {r.status === '待派工' && <Button type="link" size="small" onClick={() => openDispatch(r)}>派工</Button>}
          {r.workOrder && r.workOrder.status === '待维修' && <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => startRepair(r.workOrder.id)}>开始</Button>}
          {r.workOrder && r.workOrder.status === '维修中' && <Button type="link" size="small" icon={<StopOutlined />} onClick={() => completeRepair(r.workOrder.id)}>完成</Button>}
          {r.workOrder && r.workOrder.status === '待验收' && <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => verifyRepair(r.workOrder.id)}>验收</Button>}
        </Space>
      ),
    },
  ];

  return (
    <Card title="设备维修管理" bodyStyle={{ padding: 0 }}>
      <Tabs defaultActiveKey="list" items={[
        { key: 'list', label: '报修列表', children: (
            <div style={{ padding: 16 }}>
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col span={6}><Statistic title="维修总数" value={stats.totalRepairs || 0} /></Col>
                <Col span={6}><Statistic title="MTTR" value={stats.mttr || '-'} /></Col>
                <Col span={6}><Statistic title="MTBF" value={stats.mtbf || '-'} /></Col>
                <Col span={6}><Statistic title="总工时(h)" value={stats.totalRepairHours || 0} /></Col>
              </Row>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 8 }}>新建报修</Button>
              <Table rowKey="id" columns={columns} dataSource={requests} loading={loading} size="small" pagination={{ pageSize: 15 }} />
            </div>
          ),
        },
        ...(detail ? [{ key: 'detail', label: '报修详情', children: (
            <div style={{ padding: 16 }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="报修编号">{detail.requestCode}</Descriptions.Item>
                <Descriptions.Item label="设备">{detail.equipment?.equipmentName}</Descriptions.Item>
                <Descriptions.Item label="故障描述" span={2}>{detail.faultDescription}</Descriptions.Item>
                <Descriptions.Item label="严重程度"><Tag color={sevColors[detail.severity]}>{detail.severity}</Tag></Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={reqStatusColors[detail.status]}>{detail.status}</Tag></Descriptions.Item>
                <Descriptions.Item label="报修人">{detail.reporter}</Descriptions.Item>
                <Descriptions.Item label="报修时间">{detail.reportedAt?.split('T')[0]}</Descriptions.Item>
                {detail.workOrder && <>
                  <Descriptions.Item label="工单号">{detail.workOrder.orderCode}</Descriptions.Item>
                  <Descriptions.Item label="负责人">{detail.workOrder.assignedTo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="维修方法">{detail.workOrder.repairMethod || '-'}</Descriptions.Item>
                  <Descriptions.Item label="更换备件">{detail.workOrder.partsUsed || '-'}</Descriptions.Item>
                  <Descriptions.Item label="开始时间">{detail.workOrder.startTime ? dayjs(detail.workOrder.startTime).format('MM-DD HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="结束时间">{detail.workOrder.endTime ? dayjs(detail.workOrder.endTime).format('MM-DD HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="维修结果">{detail.workOrder.result || '-'}</Descriptions.Item>
                  <Descriptions.Item label="验收人">{detail.workOrder.verifiedBy || '-'}</Descriptions.Item>
                </>}
              </Descriptions>
            </div>
          ),
        }] : []),
        { key: 'stats', label: 'MTBF/MTTR统计', children: (
            <div style={{ padding: 16 }}>
              <Table rowKey="equipmentCode" dataSource={stats.byEquipment || []} size="small" pagination={false}
                columns={[
                  { title: '设备编号', dataIndex: 'equipmentCode' }, { title: '设备名称', dataIndex: 'equipmentName' },
                  { title: '维修次数', dataIndex: 'count' },
                  { title: '总维修小时', dataIndex: 'totalHours', render: (v: number) => v.toFixed(1) },
                  { title: 'MTTR(h)', render: (_: any, r: any) => r.count > 0 ? (r.totalHours / r.count).toFixed(1) : '-' },
                ]} />
            </div>
          ),
        },
      ]} />

      <Modal title="新建报修" open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="equipmentId" label="设备" rules={[{ required: true }]}>
            <Select showSearch filterOption={(i, o: any) => o.label.includes(i)} options={equipments.map(e => ({ label: `${e.equipmentCode} ${e.equipmentName}`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="faultDescription" label="故障描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="severity" label="严重程度"><Select options={[{ label: '一般', value: '一般' }, { label: '紧急', value: '紧急' }, { label: '停机', value: '停机' }]} /></Form.Item>
          <Form.Item name="reporter" label="报修人"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="派工" open={!!dispatchModal} onOk={submitDispatch} onCancel={() => setDispatchModal(null)}>
        <Form form={dispatchForm} layout="vertical">
          <Form.Item name="assignedTo" label="指派维修人员" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="repairMethod" label="维修方案"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
