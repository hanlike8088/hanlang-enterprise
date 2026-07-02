import { useEffect, useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Tag,
  message, Popconfirm, Row, Col, InputNumber, AutoComplete, Upload, Switch,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined,
  SettingOutlined, FileProtectOutlined, SearchOutlined,
  UploadOutlined, InboxOutlined,
} from '@ant-design/icons';
import { plmApi } from '../../services/plm';
import { erpApi } from '../../services/erp';
import { adminApi } from '../../services/admin';
import { drawingApi } from '../../services/drawing';
import dayjs from 'dayjs';

const { Dragger } = Upload;

const statusColors: Record<string, string> = {
  '开发中': 'blue', '试产中': 'orange', '已发布': 'green', '已停产': 'default',
};

const specFields = [
  { key: 'voltage', label: '电压' },
  { key: 'power', label: '功率' },
  { key: 'speed', label: '转速' },
  { key: 'torque', label: '转矩' },
];

const fileTypeOptions = [
  '产品规格书', '设计图纸', '客户需求', '检验标准', '工艺文件', 'BOM清单',
];

interface MaterialOption {
  id: string; materialCode: string; materialName: string;
  spec?: string; category: string; unit: string;
}

interface AttachedFile {
  uid: string; name: string; file?: File; type?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // ---- 物料搜索 ----
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [materialSearching, setMaterialSearching] = useState(false);
  const [manualInput, setManualInput] = useState(false);

  // ---- 组织 ----
  const [organizations, setOrganizations] = useState<{ id: string; orgName: string }[]>([]);

  // ---- 附件 ----
  const [fileList, setFileList] = useState<AttachedFile[]>([]);

  // ---- BOM ----
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [bomProduct, setBomProduct] = useState<any>(null);
  const [bomList, setBomList] = useState<any[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [bomEditing, setBomEditing] = useState<any>(null);
  const [bomForm] = Form.useForm();

  // ---- Drawings ----
  const [drawingsModalOpen, setDrawingsModalOpen] = useState(false);
  const [drawingProduct, setDrawingProduct] = useState<any>(null);
  const [drawings, setDrawings] = useState<any[]>([]);

  // ---- 专利 ----
  const [patentsModalOpen, setPatentsModalOpen] = useState(false);
  const [patentProduct, setPatentProduct] = useState<any>(null);
  const [patents, setPatents] = useState<any[]>([]);

  /* ========== 数据加载 ========== */
  const fetch = async () => {
    setLoading(true);
    try {
      const [prods, mats, orgs] = await Promise.all([
        plmApi.getProducts(), erpApi.getMaterials(), adminApi.getOrganizationsList(),
      ]);
      setProducts(prods); setMaterials(mats); setOrganizations(orgs);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  /* ========== 物料搜索 ========== */
  const handleMaterialSearch = async (value: string) => {
    if (!value || value.trim().length === 0) { setMaterialOptions([]); return; }
    setMaterialSearching(true);
    try {
      const results = await plmApi.searchMaterials(value.trim());
      setMaterialOptions(results);
    } finally { setMaterialSearching(false); }
  };

  const handleMaterialSelect = (value: string, option: any) => {
    const mat = materialOptions.find(
      (m) => m.materialCode === value || m.id === value
    );
    if (mat) {
      form.setFieldsValue({
        productName: mat.materialName,
        modelNo: mat.spec || undefined,
        category: mat.category || undefined,
        sourceMaterialCode: mat.materialCode,
      });
    }
  };

  /* ========== 新建/编辑 ========== */
  const openCreate = async () => {
    setEditing(null); form.resetFields(); setManualInput(false);
    setMaterialOptions([]); setFileList([]);
    try {
      const res = await plmApi.getNextProductCode();
      form.setFieldsValue({ productCode: res.code });
    } catch { /* ignore */ }
    setModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditing(r);
    const specs = safeParseSpecs(r.specifications);
    form.setFieldsValue({ ...r, ...specs });
    setManualInput(!!r.sourceMaterialCode);
    setFileList([]);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const specs: any = {};
    specFields.forEach((f) => {
      if (values[f.key] !== undefined && values[f.key] !== '') specs[f.key] = values[f.key];
    });
    const payload: any = {
      productCode: values.productCode,
      productName: values.productName,
      category: values.category,
      modelNo: values.modelNo,
      status: values.status,
      description: values.description,
      specifications: Object.keys(specs).length > 0 ? JSON.stringify(specs) : undefined,
      orgId: values.orgId || undefined,
      sourceMaterialCode: values.sourceMaterialCode || undefined,
    };

    try {
      if (editing) {
        await plmApi.updateProduct(editing.id, payload);
        message.success('产品已更新');
      } else {
        await plmApi.createProduct(payload);
        message.success('产品已创建');
      }
      setModalOpen(false); fetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '保存失败';
      message.error(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join('; ') : '保存失败');
    }
  };

  const remove = async (id: string) => {
    await plmApi.deleteProduct(id); message.success('产品已删除'); fetch();
  };

  /* ========== BOM ========== */
  const openBomMgr = async (product: any) => {
    setBomProduct(product); setBomEditing(null); bomForm.resetFields();
    setBomModalOpen(true); await loadBoms(product.id);
  };
  const loadBoms = async (productId: string) => {
    setBomLoading(true);
    try { setBomList(await plmApi.getBoms(productId)); } finally { setBomLoading(false); }
  };
  const submitBom = async () => {
    const values = await bomForm.validateFields();
    if (bomEditing) {
      await plmApi.updateBom(bomEditing.id, values); message.success('BOM 已更新');
    } else {
      await plmApi.createBom({ ...values, productId: bomProduct.id }); message.success('BOM 已添加');
    }
    bomForm.resetFields(); setBomEditing(null); await loadBoms(bomProduct.id);
  };
  const editBom = (bom: any) => {
    setBomEditing(bom);
    bomForm.setFieldsValue({
      materialId: bom.materialId, quantity: bom.quantity,
      unit: bom.unit, version: bom.version,
    });
  };
  const deleteBom = async (id: string) => {
    await plmApi.deleteBom(id); message.success('BOM 已删除');
    setBomEditing(null); bomForm.resetFields(); await loadBoms(bomProduct.id);
  };
  const cancelBomEdit = () => { setBomEditing(null); bomForm.resetFields(); };

  /* ========== 工具函数 ========== */
  const safeParseSpecs = (json: string | null | undefined) => {
    if (!json) return {};
    try { return JSON.parse(json); } catch { return {}; }
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

  /* ========== 过滤 ========== */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (searchText && !p.productName.includes(searchText) && !p.productCode.includes(searchText)) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [products, searchText, filterCategory, filterStatus]);

  const allCategories = useMemo(
    () => [...new Set(products.map((p: any) => p.category).filter(Boolean))] as string[],
    [products],
  );

  /* ========== 表格列 ========== */
  const productColumns = [
    { title: '产品编码', dataIndex: 'productCode', key: 'productCode', width: 140 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '规格参数', key: 'specs', width: 200,
      render: (_: any, r: any) => renderSpecs(r.specifications),
    },
    { title: '类别', dataIndex: 'category', key: 'category', width: 130,
      render: (v: string) => v || '-',
    },
    { title: '型号', dataIndex: 'modelNo', key: 'modelNo', width: 110,
      render: (v: string) => v || '-',
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: '来源物料', dataIndex: 'sourceMaterialCode', key: 'source', width: 130,
      render: (v: string) => v ? <Tag color="cyan">{v}</Tag> : '-',
    },
    { title: 'BOM', key: 'bomCount', width: 60,
      render: (_: any, r: any) => r.boms?.length || 0,
    },
    {
      title: '操作', key: 'action', width: 380,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openBomMgr(r)}>BOM</Button>
          <Button type="link" size="small" icon={<PictureOutlined />} onClick={() => {
            setDrawingProduct(r); drawingApi.getDrawings(r.id).then(setDrawings); setDrawingsModalOpen(true);
          }}>图纸</Button>
          <Button type="link" size="small" icon={<FileProtectOutlined />} onClick={() => {
            setPatentProduct(r); plmApi.getDocuments(r.id, '专利').then(setPatents); setPatentsModalOpen(true);
          }}>专利</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除该产品？" onConfirm={() => remove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getMaterialLabel = (mid: string) => {
    const m = materials.find((x: any) => x.id === mid);
    return m ? m.materialCode + ' - ' + m.materialName : mid;
  };

  const bomColumns = [
    { title: 'BOM 编码', dataIndex: 'bomCode', width: 140 },
    { title: '物料', dataIndex: 'materialId', render: (v: string) => getMaterialLabel(v) },
    { title: '数量', dataIndex: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '版本', dataIndex: 'version', width: 70 },
    { title: '操作', key: 'act', width: 140,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => editBom(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteBom(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const materialOptionValues = materialOptions.map((m) => ({
    value: m.materialCode,
    label: m.materialCode + ' - ' + m.materialName,
    key: m.id,
  }));

  return (
    <>
      {/* ========== 主表格 ========== */}
      <Card
        title="PLM 产品管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建产品</Button>}
      >
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input placeholder="搜索产品名称或编码" value={searchText}
              onChange={(e) => setSearchText(e.target.value)} allowClear />
          </Col>
          <Col>
            <Select placeholder="类别" value={filterCategory} onChange={setFilterCategory}
              allowClear style={{ width: 140 }}
              options={allCategories.map((c) => ({ value: c, label: c }))} />
          </Col>
          <Col>
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus}
              allowClear style={{ width: 110 }}
              options={['开发中', '试产中', '已发布', '已停产'].map((s) => ({ value: s, label: s }))} />
          </Col>
        </Row>
        <Table dataSource={filtered} columns={productColumns} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* ========== 新建/编辑产品弹窗 ========== */}
      <Modal title={editing ? '编辑产品' : '新建产品'} open={modalOpen}
        onOk={submit} onCancel={() => setModalOpen(false)} width={720}>
        <Form form={form} layout="vertical">

          <Form.Item name="productCode" label="产品编码" rules={[{ required: true, message: '请输入产品编码' }]}>
            <Input placeholder="产品编码" />
          </Form.Item>

          {/* ---- 物料搜索 + 手动切换 ---- */}
          <Form.Item label="物料选品">
            <Row gutter={8} align="middle">
              <Col flex="auto">
                {manualInput ? (
                  <>
                    <Form.Item name="productName" noStyle rules={[{ required: true, message: '请输入产品名称' }]}>
                      <Input placeholder="产品名称" style={{ marginBottom: 8 }} />
                    </Form.Item>
                    <Form.Item name="sourceMaterialCode" noStyle>
                      <Input placeholder="来源金蝶物料编码（选填）" />
                    </Form.Item>
                  </>
                ) : (
                  <AutoComplete
                    options={materialOptionValues}
                    onSearch={handleMaterialSearch}
                    onSelect={handleMaterialSelect}
                    notFoundContent={materialSearching ? '搜索中...' : '输入编码/名称搜索'}
                    style={{ width: '100%' }}
                  >
                    <Input prefix={<SearchOutlined />}
                      placeholder="输入物料编码或名称搜索成品..." size="middle" />
                  </AutoComplete>
                )}
              </Col>
              <Col>
                <Switch checkedChildren="手动" unCheckedChildren="搜索"
                  checked={manualInput} onChange={setManualInput} />
              </Col>
            </Row>
          </Form.Item>

          {/* 搜索模式下隐藏的 productName 字段，用于校验 */}
          {!manualInput && (
            <Form.Item name="productName" hidden rules={[{ required: true, message: '请输入产品名称' }]}>
              <Input />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择产品类别' }]}>
                <Select options={['循环扇电机', '罩极电机', '无刷直流电机', '静音电机', '其他']
                  .map((s) => ({ value: s, label: s }))} />
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="orgId" label="归属组织" rules={[{ required: true, message: '请选择归属组织' }]}>
                <Select placeholder="选择归属组织" allowClear
                  options={organizations.map((o) => ({ value: o.id, label: o.orgName }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="开发中">
                <Select options={['开发中', '试产中', '已发布', '已停产']
                  .map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="产品描述信息" />
          </Form.Item>

          {/* ---- 附件上传 ---- */}
          <Form.Item label="资料上传">
            <Dragger
              multiple
              fileList={fileList.map((f) => ({
                uid: f.uid, name: f.name, status: 'done' as const,
              }))}
              beforeUpload={(file) => {
                const newFile: AttachedFile = {
                  uid: '-' + Date.now(), name: file.name, file,
                };
                setFileList((prev) => [...prev, newFile]);
                return false;
              }}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持多文件上传</p>
            </Dragger>
            {fileList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {fileList.map((f, index) => (
                  <Row key={f.uid} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col flex="auto"><Tag>{f.name}</Tag></Col>
                    <Col>
                      <Select
                        placeholder="选择文件类型"
                        style={{ width: 140 }}
                        value={f.type}
                        onChange={(val) => {
                          setFileList((prev) => prev.map((pf, i) =>
                            i === index ? { ...pf, type: val } : pf
                          ));
                        }}
                        options={fileTypeOptions.map((t) => ({ value: t, label: t }))}
                      />
                    </Col>
                  </Row>
                ))}
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== BOM 弹窗 (保持原有) ========== */}
      <Modal title={'BOM 管理 - ' + (bomProduct?.productName || '')} open={bomModalOpen}
        onCancel={() => { setBomModalOpen(false); setBomEditing(null); }}
        footer={null} width={700}>
        <Card size="small" style={{ marginBottom: 16 }}
          title={bomEditing ? '编辑 BOM' : '添加 BOM'}>
          <Form form={bomForm} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="materialId" label="物料" rules={[{ required: true }]}
              style={{ minWidth: 200 }}>
              <Select options={materials.map((m: any) => ({
                value: m.id, label: m.materialCode + ' - ' + m.materialName,
              }))} placeholder="选择物料" />
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
        <Table dataSource={bomList} columns={bomColumns} rowKey="id"
          loading={bomLoading} size="small" pagination={false}
          locale={{ emptyText: '尚无 BOM 记录，请在上方添加' }} />
      </Modal>

      {/* ========== 图纸弹窗 ========== */}
      <Modal title={'图纸 - ' + (drawingProduct?.productName || '')} open={drawingsModalOpen}
        onCancel={() => setDrawingsModalOpen(false)} footer={null} width={700}>
        <Table dataSource={drawings} rowKey="id" size="small" pagination={false}
          columns={[
            { title: 'Drawing Code', dataIndex: 'drawingCode', width: 120 },
            { title: 'Drawing Name', dataIndex: 'drawingName' },
            { title: '版本', dataIndex: 'latestVersion', width: 80,
              render: (v: string) => <Tag color="blue">{v}</Tag>,
            },
            { title: 'Category', dataIndex: 'category', width: 100,
              render: (c: string) => c || '-',
            },
            { title: 'Updated', dataIndex: 'updatedAt', width: 120,
              render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
            },
          ]} />
      </Modal>

      {/* ========== 专利弹窗 ========== */}
      <Modal title={'专利 - ' + (patentProduct?.productName || '')} open={patentsModalOpen}
        onCancel={() => setPatentsModalOpen(false)} footer={null} width={700}>
        <Table dataSource={patents} rowKey="id" size="small" pagination={false}
          locale={{ emptyText: '暂无关联专利' }}
          columns={[
            { title: '专利编码', dataIndex: 'docCode', width: 120 },
            { title: '专利名称', dataIndex: 'docName', ellipsis: true },
            { title: '类型', dataIndex: 'patentType', width: 100,
              render: (t: any) => t ? <Tag color="blue">{t}</Tag> : '-',
            },
            { title: '到期日', dataIndex: 'expirationDate', width: 110,
              render: (d: any) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
            },
          ]} />
      </Modal>
    </>
  );
}
