import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, message, Modal, Descriptions, Form, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SyncOutlined, DatabaseOutlined } from '@ant-design/icons';
import { erpApi } from '../../services/api';
import dayjs from 'dayjs';

export default function MaterialsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await erpApi.getMaterials(keyword || undefined);
      setData(res);
      setPagination(prev => ({ ...prev, total: res.length }));
    } catch { message.error('加载物料列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await erpApi.syncMaterialsFromK3();
      message.success('金蝶物料同步成功');
      loadData();
    } catch (e) { message.error(e?.response?.data?.message || '同步失败'); }
    finally { setSyncing(false); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此物料吗？',
      onOk: async () => {
        try { await erpApi.deleteMaterial(id); message.success('已删除'); loadData(); }
        catch { message.error('删除失败'); }
      },
    });
  };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await erpApi.updateMaterial(editRecord.id, values);
        message.success('已更新');
      } else {
        await erpApi.createMaterial(values);
        message.success('已创建');
      }
      setEditOpen(false);
      setEditRecord(null);
      loadData();
    } catch { message.error('保存失败'); }
  };

  const columns = [
    { title: '物料编码', dataIndex: 'materialCode', width: 160 },
    { title: '物料名称', dataIndex: 'materialName', width: 200 },
    { title: '规格', dataIndex: 'spec', width: 140 },
    { title: '类别', dataIndex: 'category', width: 100 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '库存', dataIndex: 'stock', width: 80, render: (v) => <Tag color={v > 0 ? 'blue' : '#ccc'}>{v || 0}</Tag> },
    { title: '安全库存', dataIndex: 'safetyStock', width: 80, render: (v) => v > 0 ? v : '-' },
    { title: '状态', dataIndex: 'status', width: 80, render: (s) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 140, render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setDetail(r); setDetailOpen(true); }} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(r); setEditOpen(true); }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<span><DatabaseOutlined /> 物料管理</span>}
        extra={
          <Space>
            <Input.Search
              placeholder="搜索编码/名称"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onSearch={() => loadData()}
              style={{ width: 240 }}
            />
            <Button icon={<SyncOutlined />} loading={syncing} onClick={handleSync}>从金蝶同步</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setEditOpen(true); }}>新增物料</Button>
          </Space>
        }
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => '共 ' + t + ' 条' }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal title="物料详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700}>
        {detail && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="编码">{detail.materialCode}</Descriptions.Item>
            <Descriptions.Item label="名称">{detail.materialName}</Descriptions.Item>
            <Descriptions.Item label="规格">{detail.spec || '-'}</Descriptions.Item>
            <Descriptions.Item label="类别">{detail.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="单位">{detail.unit}</Descriptions.Item>
            <Descriptions.Item label="库存">{detail.stock ?? 0}</Descriptions.Item>
            <Descriptions.Item label="安全库存">{detail.safetyStock ?? 0}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={detail.status === 'active' ? 'green' : 'red'}>{detail.status === 'active' ? '启用' : '禁用'}</Tag></Descriptions.Item>
            <Descriptions.Item label="批次管理">{detail.batchManaged ? '是' : '否'}</Descriptions.Item>
            <Descriptions.Item label="单价">{detail.price ? '¥' + detail.price.toFixed(2) : '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{dayjs(detail.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title={editRecord ? '编辑物料' : '新增物料'} open={editOpen} onCancel={() => { setEditOpen(false); setEditRecord(null); }} footer={null} width={600}>
        <Form layout="vertical" initialValues={editRecord || { unit: 'Pcs', status: 'active', batchManaged: false }} onFinish={handleSave}>
          <Form.Item name="materialCode" label="物料编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input disabled={!!editRecord} />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="spec" label="规格"><Input /></Form.Item>
          <Form.Item name="category" label="类别"><Input /></Form.Item>
          <Form.Item name="unit" label="单位"><Input /></Form.Item>
          <Form.Item name="safetyStock" label="安全库存"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '禁用' }]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => { setEditOpen(false); setEditRecord(null); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
