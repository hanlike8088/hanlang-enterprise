import {  useEffect, useState } from 'react';
import { Row, Col,  Table, Button, Modal, Form, Input, Select, Space, Card, Tag, message, Tabs, InputNumber, Descriptions, DatePicker } from 'antd';
import {  PlusOutlined, EditOutlined, SearchOutlined, CheckCircleOutlined, WarningOutlined, SafetyOutlined, ToolOutlined } from '@ant-design/icons';
import {  qualityApi } from '../../services/api';

const oqcStatusColors: Record<string, string> = { '待检': 'blue', '检验中': 'orange', '合格': 'green', '不合格': 'red' };
const ncrStatusColors: Record<string, string> = { '待评审': 'orange', '已评审': 'blue', '已处置': 'green', '已关闭': 'default' };
const capaStatusColors: Record<string, string> = { '待实施': 'orange', '实施中': 'blue', '已验证': 'green' };
const sevColors: Record<string, string> = { '一般': 'blue', '严重': 'orange', '致命': 'red' };

export default function OQCPage() {
  const [activeTab, setActiveTab] = useState('oqc');

  // OQC
  const [oqcData, setOqcData] = useState<any[]>([]);
  const [oqcLoading, setOqcLoading] = useState(false);
  const [oqcKeyword, setOqcKeyword] = useState('');
  const [oqcStatusFilter, setOqcStatusFilter] = useState<string | undefined>();
  const [oqcModalOpen, setOqcModalOpen] = useState(false);
  const [editingOqc, setEditingOqc] = useState<any>(null);
  const [oqcForm] = Form.useForm();

  // NCR
  const [ncrData, setNcrData] = useState<any[]>([]);
  const [ncrLoading, setNcrLoading] = useState(false);
  const [ncrStatusFilter, setNcrStatusFilter] = useState<string | undefined>();
  const [ncrModalOpen, setNcrModalOpen] = useState(false);
  const [ncrForm] = Form.useForm();
  const [reviewNcrOpen, setReviewNcrOpen] = useState(false);
  const [reviewNcrId, setReviewNcrId] = useState<string>('');
  const [reviewForm] = Form.useForm();

  // CAPA
  const [capaData, setCapaData] = useState<any[]>([]);
  const [capaLoading, setCapaLoading] = useState(false);
  const [capaStatusFilter, setCapaStatusFilter] = useState<string | undefined>();
  const [capaModalOpen, setCapaModalOpen] = useState(false);
  const [capaForm] = Form.useForm();

  // OQC
  const fetchOqc = async () => {
    setOqcLoading(true);
    try { setOqcData(await qualityApi.getOutgoings(oqcStatusFilter, oqcKeyword || undefined)); }
    finally { setOqcLoading(false); }
  };
  useEffect(() => { if (activeTab === 'oqc') fetchOqc(); }, [activeTab, oqcStatusFilter, oqcKeyword]);

  const openOqcCreate = () => { setEditingOqc(null); oqcForm.resetFields(); oqcForm.setFieldsValue({ quantity: 0, unit: '个' }); setOqcModalOpen(true); };
  const submitOqc = async () => {
    const v = await oqcForm.validateFields();
    if (editingOqc) { await qualityApi.updateOutgoing(editingOqc.id, v); message.success('已更新'); }
    else { await qualityApi.createOutgoing(v); message.success('已创建'); }
    setOqcModalOpen(false); fetchOqc();
  };
  const judgeOqc = async (r: any, result: string) => {
    await qualityApi.updateOutgoing(r.id, { result, status: result === '合格' ? '已完成' : '不合格', inspector: '质检员' });
    message.success(`判定: ${result}`); fetchOqc();
  };

  // NCR
  const fetchNcr = async () => {
    setNcrLoading(true);
    try { setNcrData(await qualityApi.getNcrs(ncrStatusFilter)); }
    finally { setNcrLoading(false); }
  };
  useEffect(() => { if (activeTab === 'ncr') fetchNcr(); }, [activeTab, ncrStatusFilter]);

  const openNcrCreate = () => { ncrForm.resetFields(); ncrForm.setFieldsValue({ severity: '一般', source: 'OQC' }); setNcrModalOpen(true); };
  const submitNcr = async () => {
    const v = await ncrForm.validateFields();
    await qualityApi.createNcr(v); message.success('NCR已创建');
    setNcrModalOpen(false); fetchNcr();
  };
  const openReviewNcr = (r: any) => { setReviewNcrId(r.id); reviewForm.resetFields(); reviewForm.setFieldsValue({ status: '已评审', disposition: '返工' }); setReviewNcrOpen(true); };
  const submitReviewNcr = async () => {
    const v = await reviewForm.validateFields();
    await qualityApi.reviewNcr(reviewNcrId, v); message.success('NCR已评审');
    setReviewNcrOpen(false); fetchNcr();
  };

  // CAPA
  const fetchCapa = async () => {
    setCapaLoading(true);
    try { setCapaData(await qualityApi.getCapas(undefined, capaStatusFilter)); }
    finally { setCapaLoading(false); }
  };
  useEffect(() => { if (activeTab === 'capa') fetchCapa(); }, [activeTab, capaStatusFilter]);

  const openCapaCreate = () => { capaForm.resetFields(); capaForm.setFieldsValue({ status: '待实施' }); setCapaModalOpen(true); };
  const submitCapa = async () => {
    const v = await capaForm.validateFields();
    await qualityApi.createCapa(v); message.success('CAPA已创建');
    setCapaModalOpen(false); fetchCapa();
  };
  const verifyCapa = async (id: string) => {
    await qualityApi.updateCapa(id, { status: '已验证', verifiedBy: '品质主管' });
    message.success('CAPA已验证'); fetchCapa();
  };

  const oqcColumns = [
    { title: '检验单号', dataIndex: 'inspectionCode', width: 120 },
    { title: '产品名称', dataIndex: 'productName', width: 140 },
    { title: '批次', dataIndex: 'batchNo', width: 100 },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '单位', dataIndex: 'unit', width: 50 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={oqcStatusColors[s]}>{s}</Tag> },
    { title: '结果', dataIndex: 'result', width: 80, render: (r: string) => r ? <Tag color={r === '合格' ? 'green' : 'red'}>{r}</Tag> : '-' },
    { title: '操作', key: 'act', width: 200,
      render: (_: any, r: any) => (
        <Space size="small">
          {r.status === '待检' && (
            <>
              <Button type="link" size="small" onClick={() => judgeOqc(r, '合格')} icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>合格</Button>
              <Button type="link" size="small" onClick={() => judgeOqc(r, '不合格')} icon={<WarningOutlined />} danger>不合格</Button>
            </>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingOqc(r); oqcForm.setFieldsValue(r); setOqcModalOpen(true); }}>编辑</Button>
        </Space>
      ),
    },
  ];

  const ncrColumns = [
    { title: 'NCR编号', dataIndex: 'ncrCode', width: 120 },
    { title: '来源', dataIndex: 'source', width: 80 },
    { title: '产品', dataIndex: 'productName', width: 120 },
    { title: '缺陷类型', dataIndex: 'defectType', width: 100 },
    { title: '等级', dataIndex: 'severity', width: 70, render: (s: string) => <Tag color={sevColors[s]}>{s}</Tag> },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={ncrStatusColors[s]}>{s}</Tag> },
    { title: '处置', dataIndex: 'disposition', width: 80, render: (v: string) => v || '-' },
    { title: '操作', key: 'act', width: 180,
      render: (_: any, r: any) => (
        <Space size="small">
          {r.status === '待评审' && (
            <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => openReviewNcr(r)}>评审</Button>
          )}
          {r.status === '已评审' && !r.capa && (
            <Button type="link" size="small" icon={<ToolOutlined />} onClick={() => { capaForm.setFieldsValue({ ncrId: r.id }); setCapaModalOpen(true); }}>创建CAPA</Button>
          )}
        </Space>
      ),
    },
  ];

  const capaColumns = [
    { title: 'CAPA编号', dataIndex: 'capaCode', width: 120 },
    { title: '关联NCR', dataIndex: 'ncr', width: 120, render: (n: any) => n?.ncrCode || '-' },
    { title: '根本原因', dataIndex: 'rootCause', width: 140, ellipsis: true },
    { title: '纠正措施', dataIndex: 'correctiveAction', width: 140, ellipsis: true },
    { title: '负责人', dataIndex: 'responsible', width: 80 },
    { title: '期限', dataIndex: 'deadline', width: 100, render: (v: string) => v ? v.split('T')[0] : '-' },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={capaStatusColors[s]}>{s}</Tag> },
    { title: '操作', key: 'act', width: 100,
      render: (_: any, r: any) => (
        r.status !== '已验证' ? (
          <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => verifyCapa(r.id)}>验证</Button>
        ) : null
      ),
    },
  ];

  return (
    <Card title="出货检验 OQC & 不合格品 NCR & CAPA" bodyStyle={{ padding: 0 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'oqc', label: '出货检验 OQC', children: (
          <>
            <Space style={{ padding: '16px', marginBottom: 12 }}>
              <Input.Search placeholder="搜索产品/批次" allowClear onSearch={setOqcKeyword} style={{ width: 200 }} />
              <Select placeholder="状态" allowClear style={{ width: 110 }} onChange={setOqcStatusFilter} options={['待检','已完成','不合格'].map(v=>({label:v,value:v}))} />
              <Button type="primary" icon={<PlusOutlined />} onClick={openOqcCreate}>新增出货检验</Button>
            </Space>
            <Table columns={oqcColumns} dataSource={oqcData} rowKey="id" loading={oqcLoading} size="small" />
          </>
        )},
        { key: 'ncr', label: '不合格品 NCR', children: (
          <>
            <Space style={{ padding: '16px', marginBottom: 12 }}>
              <Select placeholder="状态" allowClear style={{ width: 110 }} onChange={setNcrStatusFilter} options={['待评审','已评审','已处置','已关闭'].map(v=>({label:v,value:v}))} />
              <Button type="primary" icon={<PlusOutlined />} onClick={openNcrCreate}>新增NCR</Button>
            </Space>
            <Table columns={ncrColumns} dataSource={ncrData} rowKey="id" loading={ncrLoading} size="small" />
          </>
        )},
        { key: 'capa', label: '纠正预防 CAPA', children: (
          <>
            <Space style={{ padding: '16px', marginBottom: 12 }}>
              <Select placeholder="状态" allowClear style={{ width: 110 }} onChange={setCapaStatusFilter} options={['待实施','实施中','已验证'].map(v=>({label:v,value:v}))} />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCapaCreate}>新增CAPA</Button>
            </Space>
            <Table columns={capaColumns} dataSource={capaData} rowKey="id" loading={capaLoading} size="small" />
          </>
        )},
      ]} />

      {/* OQC Modal */}
      <Modal title={editingOqc ? '编辑出货检验' : '新增出货检验'} open={oqcModalOpen} onOk={submitOqc} onCancel={() => setOqcModalOpen(false)}>
        <Form form={oqcForm} layout="vertical">
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="orderId" label="订单号"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="batchNo" label="批次号"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="quantity" label="数量"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="unit" label="单位"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* NCR Modal */}
      <Modal title="新增NCR" open={ncrModalOpen} onOk={submitNcr} onCancel={() => setNcrModalOpen(false)}>
        <Form form={ncrForm} layout="vertical">
          <Form.Item name="source" label="来源" rules={[{ required: true }]}>
            <Select options={['IQC','IPQC','OQC','客诉'].map(v=>({label:v,value:v}))} />
          </Form.Item>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="defectType" label="缺陷类型" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="severity" label="严重等级"><Select options={['一般','严重','致命'].map(v=>({label:v,value:v}))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="quantity" label="不合格数量"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="问题描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      {/* NCR Review Modal */}
      <Modal title="NCR评审" open={reviewNcrOpen} onOk={submitReviewNcr} onCancel={() => setReviewNcrOpen(false)}>
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="status" label="评审结果" rules={[{ required: true }]}>
            <Select options={[{ label: '已评审', value: '已评审' }, { label: '已处置', value: '已处置' }, { label: '已关闭', value: '已关闭' }]} />
          </Form.Item>
          <Form.Item name="disposition" label="处置方式">
            <Select options={['返工','报废','让步接收','退货'].map(v=>({label:v,value:v}))} />
          </Form.Item>
          <Form.Item name="reviewedBy" label="评审人"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* CAPA Modal */}
      <Modal title="新增CAPA" open={capaModalOpen} onOk={submitCapa} onCancel={() => setCapaModalOpen(false)}>
        <Form form={capaForm} layout="vertical">
          <Form.Item name="ncrId" label="关联NCR ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="rootCause" label="根本原因"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="correctiveAction" label="纠正措施"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="responsible" label="负责人"><Input /></Form.Item>
          <Form.Item name="deadline" label="完成期限"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
