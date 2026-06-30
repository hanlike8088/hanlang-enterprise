import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  Tabs,
  Table,
  message,
  Modal,
  Form,
  Empty,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  ReadOutlined,
  FolderOutlined,
  TagsOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function KnowledgePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingArticle, setViewingArticle] = useState<any>(null);
  const [form] = Form.useForm();
  const token = localStorage.getItem('access_token');
  const api = (url: string, opts?: RequestInit) =>
    fetch(url, {
      ...opts,
      headers: {
        ...(opts?.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).then((r) => r.json());

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (keyword) params.set('keyword', keyword);
      const data = await api(`/api/knowledge/articles?${params}`);
      setArticles(data || []);
    } catch {
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [cats, st] = await Promise.all([
        api('/api/knowledge/categories'),
        api('/api/knowledge/stats'),
      ]);
      setCategories(cats || []);
      setStats(st);
    } catch {}
  };

  useEffect(() => {
    loadArticles();
    loadMeta();
  }, []);

  const openModal = (record?: any) => {
    setEditingId(record?.id || null);
    if (record) form.setFieldsValue(record);
    else form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const vals = await form.validateFields();
    try {
      if (editingId) {
        await api(`/api/knowledge/articles/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(vals),
        });
      } else {
        await api('/api/knowledge/articles', { method: 'POST', body: JSON.stringify(vals) });
      }
      message.success(editingId ? '已更新' : '已创建');
      setModalOpen(false);
      loadArticles();
      loadMeta();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定删除该知识文章？',
      onOk: async () => {
        try {
          await api(`/api/knowledge/articles/${id}`, { method: 'DELETE' });
          message.success('已删除');
          loadArticles();
          loadMeta();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleView = async (id: string) => {
    try {
      const data = await api(`/api/knowledge/articles/${id}`);
      setViewingArticle(data);
    } catch {
      message.error('获取文章详情失败');
    }
  };

  const columns = [
    { title: '编号', dataIndex: 'articleCode', key: 'ac', width: 140 },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (v: string, r: any) => <a onClick={() => handleView(r.id)}>{v}</a>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'cat',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (v: string) =>
        v ? v.split(',').map((t: string) => <Tag key={t}>{t.trim()}</Tag>) : '-',
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      render: (v: string) => v || '-',
    },
    { title: '版本', dataIndex: 'version', key: 'ver', width: 60 },
    { title: '浏览', dataIndex: 'viewCount', key: 'vc', width: 60 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'st',
      width: 80,
      render: (v: string) => {
        const m: Record<string, string> = { draft: 'default', published: 'green' };
        return <Tag color={m[v]}>{v === 'draft' ? '草稿' : '已发布'}</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'uat',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'op',
      width: 160,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r.id)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(r.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <ReadOutlined /> 知识管理
      </Title>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="文章总数" value={stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已发布" value={stats.published} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="草稿" value={stats.draft} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="分类数" value={stats.categories?.length || 0} />
            </Card>
          </Col>
        </Row>
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索标题、内容、标签..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            onPressEnter={loadArticles}
          />
          <Select
            placeholder="分类筛选"
            allowClear
            style={{ width: 200 }}
            value={filterCategory || undefined}
            onChange={(v) => {
              setFilterCategory(v || '');
            }}
            options={categories.map((c: any) => ({
              value: c.category,
              label: `${c.category} (${c.count})`,
            }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={loadArticles}>
            搜索
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增文章
          </Button>
        </Space>
      </Card>

      <Card size="small" title={<>知识文章列表</>}>
        <Table
          dataSource={articles}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑文章' : '新增文章'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" initialValue="general">
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="标签（多个用逗号分隔）">
            <Input placeholder="如：质量, ISO, SPC" />
          </Form.Item>
          <Form.Item name="author" label="作者">
            <Input />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={12} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="draft">
            <Select
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'published', label: '发布' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <>
            <ReadOutlined /> {viewingArticle?.title}
          </>
        }
        open={!!viewingArticle}
        onCancel={() => setViewingArticle(null)}
        footer={null}
        width={800}
      >
        {viewingArticle && (
          <div>
            <Space style={{ marginBottom: 12 }}>
              <Tag color="blue">{viewingArticle.category}</Tag>
              {viewingArticle.tags?.split(',').map((t: string) => (
                <Tag key={t}>{t.trim()}</Tag>
              ))}
              <Tag color={viewingArticle.status === 'published' ? 'green' : 'default'}>
                {viewingArticle.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            </Space>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                作者: {viewingArticle.author || '-'} | 版本: v{viewingArticle.version} | 浏览:{' '}
                {viewingArticle.viewCount} | 更新:{' '}
                {dayjs(viewingArticle.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
            <div
              style={{
                background: '#fafafa',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                maxHeight: 500,
                overflow: 'auto',
                border: '1px solid #f0f0f0',
              }}
            >
              {viewingArticle.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
