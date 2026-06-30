import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Tag,
  Space,
  message,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Tabs,
} from 'antd';
import {
  CalculatorOutlined,
  HistoryOutlined,
  LineChartOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { costApi, plmApi } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

export default function CostPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();
  const [compareResult, setCompareResult] = useState<any>(null);
  const [detailSheet, setDetailSheet] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'compare' | 'history' | 'trend' | 'price' | 'summary'>(
    'compare',
  );

  // 趋势数据
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // 价格历史
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [priceMaterial, setPriceMaterial] = useState<string | undefined>();

  // 汇总
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    plmApi
      .getProducts()
      .then(setProducts)
      .catch(() => {});
    costApi
      .getSheets()
      .then(setSheets)
      .catch(() => {});
  }, []);

  // === 快速计算 ===
  const handleQuickCompare = async () => {
    if (!selectedProduct) {
      message.warning('请选择产品');
      return;
    }
    setLoading(true);
    try {
      const result = await costApi.quickCompare(selectedProduct);
      setCompareResult(result);
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSheet = async () => {
    if (!selectedProduct) return;
    const product = products.find((p) => p.id === selectedProduct);
    setLoading(true);
    try {
      await costApi.createSheet({
        productId: selectedProduct,
        productName: product?.productName,
        productCode: product?.productCode,
      });
      message.success('成本核算表已保存');
      const s = await costApi.getSheets();
      setSheets(s);
      setActiveTab('history');
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 历史记录 ===
  const handleViewSheet = async (id: string) => {
    const sheet = await costApi.getSheet(id);
    setDetailSheet(sheet);
    setDetailOpen(true);
  };

  const handleDeleteSheet = async (id: string) => {
    await costApi.deleteSheet(id);
    message.success('已删除');
    setSheets(await costApi.getSheets());
  };

  // === 成本趋势 ===
  const loadTrend = async () => {
    setTrendLoading(true);
    try {
      const data = await costApi.getTrend({ productId: selectedProduct, limit: 12 });
      setTrendData(data);
    } catch (e: any) {
      message.error(e?.message);
    } finally {
      setTrendLoading(false);
    }
  };

  // === 价格追踪 ===
  const loadPriceHistory = async () => {
    if (!priceMaterial) {
      message.warning('请选择物料');
      return;
    }
    try {
      const data = await costApi.getPriceHistory(priceMaterial);
      setPriceHistory(data);
    } catch (e: any) {
      message.error(e?.message);
    }
  };

  // === 汇总 ===
  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const data = await costApi.getSummary();
      setSummaryData(data);
    } catch (e: any) {
      message.error(e?.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  // === 列定义 ===
  const sheetColumns = [
    { title: '编码', dataIndex: 'sheetCode', width: 120 },
    { title: '产品', dataIndex: 'productName', width: 180 },
    {
      title: '标准成本',
      dataIndex: 'standardCost',
      width: 100,
      render: (v: number) => v.toFixed(2),
    },
    { title: '实际成本', dataIndex: 'actualCost', width: 100, render: (v: number) => v.toFixed(2) },
    {
      title: '差异',
      dataIndex: 'variance',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>{v.toFixed(2)}</span>
      ),
    },
    {
      title: '差异率',
      dataIndex: 'variancePct',
      width: 80,
      render: (v: number) => <Tag color={Math.abs(v) > 10 ? 'red' : 'blue'}>{v.toFixed(1)}%</Tag>,
    },
    { title: '期间', dataIndex: 'period', width: 100 },
    {
      title: '计算时间',
      dataIndex: 'calculatedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewSheet(r.id)}>
            详情
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDeleteSheet(r.id)}>
            删
          </Button>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    { title: '物料', dataIndex: 'materialName', width: 150 },
    { title: '编码', dataIndex: 'materialCode', width: 120 },
    { title: 'BOM用量', dataIndex: 'bomQuantity', width: 80 },
    {
      title: '标准单价',
      dataIndex: 'standardPrice',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '0.0000',
    },
    {
      title: '标准总价',
      dataIndex: 'standardTotal',
      width: 100,
      render: (v: number) => v?.toFixed(2) || '0.00',
    },
    {
      title: '实际单价',
      dataIndex: 'actualPrice',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '0.0000',
    },
    {
      title: '实际总价',
      dataIndex: 'actualTotal',
      width: 100,
      render: (v: number) => v?.toFixed(2) || '0.00',
    },
    {
      title: '差异',
      dataIndex: 'variance',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>{(v || 0).toFixed(2)}</span>
      ),
    },
  ];

  const summaryColumns = [
    { title: '产品', dataIndex: 'productName', width: 180 },
    { title: '最近期间', dataIndex: 'latestPeriod', width: 100 },
    {
      title: '最新标准成本',
      dataIndex: 'latestStandardCost',
      width: 120,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '最新实际成本',
      dataIndex: 'latestActualCost',
      width: 120,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '最新差异',
      dataIndex: 'latestVariance',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>{v.toFixed(2)}</span>
      ),
    },
    {
      title: '最新差异率',
      dataIndex: 'latestVariancePct',
      width: 90,
      render: (v: number) => <Tag color={Math.abs(v) > 10 ? 'red' : 'blue'}>{v.toFixed(1)}%</Tag>,
    },
    {
      title: '均值|差异率|',
      dataIndex: 'avgAbsVariancePct',
      width: 90,
      render: (v: number) => <Tag color={v > 10 ? 'orange' : 'blue'}>{v.toFixed(1)}%</Tag>,
    },
    { title: '核算次数', dataIndex: 'sheetCount', width: 80 },
  ];

  const priceHistoryColumns = [
    { title: '期间', dataIndex: 'period', width: 100 },
    { title: '产品', dataIndex: 'productName', width: 150 },
    {
      title: '标准单价',
      dataIndex: 'standardPrice',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '0.0000',
    },
    {
      title: '实际单价',
      dataIndex: 'actualPrice',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '0.0000',
    },
    {
      title: '差异',
      dataIndex: 'variance',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>{(v || 0).toFixed(2)}</span>
      ),
    },
  ];

  // 趋势图表数据转换
  const chartData = trendData.map((t: any, i: number) => ({
    name: t.period,
    标准成本: t.standardCost,
    实际成本: t.actualCost,
    差异: t.variance,
  }));

  // BOM物料下拉选项
  const materialOptions =
    compareResult?.items?.map((item: any) => ({
      value: item.materialId,
      label: `${item.materialCode || item.materialId} ${item.materialName}`,
    })) || [];

  return (
    <div>
      {/* 公共产品选择器和操作栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            showSearch
            placeholder="选择产品"
            style={{ width: 280 }}
            value={selectedProduct}
            onChange={setSelectedProduct}
            filterOption={(input, option) => (option?.label as string)?.includes(input)}
            options={products.map((p: any) => ({ value: p.id, label: p.productCode || '' }))}
          />
          {activeTab === 'compare' && (
            <>
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                loading={loading}
                onClick={handleQuickCompare}
              >
                快速计算
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={() => {
                  costApi.getSheets().then(setSheets);
                  setActiveTab('history');
                }}
              >
                历史记录
              </Button>
            </>
          )}
          {activeTab === 'trend' && (
            <Button
              type="primary"
              icon={<LineChartOutlined />}
              loading={trendLoading}
              onClick={loadTrend}
            >
              加载趋势
            </Button>
          )}
          {activeTab === 'summary' && (
            <Button
              type="primary"
              icon={<AppstoreOutlined />}
              loading={summaryLoading}
              onClick={loadSummary}
            >
              加载汇总
            </Button>
          )}
        </Space>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as any)}
        items={[
          {
            key: 'compare',
            label: (
              <span>
                <CalculatorOutlined /> 成本对比
              </span>
            ),
            children: (
              <>
                {compareResult && (
                  <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic
                            title="标准成本"
                            value={compareResult.standardCost?.toFixed(2)}
                            precision={2}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic
                            title="实际成本"
                            value={compareResult.actualCost?.toFixed(2)}
                            precision={2}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic
                            title="差异额"
                            value={compareResult.variance?.toFixed(2)}
                            precision={2}
                            valueStyle={{
                              color: compareResult.variance > 0 ? '#cf1322' : '#3f8600',
                            }}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic
                            title="差异率"
                            value={compareResult.variancePct?.toFixed(1) + '%'}
                            precision={1}
                            valueStyle={{
                              color:
                                Math.abs(compareResult.variancePct) > 10 ? '#cf1322' : '#3f8600',
                            }}
                          />
                        </Card>
                      </Col>
                    </Row>
                    <Table
                      dataSource={compareResult.items}
                      columns={itemColumns}
                      rowKey="materialId"
                      pagination={false}
                      size="small"
                    />
                    <div style={{ marginTop: 16 }}>
                      <Button type="primary" onClick={handleSaveSheet} loading={loading}>
                        保存为核算表
                      </Button>
                    </div>
                  </>
                )}
                {!compareResult && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    选择一个产品，点击"快速计算"对比标准成本与实际成本
                  </div>
                )}
              </>
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> 历史记录
              </span>
            ),
            children: (
              <Table
                dataSource={sheets}
                columns={sheetColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'trend',
            label: (
              <span>
                <LineChartOutlined /> 成本趋势
              </span>
            ),
            children: (
              <>
                {trendData.length > 0 && (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(v: number) => v.toFixed(2)} />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="标准成本"
                          stroke="#1890ff"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="实际成本"
                          stroke="#f5222d"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <Table
                      dataSource={trendData}
                      rowKey="sheetId"
                      size="small"
                      style={{ marginTop: 16 }}
                      columns={[
                        { title: '期间', dataIndex: 'period', width: 100 },
                        { title: '产品', dataIndex: 'productName', width: 150 },
                        {
                          title: '标准成本',
                          dataIndex: 'standardCost',
                          width: 100,
                          render: (v: number) => v.toFixed(2),
                        },
                        {
                          title: '实际成本',
                          dataIndex: 'actualCost',
                          width: 100,
                          render: (v: number) => v.toFixed(2),
                        },
                        {
                          title: '差异',
                          dataIndex: 'variance',
                          width: 100,
                          render: (v: number) => (
                            <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>
                              {v.toFixed(2)}
                            </span>
                          ),
                        },
                        {
                          title: '差异率',
                          dataIndex: 'variancePct',
                          width: 80,
                          render: (v: number) => (
                            <Tag color={Math.abs(v) > 10 ? 'red' : 'blue'}>{v.toFixed(1)}%</Tag>
                          ),
                        },
                        {
                          title: '标准环比',
                          dataIndex: 'standardChange',
                          width: 90,
                          render: (v: number) =>
                            v != null ? (
                              <Tag color={v > 0 ? 'red' : 'green'}>{v.toFixed(1)}%</Tag>
                            ) : (
                              '-'
                            ),
                        },
                        {
                          title: '实际环比',
                          dataIndex: 'actualChange',
                          width: 90,
                          render: (v: number) =>
                            v != null ? (
                              <Tag color={v > 0 ? 'red' : 'green'}>{v.toFixed(1)}%</Tag>
                            ) : (
                              '-'
                            ),
                        },
                      ]}
                      pagination={false}
                    />
                  </>
                )}
                {trendData.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    选择产品，点击"加载趋势"查看标准成本与实际成本变化趋势
                  </div>
                )}
              </>
            ),
          },
          {
            key: 'price',
            label: (
              <span>
                <DollarOutlined /> 价格追踪
              </span>
            ),
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Select
                    showSearch
                    placeholder="选择物料"
                    style={{ width: 280 }}
                    value={priceMaterial}
                    onChange={setPriceMaterial}
                    filterOption={(input, option) => (option?.label as string)?.includes(input)}
                    options={materialOptions}
                    notFoundContent={'请先在"成本对比"中选择产品并计算'}
                  />
                  <Button type="primary" onClick={loadPriceHistory}>
                    查询
                  </Button>
                </Space>
                {priceHistory && (
                  <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Descriptions size="small" column={3}>
                        <Descriptions.Item label="物料">
                          {priceHistory.materialName}
                        </Descriptions.Item>
                        <Descriptions.Item label="编码">
                          {priceHistory.materialCode}
                        </Descriptions.Item>
                        <Descriptions.Item label="当前定价">
                          <Tag color="blue">
                            {priceHistory.currentPrice?.toFixed(4) || '0.0000'}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                    {priceHistory.history?.length > 0 ? (
                      <Table
                        dataSource={priceHistory.history}
                        columns={priceHistoryColumns}
                        rowKey="sheetId"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                        该物料暂无价格历史记录
                      </div>
                    )}
                  </>
                )}
                {!priceHistory && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    选择物料，点击"查询"查看该物料在各期核算中的价格变化
                  </div>
                )}
              </>
            ),
          },
          {
            key: 'summary',
            label: (
              <span>
                <AppstoreOutlined /> 成本汇总
              </span>
            ),
            children: (
              <>
                {summaryData.length > 0 && (
                  <Table
                    dataSource={summaryData}
                    columns={summaryColumns}
                    rowKey="productId"
                    pagination={false}
                  />
                )}
                {summaryData.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    点击"加载汇总"查看所有产品的最新成本核算概览
                  </div>
                )}
              </>
            ),
          },
        ]}
      />

      <Modal
        title="成本核算详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={900}
        footer={null}
      >
        {detailSheet && (
          <>
            <Descriptions column={4} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="产品">{detailSheet.productName}</Descriptions.Item>
              <Descriptions.Item label="编码">{detailSheet.productCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="期间">{detailSheet.period}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="blue">{detailSheet.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标准成本">
                <strong>{detailSheet.standardCost?.toFixed(2)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="实际成本">
                <strong>{detailSheet.actualCost?.toFixed(2)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="差异">
                <strong style={{ color: detailSheet.variance > 0 ? '#cf1322' : '#3f8600' }}>
                  {detailSheet.variance?.toFixed(2)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="差异率">
                <Tag color={Math.abs(detailSheet.variancePct) > 10 ? 'red' : 'blue'}>
                  {detailSheet.variancePct?.toFixed(1)}%
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Table
              dataSource={detailSheet.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </div>
  );
}
