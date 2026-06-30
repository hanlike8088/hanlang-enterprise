import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/api';

interface Position {
  id: string;
  positionCode: string;
  positionName: string;
  orgId: string;
  description: string | null;
  status: string;
  organization: { id: string; orgName: string };
}

interface Organization {
  id: string;
  orgName: string;
}

export default function PositionPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posData, orgData] = await Promise.all([
        adminApi.getPositions(),
        adminApi.getOrganizations(),
      ]);
      setPositions(posData);
      setOrgs(orgData);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingPos(null);
    form.resetFields();
    form.setFieldsValue({ status: '启用' });
    setModalVisible(true);
  };

  const handleEdit = (pos: Position) => {
    setEditingPos(pos);
    form.setFieldsValue({
      positionCode: pos.positionCode,
      positionName: pos.positionName,
      orgId: pos.orgId,
      description: pos.description,
      status: pos.status,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingPos) {
        await adminApi.updatePosition(editingPos.id, values);
        message.success('岗位已更新');
      } else {
        await adminApi.createPosition(values);
        message.success('岗位已创建');
      }
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deletePosition(id);
      message.success('岗位已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '岗位编码', dataIndex: 'positionCode', key: 'positionCode', width: 120 },
    { title: '岗位名称', dataIndex: 'positionName', key: 'positionName' },
    {
      title: '所属组织',
      dataIndex: 'organization',
      key: 'orgName',
      render: (org: { orgName: string }) => org?.orgName || '-',
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Tag color={status === '启用' ? 'green' : 'red'}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: Position) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此岗位？" onConfirm={() => handleDelete(r.id)}>
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
          新建岗位
        </Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={positions}
        columns={columns}
        loading={loading}
        pagination={false}
        bordered
      />
      <Modal
        title={editingPos ? '编辑岗位' : '新建岗位'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="positionCode"
            label="岗位编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="positionName"
            label="岗位名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="orgId"
            label="所属组织"
            rules={[{ required: true, message: '请选择组织' }]}
          >
            <Select
              placeholder="选择组织"
              options={orgs.map((o) => ({ label: o.orgName, value: o.id }))}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '启用', value: '启用' },
                { label: '停用', value: '停用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
