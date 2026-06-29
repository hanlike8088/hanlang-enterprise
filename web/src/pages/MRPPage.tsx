import { useState } from 'react';
import {
  Button, Table, Card, Space, Tag, message, Popconfirm, Typography, Statistic, Row, Col,
} from 'antd';
import { PlayCircleOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function MRPPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mrp/runs');
      const data = await res.json();
      setRuns(data);
      if (data.length && !selectedRun) setSelectedRun(data[0]);
    } finally { setLoading(false); }
  };

  const runMrp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mrp/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : 'system' }),
      });
      if (res.ok) {
        message.success('MRP 运算完成');
        await fetchRuns();
      } else {
        const err = await res.json();
        message.error(err.message || 'MRP 运算失败');
      }
    } finally { setLoading(false); }
  };

  const deleteRun = async (id: string) => {
    await fetch(`/api/mrp/runs/${id}`, { method: 'DELETE' });
    message.success('已删除');
    if (selectedRun?.id === id) setSelectedRun(null);
    await fetchRuns();
  };

  const handleRowClick = (record: any) => {
    setSelectedRun(record);
  };

  const itemColumns = [
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 140 },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '总需求', dataIndex: 'totalDemand', key: 'totalDemand', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '缺口', dataIndex: 'shortage', key: 'shortage', width: 100,
      render: (v: number) => <span style={{ color: v > 0 ? '#ff4d4f' : '#52c41a', fontWeight: v > 0 ? 'bold' : 'normal' }}>{v.toFixed(2)}</span>
    },
    { title: '建议采购', dataIndex: 'suggestedQty', key: 'suggestedQty', width: 100, render: (v: number) => v.toFixed(2) },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => s === 'open' ? <Tag color="red">待采购</Tag> : <Tag color="green">库存充足</Tag>,
    },
    { title: '来源订单', dataIndex: 'sourceOrders', key: 'sourceOrders', ellipsis: true },
  ];

  const runColumns = [
    { title: '运算编号', dataIndex: 'runCode', key: 'runCode', width: 160 },
    { title: '运算时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Tag color={s === 'completed' ? 'green' : 'processing'}>{s === 'completed' ? '已完成' : '运算中'}</Tag> },
    { title: '总需求', dataIndex: 'totalDemand', key: 'totalDemand', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '总缺口', dataIndex: 'totalShortage', key: 'totalShortage', width: 100, render: (v: number) => <span style={{ color: v > 0 ? '#ff4d4f' : '#52c41a' }}>{v.toFixed(2)}</span> },
    { title: '物料项数', dataIndex: 'itemsCount', key: 'itemsCount', width: 80 },
    {
      title: '', key: 'actions', width: 60,
      render: (_: any, record: any) => (
        <Popconfirm title="确认删除？" onConfirm={() => deleteRun(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>MRP 运算</Title>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={runMrp} loading={loading}>
          执行 MRP 运算
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchRuns}>刷新</Button>
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="运算次数" value={runs.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待处理物料" value={selectedRun?.items?.filter((i: any) => i.status === 'open').length || 0} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总缺口数量" value={selectedRun?.totalShortage || 0} precision={2} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="最近运算" value={runs.length > 0 ? new Date(runs[0].createdAt).toLocaleDateString() : '-'} />
          </Card>
        </Col>
      </Row>

      <Card title="运算历史" size="small" style={{ marginBottom: 16 }}>
        <Table
          dataSource={runs}
          columns={runColumns}
          rowKey="id"
          size="small"
          loading={loading}
          onRow={(record) => ({ onClick: () => handleRowClick(record), style: { cursor: 'pointer', background: selectedRun?.id === record.id ? '#e6f7ff' : undefined } })}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {selectedRun && (
        <Card title={`运算明细 — ${selectedRun.runCode}`} size="small">
          <Table
            dataSource={selectedRun.items || []}
            columns={itemColumns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      )}
    </div>
  );
}
