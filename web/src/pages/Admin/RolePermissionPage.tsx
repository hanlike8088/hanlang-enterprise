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
  Popconfirm,
  Tabs,
  Tree,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/admin';;

interface Role {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  status: string;
  rolePermissions: { permId: string; permission: Permission }[];
  _count?: { positionRoles: number };
}

interface Permission {
  id: string;
  permCode: string;
  permName: string;
  resource: string;
  action: string;
  description: string | null;
  _count?: { rolePermissions: number };
}

interface Position {
  id: string;
  positionCode: string;
  positionName: string;
  orgId: string;
}

interface PositionRoleMapping {
  positionId: string;
  roleId: string;
  position: { id: string; positionName: string };
  role: { id: string; roleName: string; roleCode: string };
}

export default function RolePermissionPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm] = Form.useForm();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  const [permForm] = Form.useForm();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignRole, setAssignRole] = useState<Role | null>(null);
  const [checkedPermIds, setCheckedPermIds] = useState<string[]>([]);

  const [mappings, setMappings] = useState<PositionRoleMapping[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [bindingModalVisible, setBindingModalVisible] = useState(false);
  const [bindingForm] = Form.useForm();

  const fetchRoles = async () => {
    setRoleLoading(true);
    try {
      setRoles(await adminApi.getRoles());
    } catch {
      message.error('加载角色失败');
    } finally {
      setRoleLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setPermLoading(true);
    try {
      setPermissions(await adminApi.getPermissions());
    } catch {
      message.error('加载权限失败');
    } finally {
      setPermLoading(false);
    }
  };

  const fetchMappings = async () => {
    try {
      setMappings(await adminApi.getPositionRoleMappings());
    } catch {
      /* ignore */
    }
  };

  const fetchPositions = async () => {
    try {
      setPositions(await adminApi.getPositions());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchMappings();
    fetchPositions();
  }, []);

  const handleCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    roleForm.setFieldsValue({ status: '启用' });
    setRoleModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      status: role.status,
    });
    setRoleModalVisible(true);
  };

  const handleSaveRole = async () => {
    try {
      const values = await roleForm.validateFields();
      if (editingRole) {
        await adminApi.updateRole(editingRole.id, values);
        message.success('角色已更新');
      } else {
        await adminApi.createRole(values);
        message.success('角色已创建');
      }
      setRoleModalVisible(false);
      fetchRoles();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await adminApi.deleteRole(id);
      message.success('角色已删除');
      fetchRoles();
      fetchMappings();
    } catch {
      message.error('删除失败');
    }
  };

  const handleCreatePerm = () => {
    setEditingPerm(null);
    permForm.resetFields();
    setPermModalVisible(true);
  };

  const handleEditPerm = (perm: Permission) => {
    setEditingPerm(perm);
    permForm.setFieldsValue(perm);
    setPermModalVisible(true);
  };

  const handleSavePerm = async () => {
    try {
      const values = await permForm.validateFields();
      if (editingPerm) {
        await adminApi.updatePermission(editingPerm.id, values);
        message.success('权限已更新');
      } else {
        await adminApi.createPermission(values);
        message.success('权限已创建');
      }
      setPermModalVisible(false);
      fetchPermissions();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDeletePerm = async (id: string) => {
    try {
      await adminApi.deletePermission(id);
      message.success('权限已删除');
      fetchPermissions();
      fetchRoles();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAssignPermissions = (role: Role) => {
    setAssignRole(role);
    setCheckedPermIds(role.rolePermissions.map((rp) => rp.permId));
    setAssignModalVisible(true);
  };

  const handleSaveAssignment = async () => {
    if (!assignRole) return;
    try {
      await adminApi.assignRolePermissions({ roleId: assignRole.id, permIds: checkedPermIds });
      message.success('权限分配已保存');
      setAssignModalVisible(false);
      fetchRoles();
    } catch {
      message.error('保存失败');
    }
  };

  const handleBindRole = () => {
    bindingForm.resetFields();
    setBindingModalVisible(true);
  };

  const handleSaveBinding = async () => {
    try {
      const values = await bindingForm.validateFields();
      await adminApi.assignPositionRole({ positionId: values.positionId, roleId: values.roleId });
      message.success('岗位角色绑定已保存');
      setBindingModalVisible(false);
      fetchMappings();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleRemoveBinding = async (positionId: string, roleId: string) => {
    try {
      await adminApi.removePositionRole(positionId, roleId);
      message.success('绑定已解除');
      fetchMappings();
    } catch {
      message.error('操作失败');
    }
  };

  const roleColumns = [
    { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode', width: 140 },
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '关联权限',
      key: 'perms',
      width: 200,
      render: (_: any, r: Role) => (
        <span>{r.rolePermissions.map((rp) => rp.permission.permName).join(', ') || '-'}</span>
      ),
    },
    {
      title: '绑定岗位数',
      key: 'posCount',
      width: 100,
      render: (_: any, r: Role) => r._count?.positionRoles || 0,
    },
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
      width: 250,
      render: (_: any, r: Role) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditRole(r)}>
            编辑
          </Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => handleAssignPermissions(r)}>
            分配权限
          </Button>
          <Popconfirm title="确定删除此角色？" onConfirm={() => handleDeleteRole(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const permColumns = [
    { title: '权限编码', dataIndex: 'permCode', key: 'permCode', width: 160 },
    { title: '权限名称', dataIndex: 'permName', key: 'permName' },
    { title: '资源', dataIndex: 'resource', key: 'resource', width: 100 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '关联角色数',
      key: 'count',
      width: 100,
      render: (_: any, p: Permission) => p._count?.rolePermissions || 0,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, p: Permission) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPerm(p)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此权限？" onConfirm={() => handleDeletePerm(p.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const bindingColumns = [
    {
      title: '岗位',
      key: 'position',
      render: (_: any, m: PositionRoleMapping) => m.position.positionName,
    },
    {
      title: '角色',
      key: 'role',
      render: (_: any, m: PositionRoleMapping) => `${m.role.roleName} (${m.role.roleCode})`,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, m: PositionRoleMapping) => (
        <Popconfirm
          title="确定解除此绑定？"
          onConfirm={() => handleRemoveBinding(m.positionId, m.roleId)}
        >
          <Button size="small" danger>
            解除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const resourceGroups = permissions.reduce(
    (acc, p) => {
      if (!acc[p.resource]) acc[p.resource] = [];
      acc[p.resource].push(p);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const permTreeData = Object.entries(resourceGroups).map(([resource, perms]) => ({
    title: resource,
    key: resource,
    children: perms.map((p) => ({
      title: `${p.permName} (${p.permCode})`,
      key: p.id,
    })),
  }));

  const tabItems = [
    {
      key: 'roles',
      label: (
        <span>
          <SafetyCertificateOutlined /> 角色管理
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
              新建角色
            </Button>
          </Space>
          <Table
            rowKey="id"
            dataSource={roles}
            columns={roleColumns}
            loading={roleLoading}
            pagination={false}
            bordered
          />

          <Modal
            title={editingRole ? '编辑角色' : '新建角色'}
            open={roleModalVisible}
            onOk={handleSaveRole}
            onCancel={() => setRoleModalVisible(false)}
            destroyOnClose
          >
            <Form form={roleForm} layout="vertical">
              <Form.Item
                name="roleCode"
                label="角色编码"
                rules={[{ required: true, message: '请输入编码' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="roleName"
                label="角色名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input />
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
      ),
    },
    {
      key: 'permissions',
      label: (
        <span>
          <KeyOutlined /> 权限定义
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePerm}>
              新建权限
            </Button>
          </Space>
          <Table
            rowKey="id"
            dataSource={permissions}
            columns={permColumns}
            loading={permLoading}
            pagination={false}
            bordered
          />

          <Modal
            title={editingPerm ? '编辑权限' : '新建权限'}
            open={permModalVisible}
            onOk={handleSavePerm}
            onCancel={() => setPermModalVisible(false)}
            destroyOnClose
          >
            <Form form={permForm} layout="vertical">
              <Form.Item
                name="permCode"
                label="权限编码"
                rules={[{ required: true, message: '如: admin:org:read' }]}
              >
                <Input placeholder="resource:action" />
              </Form.Item>
              <Form.Item
                name="permName"
                label="权限名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="resource"
                label="资源"
                rules={[{ required: true, message: '如: admin, npi, plm' }]}
              >
                <Input placeholder="admin / npi / plm / erp" />
              </Form.Item>
              <Form.Item
                name="action"
                label="操作"
                rules={[{ required: true, message: '如: read, write, delete' }]}
              >
                <Select
                  options={[
                    { label: 'read', value: 'read' },
                    { label: 'write', value: 'write' },
                    { label: 'delete', value: 'delete' },
                    { label: 'approve', value: 'approve' },
                    { label: 'manage', value: 'manage' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    },
    {
      key: 'bindings',
      label: (
        <span>
          <LinkOutlined /> 岗位绑定
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<LinkOutlined />} onClick={handleBindRole}>
              绑定岗位-角色
            </Button>
          </Space>
          <Table
            rowKey={(r: PositionRoleMapping) => `${r.positionId}-${r.roleId}`}
            dataSource={mappings}
            columns={bindingColumns}
            pagination={false}
            bordered
          />

          <Modal
            title="绑定岗位-角色"
            open={bindingModalVisible}
            onOk={handleSaveBinding}
            onCancel={() => setBindingModalVisible(false)}
            destroyOnClose
          >
            <Form form={bindingForm} layout="vertical">
              <Form.Item
                name="positionId"
                label="岗位"
                rules={[{ required: true, message: '请选择岗位' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择岗位"
                  options={positions.map((p) => ({
                    label: `${p.positionName} (${p.positionCode})`,
                    value: p.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="roleId"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择角色"
                  options={roles
                    .filter((r) => r.status === '启用')
                    .map((r) => ({ label: `${r.roleName} (${r.roleCode})`, value: r.id }))}
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Modal
        title={`分配权限 - ${assignRole?.roleName || ''}`}
        open={assignModalVisible}
        onOk={handleSaveAssignment}
        onCancel={() => setAssignModalVisible(false)}
        width={500}
        destroyOnClose
      >
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedPermIds}
          onCheck={(checked: any) => setCheckedPermIds(checked as string[])}
          treeData={permTreeData}
        />
      </Modal>

      <Tabs defaultActiveKey="roles" items={tabItems} />
    </div>
  );
}
