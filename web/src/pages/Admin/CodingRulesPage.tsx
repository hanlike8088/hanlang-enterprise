import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  Tag,
  message,
  Card,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  NumberOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/api';

interface CodingRule {
  id: string;
  docType: string;
  prefix: string;
  yearDigits: number;
  serialDigits: number;
  separator: string;
  currentSerial: number;
  resetPeriod: string;
  description: string | null;
}

const DOC_TYPE_OPTIONS = [
  { label: '打样工单', value: '打样工单' },
  { label: '报价单', value: '报价单' },
  { label: '销售订单', value: '销售订单' },
  { label: '客诉单', value: '客诉单' },
  { label: '采购订单', value: '采购订单' },
  { label: '生产工单', value: '生产工单' },
  { label: 'NPI项目', value: 'NPI项目' },
  { label: '试产记录', value: '试产记录' },
];

export default function CodingRulesPage() {
  const [rules, setRules] = useState<CodingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<CodingRule | null>(null);
  const [form] = Form.useForm();

  const fetchRules = async () => {
    setLoading(true);
    try {
      setRules(await adminApi.getCodingRules());
    } catch {
      message.error('加载编码规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({
      yearDigits: 4,
      serialDigits: 4,
      separator: '-',
      resetPeriod: 'yearly',
      currentSerial: 1,
    });
    setModalVisible(true);
  };

  const handleEdit = (rule: CodingRule) => {
    setEditingRule(rule);
    form.setFieldsValue({ ...rule });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingRule) {
        await adminApi.updateCodingRule(editingRule.id, values);
        message.success('规则已更新');
      } else {
        await adminApi.createCodingRule(values);
        message.success('规则已创建');
      }
      setModalVisible(false);
      fetchRules();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCodingRule(id);
      message.success('规则已删除');
      fetchRules();
    } catch {
      message.error('删除失败');
    }
  };

  const handleGenerate = async (docType: string) => {
    try {
      const code = await adminApi.generateCode(docType);
      message.success('生成编码: ' + code);
      fetchRules();
    } catch {
      message.error('生成失败');
    }
  };

  const previewCode = (rule: CodingRule): string => {
    const year = new Date().getFullYear();
    const yearStr = rule.yearDigits === 2 ? String(year).slice(-2) : String(year);
    const serial = String(rule.currentSerial).padStart(rule.serialDigits, '0');
    return rule.prefix + rule.separator + yearStr + rule.separator + serial;
  };

  const columns = [
    {
      title: '单据类型',
      dataIndex: 'docType',
      key: 'docType',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    { title: '前缀', dataIndex: 'prefix', key: 'prefix', width: 80 },
    { title: '分隔符', dataIndex: 'separator', key: 'separator', width: 60 },
    {
      title: '年份位数',
      dataIndex: 'yearDigits',
      key: 'yearDigits',
      width: 80,
      render: (v: number) => v + '位',
    },
    {
      title: '流水号位数',
      dataIndex: 'serialDigits',
      key: 'serialDigits',
      width: 90,
      render: (v: number) => v + '位',
    },
    {
      title: '重置周期',
      dataIndex: 'resetPeriod',
      key: 'resetPeriod',
      width: 90,
      render: (v: string) => ({ yearly: '每年', monthly: '每月', none: '不重置' })[v] || v,
    },
    { title: '当前流水号', dataIndex: 'currentSerial', key: 'currentSerial', width: 90 },
    {
      title: '预览',
      key: 'preview',
      width: 180,
      render: (_: any, r: CodingRule) => (
        <Space>
          <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
            {previewCode(r)}
          </code>
          <Button
            size="small"
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleGenerate(r.docType)}
          >
            生成
          </Button>
        </Space>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: CodingRule) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此规则？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建编码规则
        </Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={rules}
        columns={columns}
        loading={loading}
        pagination={false}
        bordered
      />

      <Card title="编码示例" style={{ marginTop: 16 }} bordered>
        {rules.map((r) => (
          <Descriptions key={r.id} size="small" column={1} style={{ marginBottom: 12 }}>
            <Descriptions.Item label={r.docType}>
              <code
                style={{ fontSize: 14, background: '#e6f7ff', padding: '2px 8px', borderRadius: 4 }}
              >
                {previewCode(r)}
              </code>
              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>{r.description}</span>
            </Descriptions.Item>
          </Descriptions>
        ))}
        {rules.length === 0 && <span style={{ color: '#999' }}>暂无编码规则，请创建</span>}
      </Card>

      <Modal
        title={editingRule ? '编辑编码规则' : '新建编码规则'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="docType"
            label="单据类型"
            rules={[{ required: true, message: '请选择单据类型' }]}
          >
            <Select
              options={DOC_TYPE_OPTIONS}
              disabled={!!editingRule}
              placeholder="选择单据类型"
            />
          </Form.Item>
          <Form.Item
            name="prefix"
            label="编码前缀"
            rules={[{ required: true, message: '请输入前缀，如 DY' }]}
          >
            <Input placeholder="DY / BJ / SO / KS" />
          </Form.Item>
          <Form.Item name="separator" label="分隔符" rules={[{ required: true }]}>
            <Input placeholder="-" maxLength={2} />
          </Form.Item>
          <Form.Item name="yearDigits" label="年份位数">
            <Select
              options={[
                { label: '2位（如26）', value: 2 },
                { label: '4位（如2026）', value: 4 },
              ]}
            />
          </Form.Item>
          <Form.Item name="serialDigits" label="流水号位数">
            <InputNumber min={2} max={8} />
          </Form.Item>
          <Form.Item name="currentSerial" label="当前流水号">
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="resetPeriod" label="重置周期">
            <Select
              options={[
                { label: '每年重置', value: 'yearly' },
                { label: '每月重置', value: 'monthly' },
                { label: '不重置', value: 'none' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
