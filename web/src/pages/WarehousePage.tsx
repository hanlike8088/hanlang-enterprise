import WarehouseModals from './Warehouse/WarehouseModals';
﻿import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Tabs,
  InputNumber,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  Result,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined,
  WarningOutlined,
  PieChartOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import { CloudSyncOutlined } from '@ant-design/icons';
import { warehouseApi } from '../services/warehouse';;
import { erpApi } from '../services/erp';;
import dayjs from 'dayjs';

const whTypeColors: Record<string, string> = {
  原材料仓: 'blue',
  半成品仓: 'purple',
  成品仓: 'green',
  辅料仓: 'orange',
};
const abcColors: Record<string, string> = { A: 'red', B: 'blue', C: 'default' };
const batchStatusColors: Record<string, string> = {
  available: 'green',
  depleted: 'default',
  locked: 'orange',
};
const agingColors: Record<string, string> = { 正常: 'green', 预警: 'orange', 超期: 'red' };

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [abcDist, setAbcDist] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [whModalOpen, setWhModalOpen] = useState(false);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<any>(null);
  const [selectedWh, setSelectedWh] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('warehouses');
  const [whForm] = Form.useForm();
  const [locForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [invKeyword, setInvKeyword] = useState('');

  // FIFO 批次管理 state
  const [batchInventories, setBatchInventories] = useState<any[]>([]);
  const [fifoAging, setFifoAging] = useState<any[]>([]);
  const [fifoStockInOpen, setFifoStockInOpen] = useState(false);
  const [fifoStockOutOpen, setFifoStockOutOpen] = useState(false);
  const [fifoPickResult, setFifoPickResult] = useState<any>(null);
  const [batchForm] = Form.useForm();
  const [fifoForm] = Form.useForm();
  const [agingDaysThreshold, setAgingDaysThreshold] = useState(90);

  const handleSyncMaterials = async () => {
    try {
      const result = await erpApi.syncMaterialsFromK3();
      message.success('已同步 ' + result.synced + ' 个物料，跳过 ' + result.skipped + ' 个');
    } catch (e: any) {
      message.error('同步物料失败: ' + (e?.response?.data?.message || e.message));
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [whs, inv, recs, warns, abc, st] = await Promise.all([
        warehouseApi.getAll(),
        warehouseApi.getInventory(),
        warehouseApi.getRecords(),
        warehouseApi.getWarnings(),
        warehouseApi.getAbcDistribution(),
        warehouseApi.getStats(),
      ]);
      setWarehouses(whs);
      setInventory(inv);
      setRecords(recs);
      setWarnings(warns);
      setAbcDist(abc);
      setStats(st);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchInventory = async (whId?: string) => {
    setInventory(await warehouseApi.getInventory(whId ? { warehouseId: whId } : {}));
  };

  // FIFO 数据加载
  const fetchBatchInventory = async (whId?: string) => {
    const data = await warehouseApi.getBatchInventories(whId ? { warehouseId: whId } : {});
    setBatchInventories(data);
  };
  const fetchFifoAging = async (whId?: string) => {
    const data = await warehouseApi.getFifoAging(
      whId
        ? { warehouseId: whId, daysThreshold: agingDaysThreshold }
        : { daysThreshold: agingDaysThreshold },
    );
    setFifoAging(data);
  };

  const openWhCreate = () => {
    setEditingWh(null);
    whForm.resetFields();
    setWhModalOpen(true);
  };
  const openWhEdit = (r: any) => {
    setEditingWh(r);
    whForm.setFieldsValue(r);
    setWhModalOpen(true);
  };
  const submitWh = async () => {
    const v = await whForm.validateFields();
    editingWh ? await warehouseApi.update(editingWh.id, v) : await warehouseApi.create(v);
    message.success(editingWh ? '已更新' : '已创建');
    setWhModalOpen(false);
    fetchAll();
  };
  const removeWh = async (id: string) => {
    await warehouseApi.delete(id);
    message.success('已删除');
    fetchAll();
  };

  const openLoc = async (wh: any) => {
    setSelectedWh(wh);
    setLocations(await warehouseApi.getLocations(wh.id));
    setLocModalOpen(true);
  };
  const submitLoc = async () => {
    const v = await locForm.validateFields();
    await warehouseApi.createLocation(selectedWh.id, v);
    message.success('库位已创建');
    setLocations(await warehouseApi.getLocations(selectedWh.id));
    locForm.resetFields();
  };

  const submitStockIn = async () => {
    const v = await stockForm.validateFields();
    await warehouseApi.stockInWithBatch(v);
    message.success('入库成功');
    setStockInOpen(false);
    fetchAll();
  };

  const submitStockOut = async () => {
    const v = await stockForm.validateFields();
    try {
      const result = await warehouseApi.stockOutFifo(v);
      setFifoPickResult(result);
      message.success('出库成功（FIFO）');
      setStockOutOpen(false);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message);
    }
  };

  // FIFO 批次入库
  const submitFifoStockIn = async () => {
    const v = await batchForm.validateFields();
    await warehouseApi.stockInWithBatch(v);
    message.success('批次入库成功');
    setFifoStockInOpen(false);
    fetchAll();
    fetchBatchInventory(v.warehouseId);
  };

  // FIFO 批次出库
  const submitFifoStockOut = async () => {
    const v = await fifoForm.validateFields();
    try {
      const result = await warehouseApi.stockOutFifo(v);
      setFifoPickResult(result);
      message.success('FIFO出库完成');
      setFifoStockOutOpen(false);
      fetchAll();
      fetchBatchInventory(v.warehouseId);
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message);
    }
  };

  const whColumns = [
    { title: '编码', dataIndex: 'warehouseCode', key: 'code', width: 100 },
    { title: '名称', dataIndex: 'warehouseName', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => <Tag color={whTypeColors[v]}>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag>,
    },
    { title: '负责人', dataIndex: 'manager', key: 'mgr', width: 100 },
    {
      title: '库位数',
      key: 'locCount',
      width: 80,
      render: (_: any, r: any) => r._count?.locations || 0,
    },
    {
      title: '物料数',
      key: 'invCount',
      width: 80,
      render: (_: any, r: any) => r._count?.inventories || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openWhEdit(r)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              fetchInventory(r.id);
              openLoc(r);
            }}
          >
            库位
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => {
              fetchInventory(r.id);
              setActiveTab('inventory');
            }}
          >
            库存
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => removeWh(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const invColumns = [
    { title: '物料名称', dataIndex: 'materialName', key: 'name', ellipsis: true },
    { title: '编码', dataIndex: 'materialCode', key: 'code', width: 120 },
    {
      title: '仓库',
      key: 'wh',
      width: 100,
      render: (_: any, r: any) => r.warehouse?.warehouseName || '-',
    },
    {
      title: '库位',
      key: 'loc',
      width: 100,
      render: (_: any, r: any) => r.location?.locationName || '-',
    },
    { title: '数量', dataIndex: 'quantity', key: 'qty', width: 80 },
    { title: '安全库存', dataIndex: 'safetyStock', key: 'ss', width: 80 },
    {
      title: 'ABC分类',
      key: 'abc',
      width: 80,
      render: (_: any, r: any) => (
        <Select
          size="small"
          value={r.abcClass}
          style={{ width: 70 }}
          onChange={async (v) => {
            await warehouseApi.updateAbcClass(r.id, v);
            fetchAll();
          }}
        >
          {['A', 'B', 'C'].map((c) => (
            <Select.Option key={c} value={c}>
              <Tag color={abcColors[c]}>{c}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '状态',
      key: 'warn',
      width: 80,
      render: (_: any, r: any) =>
        r.safetyStock > 0 && r.quantity <= r.safetyStock ? (
          <Badge status="error" text="低于安全库存" />
        ) : (
          <Tag color="green">正常</Tag>
        ),
    },
  ];

  const recColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'time',
      width: 160,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 60,
      render: (v: string) => <Tag color={v === '入库' ? 'green' : 'red'}>{v}</Tag>,
    },
    { title: '物料ID', dataIndex: 'materialId', key: 'mid', width: 180 },
    { title: '仓库', dataIndex: 'warehouse', key: 'wh', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'qty', width: 80 },
    { title: '变动前', dataIndex: 'beforeQty', key: 'bq', width: 70 },
    { title: '变动后', dataIndex: 'afterQty', key: 'aq', width: 70 },
    { title: '操作人', dataIndex: 'operator', key: 'op', width: 100 },
    { title: '单据号', dataIndex: 'reference', key: 'ref', width: 120 },
  ];

  const warnColumns = [
    { title: '物料名称', dataIndex: 'materialName', key: 'name', ellipsis: true },
    {
      title: '仓库',
      key: 'wh',
      width: 100,
      render: (_: any, r: any) => r.warehouse?.warehouseName || '-',
    },
    { title: '当前库存', dataIndex: 'quantity', key: 'qty', width: 80 },
    { title: '安全库存', dataIndex: 'safetyStock', key: 'ss', width: 80 },
    {
      title: '差额',
      key: 'diff',
      width: 80,
      render: (_: any, r: any) => (
        <span style={{ color: 'red' }}>{r.safetyStock - r.quantity}</span>
      ),
    },
  ];

  // FIFO 批次库存列
  const batchColumns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 140 },
    { title: '物料名称', dataIndex: 'materialName', key: 'name', ellipsis: true },
    {
      title: '仓库',
      key: 'wh',
      width: 100,
      render: (_: any, r: any) => r.warehouse?.warehouseName || '-',
    },
    {
      title: '库位',
      key: 'loc',
      width: 100,
      render: (_: any, r: any) => r.location?.locationName || '-',
    },
    { title: '数量', dataIndex: 'quantity', key: 'qty', width: 80 },
    {
      title: '收货日期',
      dataIndex: 'receivedDate',
      key: 'recvDate',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '库龄(天)',
      key: 'ageDays',
      width: 90,
      render: (_: any, r: any) => {
        const days = Math.floor((Date.now() - new Date(r.receivedDate).getTime()) / 86400000);
        return (
          <span style={{ color: days > 180 ? '#cf1322' : days > 90 ? '#fa8c16' : '#3f8600' }}>
            {days}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={batchStatusColors[v] || 'default'}>
          {v === 'available' ? '可用' : v === 'depleted' ? '已耗尽' : v === 'locked' ? '锁定' : v}
        </Tag>
      ),
    },
  ];

  // FIFO 库龄分析列
  const agingColumns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 140 },
    { title: '物料名称', dataIndex: 'materialName', key: 'name', ellipsis: true },
    {
      title: '仓库',
      key: 'wh',
      width: 100,
      render: (_: any, r: any) => r.warehouse?.warehouseName || '-',
    },
    { title: '数量', dataIndex: 'quantity', key: 'qty', width: 80 },
    {
      title: '收货日期',
      dataIndex: 'receivedDate',
      key: 'recvDate',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    { title: '库龄(天)', dataIndex: 'ageDays', key: 'ageDays', width: 90 },
    {
      title: '状态',
      dataIndex: 'aging',
      key: 'aging',
      width: 80,
      render: (v: string) => <Tag color={agingColors[v] || 'default'}>{v}</Tag>,
    },
  ];

  const invFiltered = invKeyword
    ? inventory.filter(
        (i) => i.materialName?.includes(invKeyword) || i.materialCode?.includes(invKeyword),
      )
    : inventory;

  // FIFO 库龄分布统计
  const agingStats = {
    normal: fifoAging.filter((a) => a.aging === '正常').length,
    warning: fifoAging.filter((a) => a.aging === '预警').length,
    expired: fifoAging.filter((a) => a.aging === '超期').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="仓库数量" value={stats.warehouseCount || 0} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="库位数量" value={stats.locationCount || 0} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="物料种类" value={stats.invCount || 0} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="库存总量" value={stats.totalQty || 0} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="今日入库"
              value={stats.todayIn || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="今日出库"
              value={stats.todayOut || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === 'fifo') {
            fetchBatchInventory();
            fetchFifoAging();
          }
        }}
        items={[
          {
            key: 'warehouses',
            label: '仓库管理',
            children: (
              <Card
                extra={
                  <Space>
                    <Button icon={<CloudSyncOutlined />} onClick={handleSyncMaterials}>
                      同步金蝶物料
                    </Button>
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => {
                        setStockInOpen(true);
                        stockForm.resetFields();
                      }}
                    >
                      入库
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      danger
                      onClick={() => {
                        setStockOutOpen(true);
                        stockForm.resetFields();
                      }}
                    >
                      出库
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openWhCreate}>
                      新建仓库
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={warehouses}
                  columns={whColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'inventory',
            label: '即时库存',
            children: (
              <Card
                extra={
                  <Input.Search
                    placeholder="搜索物料"
                    allowClear
                    style={{ width: 240 }}
                    value={invKeyword}
                    onChange={(e) => setInvKeyword(e.target.value)}
                  />
                }
              >
                <Table
                  dataSource={invFiltered}
                  columns={invColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'records',
            label: '库存流水',
            children: (
              <Card>
                <Table
                  dataSource={records}
                  columns={recColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            ),
          },
          {
            key: 'warnings',
            label: (
              <span>
                <WarningOutlined /> 库存预警{' '}
                {warnings.length > 0 && (
                  <Badge count={warnings.length} size="small" style={{ marginLeft: 8 }} />
                )}
              </span>
            ),
            children: (
              <Card>
                <Table dataSource={warnings} columns={warnColumns} rowKey="id" pagination={false} />
              </Card>
            ),
          },
          {
            key: 'abc',
            label: (
              <span>
                <PieChartOutlined /> ABC分类
              </span>
            ),
            children: (
              <Card>
                <Descriptions column={3} size="small">
                  {abcDist.map((a: any) => (
                    <Descriptions.Item
                      key={a.abcClass}
                      label={<Tag color={abcColors[a.abcClass]}>{`${a.abcClass}类`}</Tag>}
                    >
                      {a._count} 种物料 / {a._sum?.quantity || 0} 件
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            ),
          },
          {
            key: 'fifo',
            label: (
              <span>
                <HourglassOutlined /> FIFO批次管理
              </span>
            ),
            children: (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="批次总数" value={batchInventories.length} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="正常批次"
                        value={agingStats.normal}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="预警批次"
                        value={agingStats.warning}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="超期批次"
                        value={agingStats.expired}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card
                  title="批次库存"
                  style={{ marginBottom: 16 }}
                  extra={
                    <Space>
                      <Select
                        placeholder="仓库筛选"
                        allowClear
                        style={{ width: 180 }}
                        onChange={(v) => {
                          fetchBatchInventory(v);
                          fetchFifoAging(v);
                        }}
                      >
                        {warehouses.map((w: any) => (
                          <Select.Option key={w.id} value={w.id}>
                            {w.warehouseName}
                          </Select.Option>
                        ))}
                      </Select>
                      <Button
                        icon={<UploadOutlined />}
                        type="primary"
                        onClick={() => {
                          setFifoStockInOpen(true);
                          batchForm.resetFields();
                        }}
                      >
                        批次入库
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        danger
                        onClick={() => {
                          setFifoStockOutOpen(true);
                          fifoForm.resetFields();
                        }}
                      >
                        FIFO出库
                      </Button>
                    </Space>
                  }
                >
                  <Table
                    dataSource={batchInventories}
                    columns={batchColumns}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    size="small"
                  />
                </Card>

                <Card
                  title={
                    <span>
                      库龄分析 <Tag style={{ marginLeft: 8 }}>阈值: {agingDaysThreshold}天</Tag>
                    </span>
                  }
                  extra={
                    <Space>
                      <Select
                        value={agingDaysThreshold}
                        style={{ width: 110 }}
                        onChange={(v) => {
                          setAgingDaysThreshold(v);
                          fetchFifoAging();
                        }}
                      >
                        <Select.Option value={30}>30天</Select.Option>
                        <Select.Option value={60}>60天</Select.Option>
                        <Select.Option value={90}>90天</Select.Option>
                        <Select.Option value={180}>180天</Select.Option>
                      </Select>
                    </Space>
                  }
                >
                  <Table
                    dataSource={fifoAging}
                    columns={agingColumns}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    size="small"
                  />
                </Card>

                {fifoPickResult && (
                  <Card title="最近FIFO出库结果" size="small" style={{ marginTop: 16 }}>
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="出库前库存">
                        {fifoPickResult.beforeQty}
                      </Descriptions.Item>
                      <Descriptions.Item label="出库后库存">
                        {fifoPickResult.afterQty}
                      </Descriptions.Item>
                    </Descriptions>
                    {fifoPickResult.fifoPicks && (
                      <Table
                        size="small"
                        dataSource={fifoPickResult.fifoPicks}
                        columns={[
                          { title: '批次号', dataIndex: 'batchNo', width: 140 },
                          { title: '拣货量', dataIndex: 'pickedQty', width: 80 },
                          {
                            title: '收货日期',
                            dataIndex: 'receivedDate',
                            width: 120,
                          },
                        ]}
                        rowKey="batchNo"
                      />
                    )}
                  </Card>
                )}
      <WarehouseModals
        whModalOpen={whModalOpen}
        locModalOpen={locModalOpen}
        stockInOpen={stockInOpen}
        stockOutOpen={stockOutOpen}
        fifoStockInOpen={fifoStockInOpen}
        fifoStockOutOpen={fifoStockOutOpen}
        editingWh={editingWh}
        selectedWh={selectedWh}
        warehouses={warehouses}
        locations={locations}
        whForm={whForm}
        locForm={locForm}
        stockForm={stockForm}
        batchForm={batchForm}
        setWhModalOpen={setWhModalOpen}
        setLocModalOpen={setLocModalOpen}
        setStockInOpen={setStockInOpen}
        setStockOutOpen={setStockOutOpen}
        setFifoStockInOpen={setFifoStockInOpen}
        setFifoStockOutOpen={setFifoStockOutOpen}
        submitWh={submitWh}
        submitLoc={submitLoc}
        submitStockIn={submitStockIn}
        submitStockOut={submitStockOut}
        submitFifoStockIn={submitFifoStockIn}
        submitFifoStockOut={submitFifoStockOut}
      />
        <Form form={fifoForm} layout="vertical" size="small" onFinish={submitFifoStockOut}>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="quantity" label="出库数量" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="operator" label="操作人">
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="reference" label="单据号">
            <Input />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
          系统按收货日期从早到晚自动分配批次库存
        </div>
    </div>
          )}
        ]}
      </Tabs>
  );
}
