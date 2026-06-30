import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Space,
  Tag,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/admin';;
import dayjs from 'dayjs';

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  orgId: string;
  hireDate: string | null;
  status: string;
  organization: { id: string; orgName: string };
  positions: { position: { id: string; positionName: string } }[];
  username?: string | null;
}

interface Organization {
  id: string;
  orgName: string;
}

interface Position {
  id: string;
  positionName: string;
  orgId: string;
}

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empData, orgData, posData] = await Promise.all([
        adminApi.getEmployees(),
        adminApi.getOrganizations(),
        adminApi.getPositions(),
      ]);
      setEmployees(empData);
      setOrgs(orgData);
      setAllPositions(posData);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPositions = selectedOrgId
    ? allPositions.filter((p: any) => p.orgId === selectedOrgId)
    : allPositions;

  const handleCreate = () => {
    setEditingEmp(null);
    form.resetFields();
    form.setFieldsValue({ status: '在职' });
    setSelectedOrgId(null);
    setModalVisible(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmp(emp);
    const positionIds =
      emp.positions?.map((ep: any) => ep.position?.id || ep.positionId).filter(Boolean) || [];
    setSelectedOrgId(emp.orgId);
    form.setFieldsValue({
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      orgId: emp.orgId,
      hireDate: emp.hireDate ? dayjs(emp.hireDate) : null,
      status: emp.status,
      positionIds,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        hireDate: values.hireDate ? dayjs(values.hireDate).format('YYYY-MM-DD') : undefined,
      };
      if (editingEmp) {
        await adminApi.updateEmployee(editingEmp.id, payload);
        message.success('员工已更新');
      } else {
        await adminApi.createEmployee(payload);
        message.success('员工已创建');
      }
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteEmployee(id);
      message.success('员工已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '工号', dataIndex: 'employeeCode', key: 'employeeCode', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '账号', dataIndex: 'username', key: 'username', width: 130, render: (v: string) => v || <span style={{color:'#ccc'}}>未绑定</span> },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '组织',
      dataIndex: 'organization',
      key: 'orgName',
      render: (org: { orgName: string }) => org?.orgName || '-',
    },
    {
      title: '岗位',
      dataIndex: 'positions',
      key: 'positions',
      render: (positions: any[]) => {
        const names =
          positions
            ?.map((ep: any) => ep.position?.positionName || ep.positionName)
            .filter(Boolean) || [];
        return names.length > 0 ? names.join(', ') : '-';
      },
    },
    {
      title: '入职日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const color = status === '在职' ? 'green' : status === '离职' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: Employee) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此员工？" onConfirm={() => handleDelete(r.id)}>
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
          新建员工
        </Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={employees}
        columns={columns}
        loading={loading}
        pagination={false}
        bordered
      />
      <Modal
        title={editingEmp ? '编辑员工' : '新建员工'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="employeeCode"
            label="工号"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机">
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
              onChange={(value) => {
                setSelectedOrgId(value);
                form.setFieldsValue({ positionIds: [] });
              }}
            />
          </Form.Item>
          <Form.Item name="positionIds" label="分配岗位">
            <Select
              mode="multiple"
              placeholder="选择岗位（可多选）"
              options={filteredPositions.map((p: any) => ({
                label: p.positionName,
                value: p.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="hireDate" label="入职日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '在职', value: '在职' },
                { label: '离职', value: '离职' },
                { label: '停薪留职', value: '停薪留职' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
