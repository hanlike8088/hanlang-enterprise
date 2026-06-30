import { useEffect, useState, useMemo } from 'react';
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
  Row,
  Col,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  SettingOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { plmApi } from '../../services/plm';
import { erpApi } from '../../services/erp';
import { drawingApi } from '../../services/drawing';;
import dayjs from 'dayjs';

const statusColors: Record<string, string> = {
  开发中: 'blue',
  试产中: 'orange',
  已发布: 'green',
  已停产: 'default',
};

const specFields = [
  { key: 'voltage', label: '电压' },
  { key: 'power', label: '功率' },
  { key: 'speed', label: '转速' },
  { key: 'torque', label: '转矩' },
];

export default function 产品管理Page() {
  const [products, set产品管理] = useState<any[]>([]);
  const [materials, set物料管理] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [bomProduct, setBomProduct] = useState<any>(null);
  const [bomList, setBomList] = useState<any[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [bomEditing, setBomEditing] = useState<any>(null);
  const [bomForm] = Form.useForm();

  const [drawingsModalOpen, set图纸管理ModalOpen] = useState(false);
  const [drawingProduct, setDrawingProduct] = useState<any>(null);
  const [drawings, set图纸管理] = useState<any[]>([]);

  const [patentsModalOpen, set专利管理ModalOpen] = useState(false);
  const [patentProduct, set专利Product] = useState<any>(null);
  const [patents, set专利管理] = useState<any[]>([]);

  const fetch = async () => {
    setLoading(true);
    try {
      const [prods, mats] = await Promise.all([plmApi.getProducts(), erpApi.getMaterials()]);
      set产品管理(prods);
      set物料管理(mats);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    const specs = safeParseSpecs(r.specifications);
    form.setFieldsValue({ ...r, ...specs });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const specs: any = {};
    specFields.forEach((f) => {
      if (values[f.key] !== undefined && values[f.key] !== '') specs[f.key] = values[f.key];
    });
    delete values.voltage;
    delete values.power;
    delete values.speed;
    delete values.torque;
    const payload = {
      ...values,
      specifications: Object.keys(specs).length > 0 ? JSON.stringify(specs) : undefined,
    };
    if (editing) {
      await plmApi.updateProduct(editing.id, payload);
      message.success('产品已更新');
    } else {
      await plmApi.createProduct(payload);
      message.success('产品已创建');
    }
    setModalOpen(false);
    fetch();
  };

  const remove = async (id: string) => {
    await plmApi.deleteProduct(id);
    message.success('产品已删除');
    fetch();
  };

  const openBomMgr = async (product: any) => {
    setBomProduct(product);
    setBomEditing(null);
    bomForm.resetFields();
    setBomModalOpen(true);
    await loadBoms(product.id);
  };

  const loadBoms = async (productId: string) => {
    setBomLoading(true);
    try {
      const list = await plmApi.getBoms(productId);
      setBomList(list);
    } finally {
      setBomLoading(false);
    }
  };

  const submitBom = async () => {
    const values = await bomForm.validateFields();
    if (bomEditing) {
      await plmApi.updateBom(bomEditing.id, values);
      message.success('BOM 已更新');
    } else {
      await plmApi.createBom({ ...values, productId: bomProduct.id });
      message.success('BOM 已添加');
    }
    bomForm.resetFields();
    setBomEditing(null);
    await loadBoms(bomProduct.id);
  };

  const editBom = (bom: any) => {
    setBomEditing(bom);
    bomForm.setFieldsValue({
      materialId: bom.materialId,
      quantity: bom.quantity,
      unit: bom.unit,
      version: bom.version,
    });
  };

  const deleteBom = async (id: string) => {
    await plmApi.deleteBom(id);
    message.success('BOM 已删除');
    setBomEditing(null);
    bomForm.resetFields();
    await loadBoms(bomProduct.id);
  };

  const cancelBomEdit = () => {
    setBomEditing(null);
    bomForm.resetFields();
  };

  const safeParseSpecs = (json: string | null | undefined) => {
    if (!json) return {};
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  const renderSpecs = (json: string | null | undefined) => {
    const s = safeParseSpecs(json);
    const parts: string[] = [];
    if (s.voltage) parts.push(s.voltage + 'V');
    if (s.power) parts.push(s.power + 'W');
    if (s.speed) parts.push(s.speed + 'rpm');
    if (s.torque) parts.push(s.torque + 'Nm');
    return parts.length > 0 ? parts.join(' / ') : '-';
  };

  const filtered产品管理 = useMemo(() => {
    return products.filter((p) => {
      if (searchText && !p.productName.includes(searchText) && !p.productCode.includes(searchText))
        return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [products, searchText, filterCategory, filterStatus]);

  const allCategories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[],
    [products],
  );

  const productColumns = [
    { title: '产品编码', dataIndex: 'productCode', key: 'productCode', width: 140 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    {
      title: '规格参数',
      key: 'specs',
      width: 200,
      render: (_: any, r: any) => renderSpecs(r.specifications),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '型号',
      dataIndex: 'modelNo',
      key: 'modelNo',
      width: 110,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: 'BOM', key: 'bomCount', width: 60, render: (_: any, r: any) => r.boms?.length || 0 },
    {
      title: '操作',
      key: 'action',
      width: 340,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openBomMgr(r)}>
            BOM
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PictureOutlined />}
            onClick={() => {
              setDrawingProduct(r);
              drawingApi.getDrawings(r.id).then(set图纸管理);
              set图纸管理ModalOpen(true);
            }}
          >
            图纸
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileProtectOutlined />}
            onClick={() => {
              set专利Product(r);
              plmApi.getDocuments(r.id, '专利').then(set专利管理);
              set专利管理ModalOpen(true);
            }}
          >
            专利
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该产品？" onConfirm={() => remove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getMaterialLabel = (mid: string) => {
    const m = materials.find((x) => x.id === mid);
    return m ? m.materialCode + ' - ' + m.materialName : mid;
  };

  const bomColumns = [
    { title: 'BOM 编码', dataIndex: 'bomCode', width: 140 },
    { title: '物料', dataIndex: 'materialId', render: (v: string) => getMaterialLabel(v) },
    { title: '数量', dataIndex: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '版本', dataIndex: 'version', width: 70 },
    {
      title: '操作',
      key: 'act',
      width: 140,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => editBom(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteBom(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="PLM 产品管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建产品
          </Button>
        }
      >
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="搜索产品名称或编码"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="类别"
              value={filterCategory}
              onChange={setFilterCategory}
              allowClear
              style={{ width: 140 }}
              options={allCategories.map((c) => ({ value: c, label: c }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: 110 }}
              options={['开发中', '试产中', '已发布', '已停产'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Col>
        </Row>
        <Table
          dataSource={filtered产品管理}
          columns={productColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? '编辑产品' : '新建产品'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={680}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="productName"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="如：静音电机" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="类别">
                <Select
                  options={['循环扇电机', '罩极电机', '无刷直流电机', '静音电机', '其他'].map(
                    (s) => ({ value: s, label: s }),
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="modelNo" label="型号">
                <Input placeholder="如：HL-M01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            {specFields.map((f) => (
              <Col span={6} key={f.key}>
                <Form.Item name={f.key} label={f.label}>
                  <Input placeholder={f.label} />
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Form.Item name="status" label="状态" initialValue="开发中">
            <Select
              options={['开发中', '试产中', '已发布', '已停产'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="产品描述信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={'BOM 管理 - ' + (bomProduct?.productName || '')}
        open={bomModalOpen}
        onCancel={() => {
          setBomModalOpen(false);
          setBomEditing(null);
        }}
        footer={null}
        width={700}
      >
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          title={bomEditing ? '编辑 BOM' : '添加 BOM'}
        >
          <Form form={bomForm} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Form.Item
              name="materialId"
              label="物料"
              rules={[{ required: true }]}
              style={{ minWidth: 200 }}
            >
              <Select
                options={materials.map((m) => ({
                  value: m.id,
                  label: m.materialCode + ' - ' + m.materialName,
                }))}
                placeholder="选择物料"
              />
            </Form.Item>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
              <InputNumber min={0.01} step={0.01} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
              <Input placeholder="如：个" style={{ width: 80 }} />
            </Form.Item>
            <Form.Item name="version" label="版本" initialValue="V1.0">
              <Input style={{ width: 80 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" onClick={submitBom}>
                  {bomEditing ? '保存' : '添加'}
                </Button>
                {bomEditing && <Button onClick={cancelBomEdit}>取消</Button>}
              </Space>
            </Form.Item>
          </Form>
        </Card>
        <Table
          dataSource={bomList}
          columns={bomColumns}
          rowKey="id"
          loading={bomLoading}
          size="small"
          pagination={false}
          locale={{ emptyText: '尚无 BOM 记录，请在上方添加' }}
        />
      </Modal>

      <Modal
        title={'图纸 - ' + (drawingProduct?.productName || '')}
        open={drawingsModalOpen}
        onCancel={() => set图纸管理ModalOpen(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={drawings}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: 'Drawing Code', dataIndex: 'drawingCode', width: 120 },
            { title: 'Drawing Name', dataIndex: 'drawingName' },
            {
              title: '版本',
              dataIndex: 'latest版本',
              width: 80,
              render: (v: string) => <Tag color="blue">{v}</Tag>,
            },
            {
              title: 'Category',
              dataIndex: 'category',
              width: 100,
              render: (c: string) => c || '-',
            },
            {
              title: 'Updated',
              dataIndex: 'updatedAt',
              width: 120,
              render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
            },
          ]}
        />
      </Modal>

      <Modal
        title={'专利 - ' + (patentProduct?.productName || '')}
        open={patentsModalOpen}
        onCancel={() => set专利管理ModalOpen(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={patents}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: '暂无关联专利' }}
          columns={[
            { title: '专利编码', dataIndex: 'docCode', width: 120 },
            { title: '专利名称', dataIndex: 'docName', ellipsis: true },
            {
              title: '类型',
              dataIndex: 'patentType',
              width: 100,
              render: (t) => (t ? <Tag color="blue">{t}</Tag> : '-'),
            },
            {
              title: '到期日',
              dataIndex: 'expirationDate',
              width: 110,
              render: (d) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
            },
          ]}
        />
      </Modal>
    </>
  );
}
