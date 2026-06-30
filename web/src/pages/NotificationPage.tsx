import { useState, useEffect, useCallback } from 'react';
import { Button, List, Tag, Space, Typography, Popconfirm, message, Empty } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const CURRENT_USER_ID = 'admin';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntity?: string;
}

const typeColor: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  error: 'red',
  success: 'green',
  announcement: 'purple',
};

export default function NotificationPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${CURRENT_USER_ID}`);
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: CURRENT_USER_ID }),
    });
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    message.success('全部标记已读');
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCleanup = async () => {
    await fetch(`/api/notifications/read/cleanup?userId=${CURRENT_USER_ID}`, { method: 'DELETE' });
    message.success('已读通知已清除');
    fetchData();
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <BellOutlined /> 通知中心
        </Title>
        <Space>
          <Button
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
            disabled={!(items || []).some((i) => !i.isRead)}
          >
            All Read
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleCleanup}
            disabled={!(items || []).some((i) => i.isRead)}
          >
            Clear Read
          </Button>
        </Space>
      </div>

      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: <Empty description="No notifications" /> }}
        renderItem={(item: Notification) => (
          <List.Item
            style={{
              background: item.isRead ? 'transparent' : '#f6ffed',
              padding: '12px 16px',
              borderRadius: 6,
              marginBottom: 4,
            }}
            actions={[
              !item.isRead && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleMarkRead(item.id)}
                >
                  Read
                </Button>
              ),
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(item.id)}
              />,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={<Tag color={typeColor[item.type] || 'blue'}>{item.type}</Tag>}
              title={<Text strong={!item.isRead}>{item.title}</Text>}
              description={
                <div>
                  <div>{item.body}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                    {item.relatedEntity && ` · ${item.relatedEntity}`}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
