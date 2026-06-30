import { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Statistic, Row, Col } from 'antd';
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { manufacturingApi } from '../../services/manufacturing';;

const statusColors: Record<string, string> = {
  released: 'blue',
  in_progress: 'processing',
  paused: 'warning',
};

export default function WipPage() {
  const [wipData, setWipData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [byWorkCenter, setByWorkCenter] = useState<Record<string, any>>({});
  const [overdue, setOverdue] = useState<any[]>([]);

  const fetch = async () => {
    setLoading(true);
    try {
      const [wip, wc, ov] = await Promise.all([
        manufacturingApi.getWipOverview(),
        manufacturingApi.getWipByWorkCenter(),
        manufacturingApi.getOverdueWarnings(),
      ]);
      setWipData(wip);
      setByWorkCenter(wc);
      setOverdue(ov);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, []);

  const columns = [
    { title: '工单号', dataIndex: 'orderCode', width: 130 },
    { title: '产品名称', dataIndex: 'productName' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
    { title: '总数量', dataIndex: 'quantity', width: 70 },
    { title: '已完工', dataIndex: 'completedQty', width: 70 },
    {
      title: '当前工序',
      dataIndex: 'currentOperation',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '当前工位',
      dataIndex: 'currentWorkCenter',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '停留时长(h)',
      dataIndex: 'stayHours',
      width: 100,
      render: (v: number | null) =>
        v !== null ? <span style={{ color: v! > 24 ? 'red' : undefined }}>{v}h</span> : '-',
    },
    {
      title: '是否超期',
      dataIndex: 'isOverdue',
      width: 80,
      render: (v: boolean) => (v ? <Tag color="red">超期</Tag> : <Tag color="green">正常</Tag>),
    },
    {
      title: '计划完成',
      dataIndex: 'plannedEnd',
      width: 100,
      render: (v: any) => v?.split('T')[0],
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="在制工单" value={wipData.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="超期工单"
              value={overdue.length}
              valueStyle={{ color: overdue.length > 0 ? 'red' : undefined }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="工作中工序"
              value={Object.values(byWorkCenter).reduce((s: number, wc: any) => s + wc.count, 0)}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ClockCircleOutlined /> WIP 在制品看板
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={wipData}
          loading={loading}
          rowKey="orderId"
          size="middle"
        />
      </Card>

      {overdue.length > 0 && (
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: 'red' }} /> 超期预警
            </Space>
          }
          style={{ marginTop: 16 }}
        >
          <Table
            dataSource={overdue}
            rowKey="orderId"
            size="small"
            columns={[
              { title: '工单号', dataIndex: 'orderCode' },
              { title: '产品', dataIndex: 'productName' },
              { title: '计划完成', dataIndex: 'plannedEnd', render: (v: any) => v?.split('T')[0] },
              {
                title: '逾期天数',
                dataIndex: 'overdueDays',
                render: (v: number) => <Tag color="red">{v} 天</Tag>,
              },
              {
                title: '当前工序',
                dataIndex: 'currentOperation',
                render: (v: string | null) => v || '-',
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
              },
            ]}
          />
        </Card>
      )}

      <Card title="按工作中心分布" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(byWorkCenter).map(([wc, info]: [string, any]) => (
            <Col span={8} key={wc}>
              <Card size="small" title={wc}>
                <Statistic title="进行中工序数" value={info.count} />
                <Statistic title="在制总数" value={info.totalQty} />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
