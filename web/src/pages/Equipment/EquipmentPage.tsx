import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Card,
  Tag,
  message,
  Popconfirm,
  Tabs,
  Upload,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { equipmentApi } from '../../services/equipment';;

const statusColors: Record<string, string> = {
  运行中: 'green',
  停机: 'default',
  维修中: 'orange',
  报废: 'red',
};
const categoryColors: Record<string, string> = { 自制设备: 'blue', 外购设备: 'purple' };

export default function EquipmentPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [detail, setDetail] = useState<any>(null);
  const [patents, setPatents] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [form] = Form.useForm();
  const [docForm] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [eqs, st] = await Promise.all([
        equipmentApi.getEquipments(keyword || undefined, statusFilter, categoryFilter),
        equipmentApi.getEquipmentStats(),
      ]);
      setData(eqs);
      setStats(st);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, [keyword, statusFilter, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ category: '外购设备', status: '运行中' });
    setModalOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      purchaseDate: r.purchaseDate ? r.purchaseDate.split('T')[0] : undefined,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await equipmentApi.updateEquipment(editing.id, values);
      message.success('设备已更新');
    } else {
      await equipmentApi.createEquipment(values);
      message.success('设备已创建');
    }
    setModalOpen(false);
    fetch();
  };

  const remove = async (id: string) => {
    await equipmentApi.deleteEquipment(id);
    message.success('设备已删除');
    fetch();
  };

  const viewDetail = async (r: any) => {
    setDetail(r);
    try {
      const [eq, p, d] = await Promise.all([
        equipmentApi.getEquipment(r.id),
        equipmentApi.getPatents(),
        equipmentApi.getDocuments(r.id),
      ]);
      setDetail(eq);
      setPatents(p);
      setDocs(d);
    } catch {}
  };

  const addDoc = async () => {
    if (!detail) return;
    const v = await docForm.validateFields();
    await equipmentApi.createDocument(detail.id, v);
    message.success('文档已添加');
    docForm.resetFields();
    const d = await equipmentApi.getDocuments(detail.id);
    setDocs(d);
  };

  const removeDoc = async (docId: string) => {
    await equipmentApi.deleteDocument(docId);
    message.success('文档已删除');
    setDocs(docs.filter((d) => d.id !== docId));
  };

  const columns = [
    { title: '编号', dataIndex: 'equipmentCode', key: 'code', width: 120 },
    { title: '名称', dataIndex: 'equipmentName', key: 'name', ellipsis: true },
    {
      title: '型号',
      dataIndex: 'modelNo',
      key: 'model',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '厂商',
      dataIndex: 'manufacturer',
      key: 'mfr',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'loc',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'cat',
      width: 90,
      render: (c: string) => <Tag color={categoryColors[c]}>{c}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: '购入日期',
      dataIndex: 'purchaseDate',
      key: 'pd',
      width: 110,
      render: (v: string) => (v ? v.split('T')[0] : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => viewDetail(r)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该设备？" onConfirm={() => remove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="设备台账管理" bodyStyle={{ padding: 0 }}>
      <Tabs
        defaultActiveKey="list"
        items={[
          {
            key: 'list',
            label: '设备列表',
            children: (
              <>
                <Row gutter={16} style={{ padding: 16 }}>
                  <Col span={6}>
                    <Statistic title="设备总数" value={stats.total || 0} />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="待处理维修"
                      value={stats.pendingRepairs || 0}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic title="今日点检任务" value={stats.todayPlans || 0} />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="备件预警"
                      value={stats.spareWarnings || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
                <Space style={{ padding: '0 16px', marginBottom: 12 }}>
                  <Input.Search
                    placeholder="搜索编号/名称/型号/厂商"
                    allowClear
                    onSearch={setKeyword}
                    style={{ width: 280 }}
                  />
                  <Select
                    placeholder="状态"
                    allowClear
                    style={{ width: 110 }}
                    onChange={setStatusFilter}
                    options={['运行中', '停机', '维修中', '报废'].map((v) => ({
                      label: v,
                      value: v,
                    }))}
                  />
                  <Select
                    placeholder="分类"
                    allowClear
                    style={{ width: 110 }}
                    onChange={setCategoryFilter}
                    options={['自制设备', '外购设备'].map((v) => ({ label: v, value: v }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    新建设备
                  </Button>
                </Space>
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={data}
                  loading={loading}
                  size="small"
                  pagination={{ pageSize: 15 }}
                />
              </>
            ),
          },
          ...(detail
            ? [
                {
                  key: 'detail',
                  label: '设备详情',
                  children: (
                    <div style={{ padding: 16 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Card title="基本信息" size="small">
                            <p>
                              <strong>编号：</strong>
                              {detail.equipmentCode}
                            </p>
                            <p>
                              <strong>名称：</strong>
                              {detail.equipmentName}
                            </p>
                            <p>
                              <strong>型号：</strong>
                              {detail.modelNo || '-'}
                            </p>
                            <p>
                              <strong>厂商：</strong>
                              {detail.manufacturer || '-'}
                            </p>
                            <p>
                              <strong>位置：</strong>
                              {detail.location || '-'}
                            </p>
                            <p>
                              <strong>分类：</strong>
                              <Tag color={categoryColors[detail.category]}>{detail.category}</Tag>
                            </p>
                            <p>
                              <strong>状态：</strong>
                              <Tag color={statusColors[detail.status]}>{detail.status}</Tag>
                            </p>
                            <p>
                              <strong>购入日期：</strong>
                              {detail.purchaseDate ? detail.purchaseDate.split('T')[0] : '-'}
                            </p>
                            <p>
                              <strong>关联专利：</strong>
                              {patents.find((p: any) => p.id === detail.patentId)?.docName ||
                                '未关联'}
                            </p>
                            <p>
                              <strong>描述：</strong>
                              {detail.description || '-'}
                            </p>
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card
                            title="设备文档"
                            size="small"
                            extra={
                              <Upload>
                                <Button size="small" icon={<UploadOutlined />}>
                                  上传
                                </Button>
                              </Upload>
                            }
                          >
                            <Form form={docForm} layout="inline" style={{ marginBottom: 8 }}>
                              <Form.Item
                                name="docName"
                                rules={[{ required: true, message: '文档名称' }]}
                              >
                                <Input placeholder="文档名称" size="small" />
                              </Form.Item>
                              <Form.Item name="docType" initialValue="图纸">
                                <Select
                                  size="small"
                                  style={{ width: 80 }}
                                  options={['图纸', '说明书', '其他'].map((v) => ({
                                    label: v,
                                    value: v,
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item name="fileName">
                                <Input placeholder="文件名" size="small" />
                              </Form.Item>
                              <Form.Item name="filePath">
                                <Input placeholder="文件路径" size="small" />
                              </Form.Item>
                              <Button
                                type="primary"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={addDoc}
                              >
                                添加
                              </Button>
                            </Form>
                            <Table
                              rowKey="id"
                              dataSource={docs}
                              size="small"
                              pagination={false}
                              columns={[
                                { title: '名称', dataIndex: 'docName' },
                                { title: '类型', dataIndex: 'docType', width: 70 },
                                { title: '文件名', dataIndex: 'fileName', width: 120 },
                                {
                                  title: '上传时间',
                                  dataIndex: 'createdAt',
                                  width: 110,
                                  render: (v: string) => v?.split('T')[0],
                                },
                                {
                                  title: '操作',
                                  width: 60,
                                  render: (_: any, d: any) => (
                                    <Popconfirm title="删除？" onConfirm={() => removeDoc(d.id)}>
                                      <Button type="link" size="small" danger>
                                        删除
                                      </Button>
                                    </Popconfirm>
                                  ),
                                },
                              ]}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />

      <Modal
        title={editing ? '编辑设备' : '新建设备'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="equipmentName" label="设备名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="modelNo" label="型号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturer" label="厂商">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="位置">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchaseDate" label="购入日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: '自制设备', value: '自制设备' },
                    { label: '外购设备', value: '外购设备' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select
                  options={['运行中', '停机', '维修中', '报废'].map((v) => ({
                    label: v,
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="patentId" label="关联专利">
            <Select
              allowClear
              placeholder="选择专利"
              options={patents.map((p: any) => ({ label: p.docName, value: p.id }))}
              showSearch
              filterOption={(i: string, o: any) => o.label.includes(i)}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
