import { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Space, Tag, Spin, Typography, Timeline, Empty, Divider, Tabs, Table, message, Descriptions, Badge } from 'antd';
import { SearchOutlined, NodeIndexOutlined, SwapOutlined, BarcodeOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function TracePage() {
  const [entityType, setEntityType] = useState('crmOrder');
  const [entityId, setEntityId] = useState('');
  const [traceResult, setTraceResult] = useState<any>(null);
  const [eventChain, setEventChain] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('module');

  // Batch trace state
  const [batchNo, setBatchNo] = useState('');
  const [batchMaterialId, setBatchMaterialId] = useState('');
  const [traceBatches, setTraceBatches] = useState<any[]>([]);
  const [fullTrace, setFullTrace] = useState<any>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [batchStats, setBatchStats] = useState<any>(null);

  const token = localStorage.getItem('access_token');

  const handleTrace = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const [traceRes, chainRes] = await Promise.all([
        fetch(`/api/dashboard/trace?entityType=${entityType}&entityId=${entityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        fetch('/api/dashboard/event-chain', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
      ]);
      setTraceResult(traceRes);
      setEventChain(chainRes);
    } finally {
      setLoading(false);
    }
  };

  // Batch trace handlers
  const loadBatches = async () => {
    setTraceLoading(true);
    try {
      const res = await fetch('/api/batch-trace/batches', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setAllBatches(res || []);
    } catch { } finally { setTraceLoading(false); }
  };

  const loadBatchStats = async () => {
    try {
      const res = await fetch('/api/batch-trace/stats', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setBatchStats(res);
    } catch { }
  };

  const handleBatchTrace = async () => {
    if (!batchNo && !batchMaterialId) return;
    setTraceLoading(true);
    try {
      const params = new URLSearchParams();
      if (batchNo) params.set('batchNo', batchNo);
      if (batchMaterialId) params.set('materialId', batchMaterialId);
      const [tracesRes, fullRes] = await Promise.all([
        fetch(`/api/batch-trace/traces?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        batchNo ? fetch(`/api/batch-trace/traces/full/${batchNo}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()) : null,
      ]);
      setTraceBatches(tracesRes || []);
      setFullTrace(fullRes);
    } catch { message.error('溯源查询失败'); }
    finally { setTraceLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'batch') {
      loadBatches();
      loadBatchStats();
    }
  }, [activeTab]);

  const entityOptions = [
    { value: 'crmOrder', label: 'CRM销售订单' },
    { value: 'npiProject', label: 'NPI项目' },
    { value: 'purchaseOrder', label: '采购订单' },
    { value: 'repairRequest', label: '维修工单' },
    { value: 'ncrReport', label: '不合格报告' },
  ];

  const traceColumns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '操作', dataIndex: 'operation', key: 'operation' },
    { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', render: (v: string) => <Tag>{v}</Tag> },
    { title: '来源编号', dataIndex: 'sourceCode', key: 'sourceCode', render: (v: string) => v || '-' },
    { title: '目标类型', dataIndex: 'targetType', key: 'targetType', render: (v: string) => v ? <Tag color="green">{v}</Tag> : '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '操作人', dataIndex: 'operator', key: 'operator', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss') },
  ];

  const batchColumns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '物料编码', dataIndex: ['material', 'materialCode'], key: 'mc', render: (v: string) => v || '-' },
    { title: '物料名称', dataIndex: ['material', 'materialName'], key: 'mn', render: (v: string) => v || '-' },
    { title: '供应商', dataIndex: 'supplierName', key: 'sn', render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'qty' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Badge status={v === 'active' ? 'success' : 'default'} text={v} /> },
    { title: '生产日期', dataIndex: 'productionDate', key: 'pd', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Module Trace &amp; Batch Traceability</Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'module',
          label: <><NodeIndexOutlined /> 模块链路追踪</>,
          children: (
            <div>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  <Select value={entityType} onChange={setEntityType} style={{ width: 160 }} options={entityOptions} />
                  <Input
                    placeholder="Entity ID (UUID)"
                    value={entityId}
                    onChange={e => setEntityId(e.target.value)}
                    style={{ width: 300 }}
                    onPressEnter={handleTrace}
                  />
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleTrace} loading={loading}>
                    Trace
                  </Button>
                </Space>
              </Card>

              {traceResult && !traceResult.error && traceResult.chains?.map((chain: any, ci: number) => (
                <Card
                  key={ci}
                  title={<><NodeIndexOutlined /> {chain.name}</>}
                  size="small"
                  style={{ marginBottom: 12 }}
                >
                  {chain.error ? (
                    <Text type="danger">{chain.error}</Text>
                  ) : chain.nodes?.length > 0 ? (
                    <Timeline
                      items={chain.nodes.map((node: any) => ({
                        color: 'blue',
                        children: (
                          <div>
                            <Tag color="blue">{node.label}</Tag>
                            <Text type="secondary" style={{ fontFamily: 'monospace', marginLeft: 8, fontSize: 11 }}>
                              {node.id?.slice(0, 12)}...
                            </Text>
                            {Object.entries(node.detail || {}).map(([k, v]) => (
                              <Tag key={k} style={{ marginLeft: 4 }}>{k}: {String(v)}</Tag>
                            ))}
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <Empty description="No trace data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              ))}

              {traceResult?.error && (
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Text type="danger">{traceResult.error}</Text>
                </Card>
              )}

              {loading && <Spin style={{ display: 'block', margin: '20px auto' }} />}

              {eventChain?.chains && (
                <Card title={<><SwapOutlined /> Cross-Module Event Chains</>} size="small">
                  <Row gutter={[12, 12]}>
                    {eventChain.chains.map((chain: any) => (
                      <Col xs={24} sm={12} lg={8} key={chain.id}>
                        <Card size="small" hoverable>
                          <Space direction="vertical" size={4}>
                            <Space>
                              <Tag color="green">{chain.source}</Tag>
                              <SwapOutlined style={{ color: '#999' }} />
                              <Tag color="blue">{chain.target}</Tag>
                            </Space>
                            <Text style={{ fontSize: 11 }} type="secondary">{chain.trigger}</Text>
                            <Text>{chain.description}</Text>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </div>
          ),
        },
        {
          key: 'batch',
          label: <><BarcodeOutlined /> 批次追溯</>,
          children: (
            <div>
              {batchStats && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}><Card size="small"><Text type="secondary">批次总数</Text><Title level={5} style={{ margin: 0 }}>{batchStats.batchCount}</Title></Card></Col>
                  <Col span={6}><Card size="small"><Text type="secondary">追溯记录</Text><Title level={5} style={{ margin: 0 }}>{batchStats.traceCount}</Title></Card></Col>
                  <Col span={6}><Card size="small"><Text type="secondary">活跃批次</Text><Title level={5} style={{ margin: 0 }}>{batchStats.activeBatches}</Title></Card></Col>
                  <Col span={6}><Card size="small"><Text type="secondary">标签数量</Text><Title level={5} style={{ margin: 0 }}>{batchStats.labelCount}</Title></Card></Col>
                </Row>
              )}

              <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  <Input
                    placeholder="批次号"
                    value={batchNo}
                    onChange={e => setBatchNo(e.target.value)}
                    style={{ width: 200 }}
                    prefix={<BarcodeOutlined />}
                    onPressEnter={handleBatchTrace}
                  />
                  <Input
                    placeholder="物料ID"
                    value={batchMaterialId}
                    onChange={e => setBatchMaterialId(e.target.value)}
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                  />
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleBatchTrace} loading={traceLoading}>
                    批次追溯
                  </Button>
                  <Button icon={<HistoryOutlined />} onClick={loadBatches}>刷新批次列表</Button>
                </Space>
              </Card>

              {fullTrace && (
                <>
                  <Card title="正向追溯链" size="small" style={{ marginBottom: 12 }}>
                    {fullTrace.forward?.length > 0 ? (
                      <Timeline
                        items={fullTrace.forward.map((t: any) => ({
                          color: 'blue',
                          children: (
                            <div>
                              <Tag color="blue">{t.operation}</Tag>
                              <Tag>{t.sourceType} {'->'} {t.targetType || 'END'}</Tag>
                              <Text type="secondary" style={{ fontFamily: 'monospace', marginLeft: 4, fontSize: 11 }}>
                                #{t.batchNo} qty:{t.quantity}
                              </Text>
                              <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                                {dayjs(t.createdAt).format('MM-DD HH:mm:ss')}
                              </Text>
                            </div>
                          ),
                        }))}
                      />
                    ) : <Empty description="无追溯记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                  </Card>

                  {fullTrace.related?.length > 0 && (
                    <Card title="关联批次" size="small" style={{ marginBottom: 12 }}>
                      <Space wrap>
                        {fullTrace.related.map((r: any, i: number) => (
                          <Tag key={i} color="orange">{r.batchNo} ({r.operation})</Tag>
                        ))}
                      </Space>
                    </Card>
                  )}
                </>
              )}

              <Divider />

              <Card title="全部追踪记录" size="small" style={{ marginBottom: 12 }}>
                <Table
                  dataSource={traceBatches}
                  columns={traceColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 20 }}
                  loading={traceLoading}
                />
              </Card>

              <Card title="批次清单" size="small">
                <Table
                  dataSource={allBatches}
                  columns={batchColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 15 }}
                  loading={traceLoading}
                />
              </Card>
            </div>
          ),
        },
      ]} />
    </div>
  );
}
