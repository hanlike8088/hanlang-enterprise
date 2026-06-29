import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, Card, Tag, message, Popconfirm, DatePicker, Row, Col, Statistic } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CalendarOutlined, WarningOutlined } from "@ant-design/icons";
import { manufacturingApi } from "../../services/api";

const statusColors: Record<string, string> = { draft: "default", confirmed: "blue", executing: "orange", completed: "green", cancelled: "red" };

export default function SchedulingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState<any>({});
  const [detail, setDetail] = useState<any>(null);
  const [itemModal, setItemModal] = useState(false);
  const [itemForm] = Form.useForm();
  const [capacityAlerts, setCapacityAlerts] = useState<any>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [calForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("plans");

  const fetch = async () => {
    setLoading(true);
    try {
      const [plans, st] = await Promise.all([manufacturingApi.getPlans(), manufacturingApi.getStats()]);
      setData(plans); setStats(st);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: "draft" }); setModalOpen(true); };
  const openEdit = (r: any) => { setEditing(r); form.setFieldsValue({ ...r, startDate: r.startDate?.split("T")[0], endDate: r.endDate?.split("T")[0] }); setModalOpen(true); };
  const submit = async () => {
    const v = await form.validateFields();
    if (editing) { await manufacturingApi.updatePlan(editing.id, v); message.success("排产计划已更新"); }
    else { await manufacturingApi.createPlan(v); message.success("排产计划已创建"); }
    setModalOpen(false); fetch();
  };
  const remove = async (id: string) => { await manufacturingApi.deletePlan(id); message.success("已删除"); fetch(); };

  const viewDetail = async (r: any) => {
    try { setDetail(await manufacturingApi.getPlan(r.id)); } catch { setDetail(r); }
  };

  const addItem = async () => {
    if (!detail) return;
    const v = await itemForm.validateFields();
    await manufacturingApi.addPlanItem(detail.id, v);
    message.success("明细已添加"); itemForm.resetFields(); setItemModal(false);
    setDetail(await manufacturingApi.getPlan(detail.id));
  };

  const deleteItem = async (itemId: string) => {
    if (!detail) return;
    await manufacturingApi.deletePlanItem(itemId);
    setDetail(await manufacturingApi.getPlan(detail.id));
  };

  const dragItem = async (itemId: string, data: any) => {
    try {
      await manufacturingApi.dragPlanItem(itemId, data);
      message.success("排产已调整");
      setDetail(await manufacturingApi.getPlan(detail.id));
    } catch { message.error("调整失败"); }
  };

  const checkCapacity = async (planId: string) => {
    try { setCapacityAlerts(await manufacturingApi.checkCapacity(planId)); }
    catch { message.error("产能检查失败"); }
  };

  const fetchCalendars = async () => {
    try { setCalendars(await manufacturingApi.getCalendars()); } catch {}
  };

  const upsertCal = async () => {
    const v = await calForm.validateFields();
    await manufacturingApi.upsertCalendar(v);
    message.success("工作日历已更新"); fetchCalendars();
  };

  const columns = [
    { title: "计划编号", dataIndex: "planCode", key: "planCode", width: 140 },
    { title: "计划名称", dataIndex: "planName", key: "planName" },
    { title: "计划周期", dataIndex: "planPeriod", key: "planPeriod", width: 100 },
    { title: "开始日期", dataIndex: "startDate", key: "startDate", width: 120, render: (v: any) => v?.split("T")[0] },
    { title: "结束日期", dataIndex: "endDate", key: "endDate", width: 120, render: (v: any) => v?.split("T")[0] },
    { title: "状态", dataIndex: "status", key: "status", width: 80, render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag> },
    { title: "产能", key: "capacity", width: 160, render: (_: any, r: any) => <span>{r.usedHours} / {r.capacityHours} h</span> },
    { title: "操作", key: "actions", width: 180, render: (_: any, r: any) => (
      <Space size="small">
        <Button size="small" icon={<SearchOutlined />} onClick={() => viewDetail(r)}>明细</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        <Popconfirm title="确定删除?" onConfirm={() => remove(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="排产计划" value={stats.planTotal || 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="进行中工单" value={stats.orderInProgress || 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完工" value={stats.orderCompleted || 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="超期工单" value={stats.overdueCount || 0} valueStyle={{ color: stats.overdueCount > 0 ? "red" : undefined }} /></Card></Col>
      </Row>

      <Card title="生产排产计划" extra={<Space>
        <Button icon={<CalendarOutlined />} onClick={() => { fetchCalendars(); setActiveTab("calendar"); }}>工作日历</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建计划</Button>
      </Space>}>
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" size="middle" />
      </Card>

      <Modal title={editing ? "编辑排产计划" : "新建排产计划"} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="planName" label="计划名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="planPeriod" label="计划周期" rules={[{ required: true }]}><Input placeholder="如: 2026-06" /></Form.Item>
          <Form.Item name="startDate" label="开始日期"><Input type="date" /></Form.Item>
          <Form.Item name="endDate" label="结束日期"><Input type="date" /></Form.Item>
          <Form.Item name="capacityHours" label="产能上限(小时)"><Input type="number" /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[
            { label: "草稿", value: "draft" }, { label: "已确认", value: "confirmed" },
            { label: "执行中", value: "executing" }, { label: "已完成", value: "completed" },
          ]} /></Form.Item>
          <Form.Item name="description" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`排产明细 - ${detail?.planName || ""}`} open={!!detail} onCancel={() => { setDetail(null); setCapacityAlerts(null); }} width={900} footer={null}>
        {detail && (
          <>
            <Space style={{ marginBottom: 12 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { itemForm.resetFields(); itemForm.setFieldsValue({ status: "planned", resourceType: "machine" }); setItemModal(true); }}>添加明细</Button>
              <Button icon={<WarningOutlined />} onClick={() => checkCapacity(detail.id)}>产能检查</Button>
            </Space>
            {capacityAlerts && (
              <Card size="small" style={{ marginBottom: 12, background: "#fff7e6" }}>
                {capacityAlerts.alerts?.length === 0 ? <span style={{ color: "green" }}>产能正常</span> :
                  capacityAlerts.alerts?.map((a: any, i: number) => (
                    <div key={i} style={{ color: "red" }}>⚠ {a.workCenter}: {a.usedHours}h已超 {a.capacityHours}h上限 (超出{a.overload}h)</div>
                  ))
                }
              </Card>
            )}
            <Table dataSource={detail.items || []} rowKey="id" size="small" columns={[
              { title: "序号", dataIndex: "sortOrder", width: 60 },
              { title: "名称", dataIndex: "itemName", width: 150 },
              { title: "工作中心", dataIndex: "workCenter", width: 100 },
              { title: "开始", dataIndex: "startDate", width: 110, render: (v: any) => v?.split("T")[0] },
              { title: "结束", dataIndex: "endDate", width: 110, render: (v: any) => v?.split("T")[0] },
              { title: "进度", dataIndex: "progress", width: 80, render: (v: number) => `${Math.round(v * 100)}%` },
              { title: "状态", dataIndex: "status", width: 80, render: (v: string) => <Tag>{v}</Tag> },
              { title: "操作", width: 120, render: (_: any, r: any) => (
                <Space size="small">
                  <Button size="small" onClick={() => {
                    const sd = prompt("新开始日期", r.startDate?.split("T")[0]) || r.startDate;
                    const ed = prompt("新结束日期", r.endDate?.split("T")[0]) || r.endDate;
                    dragItem(r.id, { startDate: sd, endDate: ed });
                  }}>拖拽调整</Button>
                  <Popconfirm title="删除?" onConfirm={() => deleteItem(r.id)}><Button size="small" danger>删除</Button></Popconfirm>
                </Space>
              )},
            ]} />
          </>
        )}
      </Modal>

      <Modal title="添加排产明细" open={itemModal} onOk={addItem} onCancel={() => setItemModal(false)}>
        <Form form={itemForm} layout="vertical">
          <Form.Item name="itemName" label="明细名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="workCenter" label="工作中心"><Input /></Form.Item>
          <Form.Item name="resourceType" label="资源类型"><Select options={[{ label: "设备", value: "machine" }, { label: "人员", value: "labor" }]} /></Form.Item>
          <Form.Item name="resourceId" label="资源编号"><Input /></Form.Item>
          <Form.Item name="startDate" label="开始日期"><Input type="date" /></Form.Item>
          <Form.Item name="endDate" label="结束日期"><Input type="date" /></Form.Item>
          <Form.Item name="color" label="颜色标记"><Input placeholder="#1677ff" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="工作日历" open={activeTab === "calendar"} onCancel={() => setActiveTab("plans")} footer={null} width={500}>
        <Form form={calForm} layout="vertical" onFinish={upsertCal}>
          <Form.Item name="calendarDate" label="日期" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="shift" label="班次"><Select options={[{ label: "白班", value: "白班" }, { label: "夜班", value: "夜班" }]} /></Form.Item>
          <Form.Item name="isWorkingDay" label="工作日?" initialValue={true}><Select options={[{ label: "是", value: true }, { label: "否", value: false }]} /></Form.Item>
          <Form.Item name="capacityHours" label="产能小时"><Input type="number" /></Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
        <Card size="small" style={{ marginTop: 12 }}>
          <Button onClick={fetchCalendars}>加载日历</Button>
          {calendars.map((c: any) => (
            <div key={c.id}>{c.calendarDate?.split("T")[0]} {c.shift} {c.isWorkingDay ? "工作日" : "休息"}</div>
          ))}
        </Card>
      </Modal>
    </div>
  );
}
