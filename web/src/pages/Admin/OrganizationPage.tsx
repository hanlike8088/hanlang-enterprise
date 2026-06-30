import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tree,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  Space,
  Tag,
  message,
  Descriptions,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  ProjectOutlined,
  BankOutlined,
  TeamOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/admin';;

interface OrgItem {
  id: string;
  orgCode: string;
  orgName: string;
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  status: string;
  _count?: { positions: number; employees: number };
}

const DIV_COLORS: Record<string, { main: string; light: string; label: string }> = {
  家电事业部: { main: '#52c41a', light: '#f6ffed', label: '家电事业部' },
  制造中心: { main: '#fa8c16', light: '#fff7e6', label: '制造中心' },
  智能制造事业部: { main: '#722ed1', light: '#f9f0ff', label: '智能制造事业部' },
};
const DEF_COLOR = { main: '#1677ff', light: '#e6f4ff', label: '公共/总部' };

function getDivColor(org: OrgItem, orgs: OrgItem[]) {
  if (DIV_COLORS[org.orgName]) return DIV_COLORS[org.orgName];
  var cur = org,
    d = 0;
  while (cur.parentId && d < 10) {
    var p = orgs.find(function (o) {
      return o.id === cur.parentId;
    });
    if (!p) break;
    if (DIV_COLORS[p.orgName]) return DIV_COLORS[p.orgName];
    cur = p;
    d++;
  }
  return DEF_COLOR;
}

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgItem | null>(null);
  const [viewMode, setViewMode] = useState<string>('tree');
  const [form] = Form.useForm();

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      setOrgs(await adminApi.getOrganizations());
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const getIcon = function (level: number) {
    if (level === 0) return <BankOutlined />;
    if (level === 1) return <ProjectOutlined />;
    if (level === 2) return <TeamOutlined />;
    return <NodeIndexOutlined />;
  };

  const buildTree = function (parentIdVal: string | null = null, level = 0): any[] {
    return orgs
      .filter(function (o) {
        return o.parentId === parentIdVal;
      })
      .sort(function (a, b) {
        return a.sortOrder - b.sortOrder;
      })
      .map(function (o) {
        var dc = getDivColor(o, orgs);
        return {
          title: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Tag
                color={dc.main}
                style={{ margin: 0, fontWeight: 600, minWidth: 80, textAlign: 'center' as const }}
              >
                {o.orgCode}
              </Tag>
              <span style={{ fontWeight: level === 0 ? 600 : 400 }}>{o.orgName}</span>
              {o.status !== '启用' && (
                <Tag color="red" style={{ margin: 0 }}>
                  停用
                </Tag>
              )}
              <Tag
                style={{
                  margin: 0,
                  fontSize: 10,
                  border: 'none',
                  background: 'transparent',
                  color: '#999',
                }}
              >
                {dc.label}
              </Tag>
            </span>
          ),
          key: o.id,
          icon: getIcon(level),
          isLeaf: !(orgs || []).some(function (c) {
            return c.parentId === o.id;
          }),
          children: buildTree(o.id, level + 1),
        };
      });
  };

  const treeData = buildTree(null);

  // ===== Org Chart =====
  const RenderNode = function (p: {
    id: string;
    name: string;
    code: string;
    status: string;
    children: any[];
    selected: boolean;
    onClick: () => void;
  }) {
    var nodeOrg = orgs.find(function (o) {
      return o.id === p.id;
    });
    var dc = nodeOrg ? getDivColor(nodeOrg, orgs) : DEF_COLOR;
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px' }}
      >
        <div
          onClick={p.onClick}
          style={{
            borderLeft: '4px solid ' + dc.main,
            borderRadius: 6,
            padding: '8px 14px',
            background: p.selected ? dc.light : '#fff',
            cursor: 'pointer',
            textAlign: 'center',
            minWidth: 130,
            border: p.selected ? '2px solid ' + dc.main : '1px solid #d9d9d9',
            boxShadow: p.selected ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.06)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 10, color: dc.main, fontWeight: 600, marginBottom: 2 }}>
            {p.code}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
          <div
            style={{
              fontSize: 11,
              marginTop: 4,
              color: p.status === '启用' ? '#52c41a' : '#ff4d4f',
            }}
          >
            <span style={{ color: dc.main }}>●</span> {p.status === '启用' ? '启用' : '停用'}
          </div>
        </div>
        {p.children.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              paddingTop: 16,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                height: 16,
                borderLeft: '1px solid #d9d9d9',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                borderTop: '1px solid #d9d9d9',
                paddingTop: 8,
              }}
            >
              {p.children}
            </div>
          </div>
        )}
      </div>
    );
  };

  var chartRoots = orgs
    .filter(function (o) {
      return o.parentId === null;
    })
    .sort(function (a, b) {
      return a.sortOrder - b.sortOrder;
    });

  var buildChartNodes = function (parentIdVal: string | null = null): any[] {
    return orgs
      .filter(function (o) {
        return o.parentId === parentIdVal;
      })
      .sort(function (a, b) {
        return a.sortOrder - b.sortOrder;
      })
      .map(function (o) {
        return (
          <RenderNode
            key={o.id}
            id={o.id}
            name={o.orgName}
            code={o.orgCode}
            status={o.status}
            selected={selectedOrg?.id === o.id}
            onClick={function () {
              setSelectedOrg(o);
            }}
            children={buildChartNodes(o.id)}
          />
        );
      });
  };

  var chartContent = buildChartNodes(null);

  // ===== Handlers =====
  var handleSelect = function (selectedKeys: React.Key[]) {
    if (selectedKeys.length > 0)
      setSelectedOrg(
        orgs.find(function (o) {
          return o.id === selectedKeys[0];
        }) || null,
      );
    else setSelectedOrg(null);
  };

  var handleCreate = function (parent?: string | null) {
    setEditingOrg(null);
    form.resetFields();
    form.setFieldsValue({ status: '启用', sortOrder: 0, parentId: parent || undefined });
    setModalVisible(true);
  };

  var handleEdit = function (org?: OrgItem | null) {
    var target = org || selectedOrg;
    if (!target) {
      message.warning('请选择一个组织');
      return;
    }
    setEditingOrg(target);
    var p = target.parentId;
    form.setFieldsValue({
      orgCode: target.orgCode,
      orgName: target.orgName,
      parentId: p,
      description: target.description,
      sortOrder: target.sortOrder,
      status: target.status,
    });
    setModalVisible(true);
  };

  var handleSave = async function () {
    try {
      var values = await form.validateFields();
      if (editingOrg) {
        await adminApi.updateOrganization(editingOrg.id, values);
        message.success('已更新');
      } else {
        await adminApi.createOrganization(values);
        message.success('已创建');
      }
      setModalVisible(false);
      fetchOrgs();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  var handleDelete = async function (id: string) {
    try {
      var children = orgs.filter(function (o) {
        return o.parentId === id;
      });
      if (children.length > 0) {
        message.warning('请先删除下级组织');
        return;
      }
      await adminApi.deleteOrganization(id);
      message.success('已删除');
      fetchOrgs();
    } catch {
      message.error('删除失败');
    }
  };

  var parentOrgs = orgs.filter(function (o) {
    return o.id !== editingOrg?.id;
  });

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={function () {
            handleCreate(null);
          }}
        >
          新建组织
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={function () {
            if (!selectedOrg) {
              message.warning('请先选一个组织');
              return;
            }
            handleCreate(selectedOrg.id);
          }}
          disabled={!selectedOrg}
        >
          新建下级
        </Button>
        <Button
          icon={<EditOutlined />}
          onClick={function () {
            handleEdit(null);
          }}
          disabled={!selectedOrg}
        >
          编辑
        </Button>
        <Popconfirm
          title="确定删除？"
          onConfirm={function () {
            if (selectedOrg) handleDelete(selectedOrg.id);
          }}
        >
          <Button danger icon={<DeleteOutlined />} disabled={!selectedOrg}>
            删除
          </Button>
        </Popconfirm>
        <Segmented
          options={[
            { label: '树形列表', value: 'tree' },
            { label: '架构图', value: 'chart' },
          ]}
          value={viewMode}
          onChange={function (v) {
            setViewMode(v);
          }}
        />
      </Space>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          {viewMode === 'tree' ? (
            <Card loading={loading} style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              <Tree
                treeData={treeData}
                onSelect={handleSelect}
                defaultExpandAll={true}
                showLine={true}
                showIcon={true}
                blockNode={true}
              />
            </Card>
          ) : (
            <Card
              loading={loading}
              style={{
                maxHeight: 'calc(100vh - 200px)',
                overflow: 'auto',
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {chartContent}
              </div>
            </Card>
          )}
        </div>

        {selectedOrg && (
          <Card title="组织详情" style={{ width: 340, flexShrink: 0 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="编码">{selectedOrg.orgCode}</Descriptions.Item>
              <Descriptions.Item label="名称">{selectedOrg.orgName}</Descriptions.Item>
              <Descriptions.Item label="归属">
                <Tag color={getDivColor(selectedOrg, orgs).main}>
                  {getDivColor(selectedOrg, orgs).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="上级">
                {selectedOrg.parentId
                  ? orgs.find(function (o) {
                      return o.id === selectedOrg.parentId;
                    })?.orgName || '-'
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述">{selectedOrg.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="排序">{selectedOrg.sortOrder}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedOrg.status === '启用' ? 'green' : 'red'}>
                  {selectedOrg.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="岗位">
                {selectedOrg._count?.positions || 0}
              </Descriptions.Item>
              <Descriptions.Item label="员工">
                {selectedOrg._count?.employees || 0}
              </Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 12 }}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={function () {
                  handleEdit(selectedOrg);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除？"
                onConfirm={function () {
                  handleDelete(selectedOrg.id);
                }}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        )}
      </div>

      <Modal
        title={editingOrg ? '编辑组织' : '新建组织'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={function () {
          setModalVisible(false);
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orgCode"
            label="组织编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="orgName"
            label="组织名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="上级组织">
            <Select
              allowClear
              placeholder="选择上级组织（可选）"
              options={parentOrgs.map(function (o) {
                return { label: o.orgName, value: o.id };
              })}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} />
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
