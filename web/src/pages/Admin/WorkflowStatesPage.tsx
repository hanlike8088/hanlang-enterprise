import { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Popconfirm,
  Tag,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BranchesOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/api';

interface WorkflowState {
  id: string;
  stateCode: string;
  stateName: string;
  module: string;
  isStart: boolean;
  isEnd: boolean;
  sortOrder: number;
  description: string | null;
}

interface WorkflowTransition {
  id: string;
  module: string;
  fromStateId: string;
  toStateId: string;
  transitionName: string;
  requiredPerm: string | null;
  sortOrder: number;
  fromState?: WorkflowState;
  toState?: WorkflowState;
}

const MODULE_OPTIONS = [
  { label: '打样工单', value: '打样工单' },
  { label: '报价单', value: '报价单' },
  { label: '销售订单', value: '销售订单' },
  { label: '客诉单', value: '客诉单' },
  { label: 'NPI项目', value: 'NPI项目' },
  { label: '试产管理', value: '试产管理' },
  { label: '生产工单', value: '生产工单' },
];

function StateFormModal({
  visible,
  editing,
  states,
  onSave,
  onCancel,
}: {
  visible: boolean;
  editing: WorkflowState | null;
  states: WorkflowState[];
  onSave: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (editing) {
        form.setFieldsValue(editing);
      } else {
        form.resetFields();
        form.setFieldsValue({ isStart: false, isEnd: false, sortOrder: 0 });
      }
    }
  }, [visible, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(values);
  };

  return (
    <Modal
      title={editing ? '编辑状态' : '新建状态'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="module" label="所属模块" rules={[{ required: true }]}>
          <Select options={MODULE_OPTIONS} placeholder="选择模块" />
        </Form.Item>
        <Form.Item
          name="stateCode"
          label="状态编码"
          rules={[{ required: true, message: '请输入编码' }]}
        >
          <Input placeholder="PENDING / APPROVED" />
        </Form.Item>
        <Form.Item
          name="stateName"
          label="状态名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="待审批 / 已审批" />
        </Form.Item>
        <Space style={{ width: '100%' }}>
          <Form.Item name="isStart" label="起始状态" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isEnd" label="终态" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} />
          </Form.Item>
        </Space>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function TransitionFormModal({
  visible,
  editing,
  states,
  onSave,
  onCancel,
}: {
  visible: boolean;
  editing: WorkflowTransition | null;
  states: WorkflowState[];
  onSave: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();
  const [filteredStates, setFilteredStates] = useState<WorkflowState[]>([]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        form.setFieldsValue(editing);
        setFilteredStates(states.filter((s) => s.module === editing.module));
      } else {
        form.resetFields();
        form.setFieldsValue({ sortOrder: 0 });
        setFilteredStates([]);
      }
    }
  }, [visible, editing, form, states]);

  const handleModuleChange = (module: string) => {
    setFilteredStates(states.filter((s) => s.module === module));
    form.setFieldsValue({ fromStateId: undefined, toStateId: undefined });
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(values);
  };

  const stateOptions = filteredStates.map((s) => ({ label: s.stateName, value: s.id }));

  return (
    <Modal
      title={editing ? '编辑流转关系' : '新建流转关系'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="module" label="所属模块" rules={[{ required: true }]}>
          <Select
            options={MODULE_OPTIONS}
            placeholder="选择模块"
            onChange={handleModuleChange}
            disabled={!!editing}
          />
        </Form.Item>
        <Form.Item
          name="transitionName"
          label="流转名称"
          rules={[{ required: true, message: '请输入流转操作名' }]}
        >
          <Input placeholder="研发主管通过 / 打样主管分配" />
        </Form.Item>
        <Form.Item
          name="fromStateId"
          label="从状态"
          rules={[{ required: true, message: '请选择来源状态' }]}
        >
          <Select options={stateOptions} placeholder="选择来源状态" />
        </Form.Item>
        <Form.Item
          name="toStateId"
          label="到状态"
          rules={[{ required: true, message: '请选择目标状态' }]}
        >
          <Select options={stateOptions} placeholder="选择目标状态" />
        </Form.Item>
        <Form.Item name="requiredPerm" label="所需权限(编码)">
          <Input placeholder="approve_sample / assign_task" />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function StatesTab() {
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, set编辑ing] = useState<WorkflowState | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      setStates(await adminApi.getWorkflowStates());
    } catch {
      message.error('加载状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handle保存 = async (values: any) => {
    if (editing) {
      await adminApi.updateWorkflowState(editing.id, values);
      message.success('状态已更新');
    } else {
      await adminApi.createWorkflowState(values);
      message.success('状态已创建');
    }
    setModalVisible(false);
    fetch();
  };

  const handle删除 = async (id: string) => {
    try {
      await adminApi.deleteWorkflowState(id);
      message.success('已删除');
      fetch();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '编码', dataIndex: 'stateCode', key: 'stateCode', width: 110 },
    { title: '名称', dataIndex: 'stateName', key: 'stateName' },
    {
      title: '起始/终态',
      key: 'flags',
      width: 110,
      render: (_: any, r: WorkflowState) => (
        <Space size={4}>
          {r.isStart && <Tag color="green">起始</Tag>}
          {r.isEnd && <Tag color="red">终态</Tag>}
        </Space>
      ),
    },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 60 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: WorkflowState) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              set编辑ing(r);
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handle删除(r.id)}>
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            set编辑ing(null);
            setModalVisible(true);
          }}
        >
          新建状态
        </Button>
        <Button onClick={fetch}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={states}
        columns={columns}
        loading={loading}
        pagination={false}
        bordered
        size="small"
      />
      <StateFormModal
        visible={modalVisible}
        editing={editing}
        states={states}
        onSave={handle保存}
        onCancel={() => setModalVisible(false)}
      />
    </div>
  );
}

function TransitionsTab() {
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, set编辑ing] = useState<WorkflowTransition | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        adminApi.getWorkflowTransitions(),
        adminApi.getWorkflowStates(),
      ]);
      setTransitions(t);
      setStates(s);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handle保存 = async (values: any) => {
    if (editing) {
      await adminApi.updateWorkflowTransition(editing.id, values);
      message.success('流转关系已更新');
    } else {
      await adminApi.createWorkflowTransition(values);
      message.success('流转关系已创建');
    }
    setModalVisible(false);
    fetch();
  };

  const handle删除 = async (id: string) => {
    try {
      await adminApi.deleteWorkflowTransition(id);
      message.success('已删除');
      fetch();
    } catch {
      message.error('删除失败');
    }
  };

  const getStateName = (stateId: string) =>
    states.find((s) => s.id === stateId)?.stateName || stateId;

  const columns = [
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '流转名称', dataIndex: 'transitionName', key: 'transitionName' },
    {
      title: '从状态',
      dataIndex: 'fromStateId',
      key: 'fromStateId',
      width: 120,
      render: (v: string) => getStateName(v),
    },
    {
      title: '',
      key: 'arrow',
      width: 30,
      render: () => <SwapOutlined style={{ color: '#999' }} />,
    },
    {
      title: '到状态',
      dataIndex: 'toStateId',
      key: 'toStateId',
      width: 120,
      render: (v: string) => getStateName(v),
    },
    {
      title: '所需权限',
      dataIndex: 'requiredPerm',
      key: 'requiredPerm',
      width: 140,
      render: (v: string | null) => (v ? <Tag color="purple">{v}</Tag> : '-'),
    },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 60 },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, r: WorkflowTransition) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              set编辑ing(r);
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handle删除(r.id)}>
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            set编辑ing(null);
            setModalVisible(true);
          }}
        >
          新建流转
        </Button>
        <Button onClick={fetch}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={transitions}
        columns={columns}
        loading={loading}
        pagination={false}
        bordered
        size="small"
      />
      <TransitionFormModal
        visible={modalVisible}
        editing={editing}
        states={states}
        onSave={handle保存}
        onCancel={() => setModalVisible(false)}
      />
    </div>
  );
}

export default function WorkflowStatesPage() {
  return (
    <Tabs
      defaultActiveKey="states"
      items={[
        {
          key: 'states',
          label: (
            <span>
              <BranchesOutlined /> 状态定义
            </span>
          ),
          children: <StatesTab />,
        },
        {
          key: 'transitions',
          label: (
            <span>
              <SwapOutlined /> 流转关系
            </span>
          ),
          children: <TransitionsTab />,
        },
      ]}
    />
  );
}
