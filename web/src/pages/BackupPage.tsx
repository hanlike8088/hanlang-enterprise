import { useState, useEffect } from 'react';
import { Button, Table, Card, Space, Popconfirm, Tag, message, Typography } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  RollbackOutlined,
  DeleteOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backups');
      setBackups(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await fetch('/api/backups', { method: 'POST' });
      message.success('备份已创建');
      fetchData();
    } catch {
      message.error('备份失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/backups/${id}`, { method: 'DELETE' });
    message.success('Deleted');
    fetchData();
  };

  const handleRestore = async (id: string) => {
    await fetch(`/api/backups/${id}/restore`, { method: 'POST' });
    message.success('Database restored - restart server if needed');
  };

  const columns = [
    { title: 'File', dataIndex: 'fileName', ellipsis: true },
    {
      title: 'Size',
      dataIndex: 'fileSize',
      render: (v: number) => `${(v / 1024 / 1024).toFixed(2)} MB`,
    },
    { title: 'Type', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: 'Actions',
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(`/api/backups/${r.id}/download`)}
          >
            Download
          </Button>
          <Popconfirm
            title="Restore this backup? Current data will be overwritten."
            onConfirm={() => handleRestore(r.id)}
          >
            <Button size="small" icon={<RollbackOutlined />}>
              Restore
            </Button>
          </Popconfirm>
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <CloudServerOutlined /> Data Backup
        </Title>
        <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={handleCreate}>
          Create Backup
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={backups}
        loading={loading}
        rowKey="id"
        size="middle"
        locale={{ emptyText: 'No backups yet' }}
      />
    </div>
  );
}
