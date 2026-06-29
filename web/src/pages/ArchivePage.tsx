import { useState, useEffect } from 'react';
import { Button, Table, Card, Space, Select, InputNumber, Tag, message, Typography } from 'antd';
import { PlayCircleOutlined, HistoryOutlined, FolderOpenOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ENTITY_OPTIONS = [
  { label: '打样工单', value: 'sampling_work_orders' },
  { label: '采购订单', value: 'purchase_orders' },
  { label: 'CRM销售订单', value: 'crm_orders' },
  { label: '生产工单', value: 'manufacturing_orders' },
  { label: '维修工单', value: 'maintenance_work_orders' },
  { label: '已读通知', value: 'notifications' },
];

export default function ArchivePage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [entityType, setEntityType] = useState('sampling_work_orders');
  const [months, setMonths] = useState(12);

  const fetchRuns = async () => {
    setLoading(true);
    try { const res = await fetch('/api/archives/runs'); setRuns(await res.json()); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRuns(); }, []);

  const handleArchive = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/archives/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, olderThanMonths: months, triggeredBy: 'admin' }),
      });
      const result = await res.json();
      if (result.status === 'failed') message.error(`Failed: ${result.error}`);
      else message.success(`Archived ${result.recordsCount} records`);
      fetchRuns();
    } catch { message.error('归档失败'); }
    finally { setRunning(false); }
  };

  const columns = [
    { title: 'Entity', dataIndex: 'entityType', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Cutoff', dataIndex: 'olderThan', render: (v: string) => new Date(v).toLocaleDateString('zh-CN') },
    { title: 'Records', dataIndex: 'recordsCount' },
    { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Error', dataIndex: 'error', render: (v: string) => v ? <Tag color="red">{v}</Tag> : '-' },
    { title: 'When', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString('zh-CN') },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={4}><FolderOpenOutlined /> Data Archive</Title>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <span>Entity:</span>
          <Select value={entityType} onChange={setEntityType} options={ENTITY_OPTIONS} style={{ width: 220 }} />
          <span>Older than (months):</span>
          <InputNumber min={1} max={60} value={months} onChange={v => setMonths(v || 12)} />
          <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={handleArchive}>Run Archive</Button>
        </Space>
      </Card>
      <Title level={5}><HistoryOutlined /> Archive History</Title>
      <Table columns={columns} dataSource={runs} loading={loading} rowKey="id" size="small" locale={{ emptyText: 'No archive runs yet' }} />
    </div>
  );
}
