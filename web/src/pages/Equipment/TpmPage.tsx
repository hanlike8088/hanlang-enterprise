import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Card, Tag, message, Popconfirm, Tabs, DatePicker, Row, Col } from 'antd';
import { PlusOutlined, CheckCircleOutlined, WarningOutlined, ToolOutlined, ReloadOutlined } from '@ant-design/icons';
import { equipmentApi } from '../../services/api';
import dayjs from 'dayjs';

const statusColors: Record<string, string> = { '待执行': 'blue', '已完成': 'green', '异常': 'red' };
const planStatusColors: Record<string, string> = { '计划中': 'blue', '已执行': 'green', '已过期': 'default' };

export default function TpmPage() {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [todayPlans, setTodayPlans] = useState<any[]>([]);
  const [mtPlans, setMtPlans] = useState<any[]>([]);
  const [mtOrders, setMtOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stdModalOpen, setStdModalOpen] = useState(false);
  const [stdEditing, setStdEditing] = useState<any>(null);
  const [stdEquipmentId, setStdEquipmentId] = useState<string>('');
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [checkPlan, setCheckPlan] = useState<any>(null);
  const [mtModalOpen, setMtModalOpen] = useState(false);
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [checkForm] = Form.useForm();
  const [mtForm] = Form.useForm();
  const [woForm] = Form.useForm();

  const loadEquipments = async () => { try { setEquipments(await equipmentApi.getEquipments()); } catch {} };
  const loadPlans = async () => { setLoading(true); try { setPlans(await equipmentApi.getCheckPlans()); setTodayPlans(await equipmentApi.getTodayCheckPlans()); } finally { setLoading(false); } };
  const loadRecords = async () => { try { setRecords(await equipmentApi.getCheckRecords()); } catch {} };
  const loadMt = async () => { try { const [p, o] = await Promise.all([equipmentApi.getMaintenancePlans(), equipmentApi.getMaintenanceWorkOrders()]); setMtPlans(p); setMtOrders(o); } catch {} };

  useEffect(() => { loadEquipments(); loadPlans(); loadRecords(); loadMt(); }, []);

  const openStdModal = (equipmentId: string) => { setStdEquipmentId(equipmentId); setStdEditing(null); form.resetFields(); form.setFieldsValue({ frequency: '每日' }); setStdModalOpen(true); };
  const submitStd = async () => {
    const v = await form.validateFields();
    if (stdEditing) { await equipmentApi.updateCheckStandard(stdEditing.id, v); message.success('标准已更新'); }
    else { await equipmentApi.createCheckStandard(stdEquipmentId, v); message.success('标准已创建'); }
    setStdModalOpen(false);
  };
  const removeStd = async (id: string) => { await equipmentApi.deleteCheckStandard(id); message.success('已删除'); };

  const generatePlans = async (equipmentId: string) => { await equipmentApi.generateCheckPlans(equipmentId, 7); message.success('计划已生成'); loadPlans(); };

  const openCheckModal = (plan: any) => { setCheckPlan(plan); checkForm.resetFields(); checkForm.setFieldsValue({ checkResult: '正常' }); setCheckModalOpen(true); };
  const submitCheck = async () => {
    const v = await checkForm.validateFields();
    const res = await equipmentApi.executeCheck(checkPlan.id, v);
    if (res.repair) message.warning('点检异常，已自动创建维修单');
    else message.success('点检完成');
    setCheckModalOpen(false); loadPlans(); loadRecords();
  };

  const openMtModal = () => { mtForm.resetFields(); mtForm.setFieldsValue({ planType: '定期保养' }); setMtModalOpen(true); };
  const submitMt = async () => {
    const v = await mtForm.validateFields();
    await equipmentApi.createMaintenancePlan(v.equipmentId, v);
    message.success('保养计划已创建'); setMtModalOpen(false); loadMt();
  };
  const openWoModal = () => { woForm.resetFields(); woForm.setFieldsValue({ workType: '保养' }); setWoModalOpen(true); };
  const submitWo = async () => {
    const v = await woForm.validateFields();
    await equipmentApi.createMaintenanceWorkOrder(v);
    message.success('工单已创建'); setWoModalOpen(false); loadMt();
  };

  const stdColumns = [
    { title: '检查项', dataIndex: 'checkItem' }, { title: '检查方法', dataIndex: 'checkMethod', render: (v: string) => v || '-' },
    { title: '正常范围', dataIndex: 'normalRange', render: (v: string) => v || '-' },
    { title: '频率', dataIndex: 'frequency', width: 80 },
    { title: '操作', width: 120, render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setStdEditing(r); form.setFieldsValue(r); setStdModalOpen(true); }}>编辑</Button>
          <Popconfirm title="删除？" onConfirm={() => removeStd(r.id)}><Button type="link" size="small" danger>删除</Button></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="TPM点检与保养" bodyStyle={{ padding: 0 }}>
      <Tabs defaultActiveKey="today" items={[
        { key: 'today', label: '今日点检', children: (
            <div style={{ padding: 16 }}>
              <Table rowKey="id" dataSource={todayPlans} loading={loading} size="small" pagination={false}
                columns={[
                  { title: '计划编号', dataIndex: 'planCode', width: 120 },
                  { title: '设备', render: (_: any, r: any) => r.equipment?.equipmentName || '-' },
                  { title: '点检日期', dataIndex: 'checkDate', width: 110, render: (v: string) => v?.split('T')[0] },
                  { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
                  { title: '已检项', render: (_: any, r: any) => `${r.checkRecords?.length || 0}项` },
                  { title: '操作', width: 100, render: (_: any, r: any) => r.status === '待执行' ? <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openCheckModal(r)}>执行</Button> : '-' },
                ]} />
            </div>
          ),
        },
        { key: 'standards', label: '点检标准', children: (
            <div style={{ padding: 16 }}>
              <Select placeholder="选择设备" style={{ width: 240, marginRight: 8, marginBottom: 8 }} showSearch filterOption={(i, o: any) => o.label.includes(i)} options={equipments.map(e => ({ label: `${e.equipmentCode} ${e.equipmentName}`, value: e.id }))} onChange={(v) => loadEquipments()} />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { if (equipments.length > 0) openStdModal(equipments[0].id); }}>新增标准</Button>
              {equipments.map(eq => (
                <Card key={eq.id} title={`${eq.equipmentCode} ${eq.equipmentName}`} size="small" style={{ marginTop: 8 }}
                  extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => generatePlans(eq.id)}>生成7日计划</Button>}>
                  <Table rowKey="id" dataSource={eq.checkStandards || []} size="small" pagination={false} columns={stdColumns}
                    locale={{ emptyText: '未定义点检标准' }} />
                </Card>
              ))}
            </div>
          ),
        },
        { key: 'plans', label: '点检计划', children: (
            <Table rowKey="id" dataSource={plans} loading={loading} size="small" pagination={{ pageSize: 15 }} style={{ padding: 16 }}
              columns={[
                { title: '编号', dataIndex: 'planCode', width: 120 }, { title: '设备', render: (_: any, r: any) => r.equipment?.equipmentName || '-' },
                { title: '日期', dataIndex: 'checkDate', width: 110, render: (v: string) => v?.split('T')[0] },
                { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
                { title: '操作', width: 100, render: (_: any, r: any) => r.status === '待执行' ? <Button type="link" size="small" onClick={() => openCheckModal(r)}>执行</Button> : '-' },
              ]} />
          ),
        },
        { key: 'records', label: '点检记录', children: (
            <Table rowKey="id" dataSource={records} size="small" pagination={{ pageSize: 15 }} style={{ padding: 16 }}
              columns={[
                { title: '设备', render: (_: any, r: any) => r.equipment?.equipmentName || '-' }, { title: '检查项', dataIndex: 'checkItem' },
                { title: '结果', dataIndex: 'checkResult', width: 70, render: (s: string) => <Tag color={s === '异常' ? 'red' : 'green'}>{s}</Tag> },
                { title: '读数', dataIndex: 'reading', width: 80 }, { title: '检查人', dataIndex: 'checkedBy', width: 80 },
                { title: '时间', dataIndex: 'checkedAt', width: 150, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
              ]} />
          ),
        },
        { key: 'mt-plans', label: '保养计划', children: (
            <div style={{ padding: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openMtModal} style={{ marginBottom: 8 }}>新建保养计划</Button>
              <Table rowKey="id" dataSource={mtPlans} size="small" pagination={{ pageSize: 10 }}
                columns={[
                  { title: '编号', dataIndex: 'planCode', width: 120 }, { title: '设备', render: (_: any, r: any) => r.equipment?.equipmentName || '-' },
                  { title: '类型', dataIndex: 'planType', width: 80 }, { title: '内容', dataIndex: 'content', ellipsis: true },
                  { title: '频率', dataIndex: 'frequency', width: 80 }, { title: '下次日期', dataIndex: 'nextDate', width: 110, render: (v: string) => v?.split('T')[0] || '-' },
                  { title: '状态', dataIndex: 'status', width: 70, render: (s: string) => <Tag color={planStatusColors[s]}>{s}</Tag> },
                ]} />
            </div>
          ),
        },
        { key: 'mt-orders', label: '保养工单', children: (
            <div style={{ padding: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openWoModal} style={{ marginBottom: 8 }}>新建工单</Button>
              <Table rowKey="id" dataSource={mtOrders} size="small" pagination={{ pageSize: 10 }}
                columns={[
                  { title: '工单号', dataIndex: 'orderCode', width: 120 }, { title: '设备', render: (_: any, r: any) => r.equipment?.equipmentName || '-' },
                  { title: '类型', dataIndex: 'workType', width: 80 }, { title: '状态', dataIndex: 'status', width: 70 },
                  { title: '负责人', dataIndex: 'assignedTo', width: 80 }, { title: '开始', dataIndex: 'startDate', width: 110, render: (v: string) => v?.split('T')[0] || '-' },
                ]} />
            </div>
          ),
        },
      ]} />

      <Modal title={stdEditing ? '编辑标准' : '新增标准'} open={stdModalOpen} onOk={submitStd} onCancel={() => setStdModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="checkItem" label="检查项" rules={[{ required: true }]}><Input placeholder="如：温度、振动、噪音" /></Form.Item>
          <Form.Item name="checkMethod" label="检查方法"><Input placeholder="如：红外测温仪" /></Form.Item>
          <Form.Item name="normalRange" label="正常范围"><Input placeholder="如：< 85°C" /></Form.Item>
          <Form.Item name="frequency" label="频率"><Select options={['每日','每周','每月'].map(v=>({label:v,value:v}))} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="执行点检" open={checkModalOpen} onOk={submitCheck} onCancel={() => setCheckModalOpen(false)}>
        <Form form={checkForm} layout="vertical">
          <Form.Item name="checkItem" label="检查项" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="reading" label="读数"><Input /></Form.Item>
          <Form.Item name="checkResult" label="结果" rules={[{ required: true }]}>
            <Select options={[{ label: '正常', value: '正常' }, { label: '异常', value: '异常' }]} />
          </Form.Item>
          <Form.Item name="note" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="checkedBy" label="检查人"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="新建保养计划" open={mtModalOpen} onOk={submitMt} onCancel={() => setMtModalOpen(false)}>
        <Form form={mtForm} layout="vertical">
          <Form.Item name="equipmentId" label="设备" rules={[{ required: true }]}>
            <Select showSearch filterOption={(i, o: any) => o.label.includes(i)} options={equipments.map(e => ({ label: `${e.equipmentCode} ${e.equipmentName}`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="planType" label="保养类型"><Select options={['定期保养','大修','项修'].map(v=>({label:v,value:v}))} /></Form.Item>
          <Form.Item name="content" label="保养内容" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="frequency" label="频率"><Input placeholder="如：每月" /></Form.Item>
          <Form.Item name="nextDate" label="下次执行日期"><Input type="date" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="新建保养工单" open={woModalOpen} onOk={submitWo} onCancel={() => setWoModalOpen(false)}>
        <Form form={woForm} layout="vertical">
          <Form.Item name="equipmentId" label="设备" rules={[{ required: true }]}>
            <Select showSearch filterOption={(i, o: any) => o.label.includes(i)} options={equipments.map(e => ({ label: `${e.equipmentCode} ${e.equipmentName}`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="workType" label="工单类型"><Select options={['保养','维修'].map(v=>({label:v,value:v}))} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="assignedTo" label="负责人"><Input /></Form.Item>
          <Form.Item name="startDate" label="计划开始"><Input type="date" /></Form.Item>
          <Form.Item name="endDate" label="计划结束"><Input type="date" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
