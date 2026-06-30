import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  message,
  Descriptions,
  Timeline,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  SearchOutlined,
  ContactsOutlined,
  PhoneOutlined,
  MailOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { crmApi } from '../../services/crm';;

const { Title } = Typography;

const CATEGORY_OPTIONS = [
  { value: 'key_account', label: '大客户' },
  { value: 'regular', label: '普通客户' },
  { value: 'potential', label: '潜在客户' },
];

const CATEGORY_COLORS: Record<string, string> = {
  key_account: 'red',
  regular: 'blue',
  potential: 'green',
};

const CONTACT_TYPES = [
  { value: 'phone', label: '电话' },
  { value: 'visit', label: '拜访' },
  { value: 'email', label: '邮件' },
  { value: 'wechat', label: '微信' },
  { value: 'meeting', label: '会议' },
];

export default function 客户管理Page() {
  const handleK3Sync = async () => {
    try {
      const result = await crmApi.syncCustomersFromK3();
      message.success('已同步 ' + result.synced + ' 个客户，跳过 ' + result.skipped + ' 个');
      load客户管理();
    } catch (e: any) {
      message.error('同步失败: ' + (e?.response?.data?.message || e.message));
    }
  };
  const [customers, set客户管理] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  // Customer form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form] = Form.useForm();

  // 联系人 records modal
  const [contactModalOpen, set联系人ModalOpen] = useState(false);
  const [contactCustomer, set联系人Customer] = useState<any>(null);
  const [contactRecords, set联系人Records] = useState<any[]>([]);
  const [contactForm] = Form.useForm();

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);

  const load客户管理 = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmApi.getCustomers(keyword, categoryFilter);
      set客户管理(data);
    } catch (e: any) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryFilter]);

  useEffect(() => {
    load客户管理();
  }, [load客户管理]);

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({ category: 'potential' });
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await crmApi.updateCustomer(editingCustomer.id, values);
        message.success('客户信息已更新');
      } else {
        await crmApi.createCustomer(values);
        message.success('客户已创建');
      }
      setModalOpen(false);
      load客户管理();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(editingCustomer ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await crmApi.deleteCustomer(id);
      message.success('客户已删除');
      load客户管理();
    } catch (e: any) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = async (record: any) => {
    try {
      const data = await crmApi.getCustomer(record.id);
      setDetailCustomer(data);
      setDetailModalOpen(true);
    } catch (e: any) {
      message.error('加载客户详情失败');
    }
  };

  const handle联系人Records = async (record: any) => {
    set联系人Customer(record);
    try {
      const data = await crmApi.getContactRecords(record.id);
      set联系人Records(data);
    } catch (e: any) {
      message.error('加载联系记录失败');
    }
    set联系人ModalOpen(true);
  };

  const handleAdd联系人 = async () => {
    try {
      const values = await contactForm.validateFields();
      await crmApi.createContactRecord({
        ...values,
        customerId: contactCustomer.id,
        nextFollowUp: values.nextFollowUp ? values.nextFollowUp.toISOString() : undefined,
      });
      message.success('联系记录已添加');
      contactForm.resetFields();
      const data = await crmApi.getContactRecords(contactCustomer.id);
      set联系人Records(data);
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('添加失败');
    }
  };

  const handleDelete联系人 = async (id: string) => {
    try {
      await crmApi.deleteContactRecord(id);
      message.success('联系记录已删除');
      const data = await crmApi.getContactRecords(contactCustomer.id);
      set联系人Records(data);
    } catch (e: any) {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '客户编码', dataIndex: 'customerCode', width: 140 },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      width: 180,
      render: (text: string, record: any) => <a onClick={() => handleViewDetail(record)}>{text}</a>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 110,
      render: (v: string) => (
        <Tag color={CATEGORY_COLORS[v] || 'default'}>
          {CATEGORY_OPTIONS.find((o) => o.value === v)?.label || v}
        </Tag>
      ),
    },
    { title: '联系人', dataIndex: 'contactName', width: 100 },
    { title: '电话', dataIndex: 'contact电话', width: 120 },
    {
      title: '最近联系',
      dataIndex: 'contactRecords',
      width: 160,
      render: (records: any[]) =>
        records?.length > 0 ? (
          dayjs(records[0].contactDate).format('YYYY-MM-DD HH:mm')
        ) : (
          <span style={{ color: '#999' }}>暂无</span>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<ContactsOutlined />}
            onClick={() => handle联系人Records(record)}
          >
            联系
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除此客户？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>CRM 客户管理</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="搜索客户名称/编码/联系人"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 260 }}
                allowClear
              />
              <Select
                placeholder="客户分类"
                value={categoryFilter}
                onChange={setCategoryFilter}
                allowClear
                style={{ width: 140 }}
                options={CATEGORY_OPTIONS}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<SyncOutlined />} onClick={handleK3Sync}>
                同步金蝶
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增客户
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={customers}
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }}
      />

      {/* Create/编辑客户 Modal */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="客户分类" rules={[{ required: true }]}>
                <Select options={CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contactName" label="联系人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contact电话" label="电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contact邮箱" label="邮箱">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="creditLimit" label="信用额度">
                <Input type="number" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentTerms" label="账期">
                <Input placeholder="如: 30天" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        title="客户详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {detailCustomer && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="客户编码">{detailCustomer.customerCode}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{detailCustomer.customerName}</Descriptions.Item>
            <Descriptions.Item label="分类">
              <Tag color={CATEGORY_COLORS[detailCustomer.category]}>
                {CATEGORY_OPTIONS.find((o: any) => o.value === detailCustomer.category)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailCustomer.status === 'active' ? 'green' : 'default'}>
                {detailCustomer.status === 'active' ? '活跃' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="联系人">{detailCustomer.contactName}</Descriptions.Item>
            <Descriptions.Item label="电话">{detailCustomer.contact电话}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{detailCustomer.contact邮箱}</Descriptions.Item>
            <Descriptions.Item label="地址">{detailCustomer.address}</Descriptions.Item>
            <Descriptions.Item label="信用额度">
              {detailCustomer.creditLimit ? `¥${detailCustomer.creditLimit}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="账期">{detailCustomer.paymentTerms || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {detailCustomer.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
        {detailCustomer?.contactRecords?.length > 0 && (
          <Card
            title={`最近联系记录 (${detailCustomer.contactRecords.length})`}
            size="small"
            style={{ marginTop: 16 }}
          >
            <Timeline
              items={detailCustomer.contactRecords.slice(0, 10).map((r: any) => ({
                color:
                  r.nextFollowUp && !r.followUpDone && dayjs(r.nextFollowUp).isBefore(dayjs())
                    ? 'red'
                    : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {dayjs(r.contactDate).format('YYYY-MM-DD HH:mm')} ·{' '}
                      {CONTACT_TYPES.find((t: any) => t.value === r.contactType)?.label ||
                        r.contactType}
                    </div>
                    <div>{r.content}</div>
                    {r.nextFollowUp && (
                      <div style={{ fontSize: 12, color: '#999' }}>
                        下次跟进: {dayjs(r.nextFollowUp).format('YYYY-MM-DD')}{' '}
                        {r.followUpDone ? '✓已完成' : ''}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        )}
      </Modal>

      {/* 联系人 Records Modal */}
      <Modal
        title={`联系记录 - ${contactCustomer?.customerName || ''}`}
        open={contactModalOpen}
        onCancel={() => set联系人ModalOpen(false)}
        footer={null}
        width={700}
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form form={contactForm} layout="inline" onFinish={handleAdd联系人}>
            <Form.Item name="contactType" rules={[{ required: true }]} initialValue="phone">
              <Select options={CONTACT_TYPES} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="content" rules={[{ required: true, message: '请输入联系内容' }]}>
              <Input placeholder="联系内容" style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="nextFollowUp">
              <DatePicker placeholder="下次跟进日期" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                添加记录
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Timeline
          items={contactRecords.map((r: any) => ({
            color:
              r.nextFollowUp && !r.followUpDone && dayjs(r.nextFollowUp).isBefore(dayjs())
                ? 'red'
                : 'blue',
            children: (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {dayjs(r.contactDate).format('YYYY-MM-DD HH:mm')} ·{' '}
                    {CONTACT_TYPES.find((t: any) => t.value === r.contactType)?.label ||
                      r.contactType}
                  </div>
                  <div>{r.content}</div>
                  {r.nextFollowUp && (
                    <div style={{ fontSize: 12, color: '#999' }}>
                      下次跟进: {dayjs(r.nextFollowUp).format('YYYY-MM-DD')}{' '}
                      {r.followUpDone ? '✓ 已跟进' : '⏳ 待跟进'}
                    </div>
                  )}
                </div>
                <Popconfirm title="删除此记录？" onConfirm={() => handleDelete联系人(r.id)}>
                  <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            ),
          }))}
        />
      </Modal>
    </div>
  );
}
