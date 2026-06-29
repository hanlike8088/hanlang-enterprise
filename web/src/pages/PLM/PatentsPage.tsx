import { useEffect, useState } from 'react';
import { Table, Button, Select, Space, Card, Tag, message, Popconfirm, Modal, Typography, Badge } from 'antd';
import { DeleteOutlined, FilePdfOutlined, ReloadOutlined, LinkOutlined, WarningOutlined } from '@ant-design/icons';
import { plmApi } from '../../services/api';
import dayjs from 'dayjs';

const patentTypeColors: Record<string, string> = { '设备专利': 'blue', '结构专利': 'green', '工艺专利': 'orange' };

export default function 专利管理Page() {
  const [patents, set专利管理] = useState<any[]>([]);
  const [expiring专利管理, set即将到期专利管理] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [patentType, set专利Type] = useState<string | undefined>(undefined);
  const [expiringModalOpen, set即将到期ModalOpen] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [data, expiring] = await Promise.all([
        plmApi.getPatents(patentType),
        plmApi.getExpiringPatents(90),
      ]);
      set专利管理(data);
      set即将到期专利管理(expiring);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [patentType]);

  const remove = async (id: string) => {
    await plmApi.deleteDocument(id);
    message.success('专利已删除');
    fetch();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const columns = [
    { title: '专利编码', dataIndex: 'docCode', key: 'docCode', width: 150 },
    {
      title: '专利名称', dataIndex: 'docName', key: 'docName', ellipsis: true,
      render: (name: string, r: any) => (
        <a href={'file:///' + r.filePath?.replace(/\\/g, '/')} target="_blank" rel="noreferrer">
          <FilePdfOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />{name}
        </a>
      ),
    },
    {
      title: '专利类型', dataIndex: 'patentType', key: 'patentType', width: 110,
      render: (t: string) => t ? <Tag color={patentTypeColors[t] || 'default'}>{t}</Tag> : <Tag>未分类</Tag>,
    },
    {
      title: '关联产品', dataIndex: 'product', key: 'product', width: 180,
      render: (p: any) => p ? <Tag color="cyan">{p.productCode} - {p.productName}</Tag> : <Tag>未关联</Tag>,
    },
    {
      title: '到期日', dataIndex: 'expirationDate', key: 'expirationDate', width: 110,
      render: (d: string) => {
        if (!d) return '-';
        const date = dayjs(d);
        const daysLeft = date.diff(dayjs(), 'day');
        return <span style={{ color: daysLeft <= 90 ? '#ff4d4f' : undefined }}>{date.format('YYYY-MM-DD')}</span>;
      },
    },
    { title: '版本', dataIndex: 'version', key: 'version', width: 70 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, r: any) => (
        <Popconfirm title="确定删除该专利？" onConfirm={() => remove(r.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <span>专利管理</span>
            {expiring专利管理.length > 0 && (
              <Badge count={expiring专利管理.length} size="small">
                <Button size="small" type="link" danger icon={<WarningOutlined />} onClick={() => set即将到期ModalOpen(true)}>
                  即将到期
                </Button>
              </Badge>
            )}
          </Space>
        }
        extra={
          <Space>
            <Select
              allowClear
              placeholder="按类型筛选"
              style={{ width: 130 }}
              value={patentType}
              onChange={set专利Type}
              options={['设备专利', '结构专利', '工艺专利'].map(t => ({ value: t, label: t }))}
            />
            <Button icon={<ReloadOutlined />} onClick={fetch}>刷新</Button>
          </Space>
        }
      >
        <Table dataSource={patents} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} />
      </Card>

      <Modal title="即将到期的专利" open={expiringModalOpen} onCancel={() => set即将到期ModalOpen(false)} footer={null} width={700}>
        <Table dataSource={expiring专利管理} rowKey="id" size="small" pagination={false}
          columns={[
            { title: '专利名称', dataIndex: 'docName', ellipsis: true },
            {
              title: '到期日', dataIndex: 'expirationDate', width: 120,
              render: (d: string) => {
                const daysLeft = dayjs(d).diff(dayjs(), 'day');
                return <Tag color={daysLeft <= 30 ? 'red' : 'orange'}>{dayjs(d).format('YYYY-MM-DD')} ({daysLeft}天)</Tag>;
              },
            },
            { title: '关联产品', dataIndex: ['product', 'productName'], width: 150, render: (v: string) => v || '-' },
            { title: '类型', dataIndex: 'patentType', width: 100, render: (t: string) => t || '-' },
          ]}
        />
      </Modal>
    </>
  );
}