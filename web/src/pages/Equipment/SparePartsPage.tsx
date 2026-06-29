import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Card, Tag, message, Popconfirm, Tabs, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { equipmentApi } from '../../services/api';

export default function SparePartsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [warnings, setWarnings] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [inModal, setInModal] = useState(false);
  const [outModal, setOutModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [form] = Form.useForm();
  const [inForm] = Form.useForm();
  const [outForm] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try { setData(await equipmentApi.getSpareParts(keyword || undefined)); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [keyword]);

  const fetchWarnings = async () => {
    try {
      const [w, s] = await Promise.all([equipmentApi.getSparePartWarnings(), equipmentApi.getPurchaseSuggestions()]);
      setWarnings(w); setSuggestions(s);
    } catch {}
  };
  const fetchRecords = async () => { try { setRecords(await equipmentApi.getSparePartRecords()); } catch {} };

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ unit: '个' }); setModalOpen(true); };
  const openEdit = (r: any) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  const submit = async () => {
    const v = await form.validateFields();
    if (editing) { await equipmentApi.updateSparePart(editing.id, v); message.success('已更新'); }
    else { await equipmentApi.createSparePart(v); message.success('已创建'); }
    setModalOpen(false); fetch();
  };

  const remove = async (id: string) => { await equipmentApi.deleteSparePart(id); message.success('已删除'); fetch(); };

  const openStockIn = (p: any) => { setSelectedPart(p); inForm.resetFields(); setInModal(true); };
  const submitStockIn = async () => {
    const v = await inForm.validateFields();
    await equipmentApi.stockIn({ partId: selectedPart.id, ...v });
    message.success('入库成功'); setInModal(false); fetch(); fetchRecords();
  };

  const openStockOut = (p: any) => { setSelectedPart(p); outForm.resetFields(); setOutModal(true); };
  const submitStockOut = async () => {
    const v = await outForm.validateFields();
    await equipmentApi.stockOut({ partId: selectedPart.id, ...v });
    message.success('领用成功'); setOutModal(false); fetch(); fetchRecords();
  };

  const columns = [
    { title: '备件编号', dataIndex: 'partCode', width: 120 },
    { title: '备件名称', dataIndex: 'partName', ellipsis: true },
    { title: '规格', dataIndex: 'spec', width: 100, render: (v: string) => v || '-' },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '当前库存', dataIndex: 'currentStock', width: 80 },
    { title: '安全库存', dataIndex: 'safetyStock', width: 80 },
    { title: '分类', dataIndex: 'category', width: 80, render: (c: string) => c ? <Tag>{c}</Tag> : '-' },
    { title: '库位', dataIndex: 'location', width: 80, render: (v: string) => v || '-' },
    { title: '单价', dataIndex: 'price', width: 80, render: (p: number) => p != null ? `￥${p.toFixed(2)}` : '-' },
    { title: '操作', width: 220, render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openStockIn(r)}>入库</Button>
          <Button type="link" size="small" onClick={() => openStockOut(r)}>领用</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => remove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="备品备件管理" bodyStyle={{ padding: 0 }}>
      <Tabs defaultActiveKey="inventory" items={[
        { key: 'inventory', label: '备件台账', children: (
            <div style={{ padding: 16 }}>
              <Space style={{ marginBottom: 12 }}>
                <Input.Search placeholder="搜索编号/名称" allowClear onSearch={setKeyword} style={{ width: 240 }} />
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建备件</Button>
              </Space>
              <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" pagination={{ pageSize: 15 }} />
            </div>
          ),
        },
        { key: 'records', label: '流水记录', children: (
            <Table rowKey="id" dataSource={records} size="small" pagination={{ pageSize: 15 }} style={{ padding: 16 }}
              columns={[
                { title: '备件', render: (_: any, r: any) => r.part?.partName || '-' }, { title: '类型', dataIndex: 'type', width: 60, render: (t: string) => <Tag color={t === '入库' ? 'green' : 'orange'}>{t}</Tag> },
                { title: '数量', dataIndex: 'quantity', width: 60 }, { title: '变更前', dataIndex: 'beforeQty', width: 60 }, { title: '变更后', dataIndex: 'afterQty', width: 60 },
                { title: '操作人', dataIndex: 'operator', width: 80 }, { title: '参考', dataIndex: 'reference', width: 100 },
                { title: '时间', dataIndex: 'createdAt', width: 150, render: (v: string) => v?.split('T')[0] },
              ]} />
          ),
        },
        { key: 'warnings', label: '预警与采购建议', children: (
            <div style={{ padding: 16 }}>
              <Tabs size="small" items={[
                { key: 'w', label: `库存预警 (${warnings.length})`, children: (
                    <Table rowKey="id" dataSource={warnings} size="small" pagination={false}
                      columns={[
                        { title: '编号', dataIndex: 'partCode' }, { title: '名称', dataIndex: 'partName' },
                        { title: '当前库存', dataIndex: 'currentStock', render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{v}</span> },
                        { title: '安全库存', dataIndex: 'safetyStock' },
                      ]} />
                  ),
                },
                { key: 's', label: `采购建议 (${suggestions.length})`, children: (
                    <Table rowKey="partId" dataSource={suggestions} size="small" pagination={false}
                      columns={[
                        { title: '编号', dataIndex: 'partCode' }, { title: '名称', dataIndex: 'partName' },
                        { title: '当前库存', dataIndex: 'currentStock' }, { title: '安全库存', dataIndex: 'safetyStock' },
                        { title: '建议采购量', dataIndex: 'suggestQuantity' },
                        { title: '预估费用', dataIndex: 'estimatedCost', render: (v: number) => `￥${v.toFixed(2)}` },
                      ]} />
                  ),
                },
              ]} />
            </div>
          ),
        },
      ]} />

      <Modal title={editing ? '编辑备件' : '新建备件'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="partName" label="备件名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="spec" label="规格"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="unit" label="单位"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="safetyStock" label="安全库存"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="currentStock" label="当前库存"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="price" label="单价"><InputNumber style={{ width: '100%' }} prefix="￥" /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="分类"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="location" label="库位"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="备件入库" open={inModal} onOk={submitStockIn} onCancel={() => setInModal(false)}>
        <Form form={inForm} layout="vertical">
          <p>备件：<strong>{selectedPart?.partName}</strong> (当前库存: {selectedPart?.currentStock})</p>
          <Form.Item name="quantity" label="入库数量" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="operator" label="操作人"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="备件领用" open={outModal} onOk={submitStockOut} onCancel={() => setOutModal(false)}>
        <Form form={outForm} layout="vertical">
          <p>备件：<strong>{selectedPart?.partName}</strong> (当前库存: {selectedPart?.currentStock})</p>
          <Form.Item name="quantity" label="领用数量" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} max={selectedPart?.currentStock || 0} /></Form.Item>
          <Form.Item name="reference" label="关联单据"><Input placeholder="如维修工单号" /></Form.Item>
          <Form.Item name="operator" label="领用人"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
