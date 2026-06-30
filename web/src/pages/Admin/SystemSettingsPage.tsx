import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/admin';;

interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const SETTING_CATEGORIES: Record<string, string> = {
  k3cloud: '金蝶对接',
  system: '系统配置',
  notification: '通知配置',
  boundary: '数据边界',
};

function getCategory(key: string): string {
  for (const [prefix, label] of Object.entries(SETTING_CATEGORIES)) {
    if (key.startsWith(prefix)) return label;
  }
  return '其他';
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, set编辑ing] = useState<SystemSetting | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      setSettings(await adminApi.getSystemSettings());
    } catch {
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handle新建 = () => {
    set编辑ing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handle编辑 = (record: SystemSetting) => {
    set编辑ing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handle保存 = async () => {
    try {
      const values = await form.validateFields();
      await adminApi.upsertSystemSetting(values);
      message.success(editing ? '设置已更新' : '设置已保存');
      setModalVisible(false);
      fetch();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handle删除 = async (id: string) => {
    try {
      await adminApi.deleteSystemSetting(id);
      message.success('已删除');
      fetch();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '分类',
      key: 'category',
      width: 100,
      render: (_: any, r: SystemSetting) => <Tag color="blue">{getCategory(r.settingKey)}</Tag>,
    },
    {
      title: '键',
      dataIndex: 'settingKey',
      key: 'settingKey',
      width: 200,
      render: (v: string) => <code>{v}</code>,
    },
    { title: '值', dataIndex: 'settingValue', key: 'settingValue', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 250 },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: SystemSetting) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handle编辑(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此设置？" onConfirm={() => handle删除(r.id)}>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handle新建}>
          新建设置
        </Button>
        <Button onClick={fetch}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={settings}
        columns={columns}
        loading={loading}
        pagination={false}
        bordered
        size="small"
      />
      <Modal
        title={editing ? '编辑设置' : '新建设置'}
        open={modalVisible}
        onOk={handle保存}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="settingKey"
            label="键"
            rules={[{ required: true, message: '请输入键名' }]}
          >
            <Input placeholder="k3cloud.server / system.app名称" disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="settingValue"
            label="值"
            rules={[{ required: true, message: '请输入值' }]}
          >
            <Input.TextArea rows={2} placeholder="设置值" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="说明此设置的作用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
