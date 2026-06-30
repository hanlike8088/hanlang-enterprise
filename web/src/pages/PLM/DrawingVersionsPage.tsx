import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Statistic,
  Row,
  Col,
  Card,
  Descriptions,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  HistoryOutlined,
  EyeOutlined,
  DeleteOutlined,
  SwapOutlined,
  DiffOutlined,
} from '@ant-design/icons';
import { drawingApi } from '../../services/drawing';
import { plmApi } from '../../services/plm';;
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '现行有效' },
  archived: { color: 'default', label: '已归档' },
};

const CATEGORY_OPTIONS = [
  { label: '装配图', value: 'Assembly' },
  { label: '零件图', value: 'Part' },
  { label: '电路图', value: 'Circuit' },
  { label: '气路图', value: 'Pneumatic' },
  { label: '模具图', value: 'Mold' },
  { label: '工艺图', value: 'Process' },
];

export default function Drawing版本sPage() {
  const [drawings, set图纸管理] = useState<any[]>([]);
  const [products, set产品管理] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [versionOpen, set版本Open] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [versions, set版本s] = useState<any[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [versionForm] = Form.useForm();
  const [statTotal, setStatTotal] = useState(0);
  const [statActive, setStatActive] = useState(0);

  const load图纸管理 = async () => {
    setLoading(true);
    try {
      const data = await drawingApi.getDrawings(undefined, filterStatus);
      set图纸管理(data);
      const active = data.filter((d: any) => d.status === 'active').length;
      setStatTotal(data.length);
      setStatActive(active);
    } catch (e: any) {
      message.error('加载图纸失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load图纸管理();
    plmApi
      .getProducts()
      .then(set产品管理)
      .catch(() => {});
  }, [filterStatus]);

  const handleCreate = async (values: any) => {
    try {
      await drawingApi.createDrawing({
        drawingCode: values.drawingCode,
        drawingName: values.drawingName,
        productId: values.productId || undefined,
        category: values.category,
        description: values.description,
        uploadBy: values.uploadBy || 'user',
        docType: values.docType || 'pdf',
        fileName: values.fileName || '',
        filePath: values.filePath || '',
      });
      message.success('图纸已创建');
      setCreateOpen(false);
      form.resetFields();
      load图纸管理();
    } catch (e: any) {
      message.error(e.response?.data?.message || '创建失败');
    }
  };

  const handleAdd版本 = async (values: any) => {
    if (!selectedDrawing) return;
    try {
      await drawingApi.addVersion(selectedDrawing.id, {
        changeNote: values.changeNote,
        uploadBy: values.uploadBy || 'user',
        docType: values.docType || 'pdf',
        fileName: values.fileName || '',
        filePath: values.filePath || '',
      });
      message.success('新版本已添加');
      set版本Open(false);
      versionForm.resetFields();
      load图纸管理();
      if (detailOpen) handleViewDetail(selectedDrawing.id);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed');
    }
  };

  const handleCompare版本s = async (drawingId: string, v1Id: string, v2Id: string) => {
    try {
      const data = await drawingApi.compareVersions(drawingId, v1Id, v2Id);
      setCompareData(data);
      setCompareOpen(true);
    } catch {
      message.error('比对失败');
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const drawing = await drawingApi.getDrawing(id);
      setSelectedDrawing(drawing);
      set版本s(drawing.versions || []);
      setDetailOpen(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'This will delete the drawing and all versions.',
      okType: 'danger',
      onOk: async () => {
        try {
          await drawingApi.deleteDrawing(id);
          message.success('Deleted');
          load图纸管理();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    { title: 'Code', dataIndex: 'drawingCode', key: 'drawingCode', width: 130 },
    { title: 'Name', dataIndex: 'drawingName', key: 'drawingName', width: 200 },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (c: string) => c || '-',
    },
    {
      title: '版本',
      dataIndex: 'latest版本',
      key: 'latest版本',
      width: 100,
      render: (v: string) => (v ? <Tag color="blue">{v}</Tag> : '-'),
    },
    {
      title: 'Count',
      key: 'versionCount',
      width: 80,
      render: (_: any, r: any) => r.versions?.length || 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => {
        const st = STATUS_MAP[s] || { color: 'default', label: s };
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            Detail
          </Button>
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => {
              setSelectedDrawing(record);
              set版本Open(true);
            }}
          >
            New Ver
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total" value={statTotal} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active" value={statActive} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Space>
              <span>筛选：</span>
              <Select
                allowClear
                placeholder="全部"
                style={{ width: 120 }}
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: '现行有效', value: 'active' },
                  { label: '已归档', value: 'archived' },
                ]}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCreateOpen(true);
          }}
        >
          New Drawing
        </Button>
      </div>

      <Table
        dataSource={drawings}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title="New Drawing"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={550}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="drawingCode" label="Code" rules={[{ required: true }]}>
            <Input placeholder="e.g. DWG-001" />
          </Form.Item>
          <Form.Item name="drawingName" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Motor Assembly" />
          </Form.Item>
          <Form.Item name="productId" label="产品">
            <Select
              allowClear
              placeholder="选择产品"
              options={products.map((p: any) => ({
                value: p.id,
                label: p.productCode + ' - ' + p.productName,
              }))}
            />
          </Form.Item>
          <Form.Item name="category" label="类别">
            <Select placeholder="选择类别" options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="图纸描述" />
          </Form.Item>
          <Form.Item name="uploadBy" label="上传者" initialValue="user">
            <Input placeholder="上传者姓名" />
          </Form.Item>
          <Form.Item name="fileName" label="File">
            <Input placeholder="e.g. assembly_v1.pdf" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={'New 版本 - ' + (selectedDrawing?.drawingName || '')}
        open={versionOpen}
        onCancel={() => {
          set版本Open(false);
          versionForm.resetFields();
        }}
        footer={null}
        width={550}
      >
        <Form form={versionForm} layout="vertical" onFinish={handleAdd版本}>
          <Form.Item name="changeNote" label="变更说明" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="描述变更内容" />
          </Form.Item>
          <Form.Item name="uploadBy" label="上传者" initialValue="user">
            <Input />
          </Form.Item>
          <Form.Item name="fileName" label="File">
            <Input placeholder="e.g. assembly_v2.pdf" />
          </Form.Item>
          <Form.Item name="docType" label="Type">
            <Select
              options={[
                { label: 'PDF', value: 'pdf' },
                { label: 'DWG', value: 'dwg' },
                { label: 'JPG', value: 'jpg' },
                { label: 'PNG', value: 'png' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add 版本
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Drawing Detail"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>Close</Button>}
        width={700}
      >
        {selectedDrawing && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Code">{selectedDrawing.drawingCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{selectedDrawing.drawingName}</Descriptions.Item>
              <Descriptions.Item label="类别">{selectedDrawing.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_MAP[selectedDrawing.status]?.color}>
                  {STATUS_MAP[selectedDrawing.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                <Tag color="blue">{selectedDrawing.latest版本}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(selectedDrawing.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedDrawing.description || '-'}
              </Descriptions.Item>
            </Descriptions>
            <Title level={5}>版本 History ({versions.length})</Title>
            <Table
              dataSource={versions}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: '版本',
                  dataIndex: 'version',
                  width: 80,
                  render: (v: string, r: any) => (r.isLatest ? <Tag color="blue">{v}</Tag> : v),
                },
                { title: 'Change', dataIndex: 'changeNote', render: (n: string) => n || '-' },
                {
                  title: 'File',
                  dataIndex: 'fileName',
                  width: 150,
                  render: (n: string) => n || '-',
                },
                { title: 'Type', dataIndex: 'docType', width: 70 },
                { title: 'Uploader', dataIndex: 'uploadBy', width: 90 },
                {
                  title: 'Compare',
                  key: 'verActions',
                  width: 80,
                  render: (_: any, vr: any) =>
                    vr.isLatest ? null : (
                      <Button
                        size="small"
                        icon={<DiffOutlined />}
                        onClick={() => {
                          if (selectedDrawing) {
                            const lv = versions.find((v: any) => v.isLatest);
                            if (lv) handleCompare版本s(selectedDrawing.id, vr.id, lv.id);
                          }
                        }}
                      >
                        Compare
                      </Button>
                    ),
                },
                {
                  title: 'Time',
                  dataIndex: 'createdAt',
                  width: 120,
                  render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="版本 Compare"
        open={compareOpen}
        onCancel={() => setCompareOpen(false)}
        footer={<Button onClick={() => setCompareOpen(false)}>Close</Button>}
        width={600}
      >
        {compareData && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title={'Ver ' + compareData.version1?.version}>
                  <p>Uploader: {compareData.version1?.uploadBy}</p>
                  <p>
                    Time:{' '}
                    {compareData.version1?.createdAt
                      ? dayjs(compareData.version1.createdAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </p>
                  <p>File: {compareData.version1?.fileName || '-'}</p>
                  <p>Note: {compareData.version1?.changeNote || '-'}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={'Ver ' + compareData.version2?.version}>
                  <p>Uploader: {compareData.version2?.uploadBy}</p>
                  <p>
                    Time:{' '}
                    {compareData.version2?.createdAt
                      ? dayjs(compareData.version2.createdAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </p>
                  <p>File: {compareData.version2?.fileName || '-'}</p>
                  <p>Note: {compareData.version2?.changeNote || '-'}</p>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </div>
  );
}
