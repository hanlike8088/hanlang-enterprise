import { useEffect, useState } from "react";
import { Table, Card, Row, Col, Statistic, Select, Space } from "antd";
import { manufacturingApi } from "../../services/api";

export default function EfficiencyPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | undefined>();
  const [efficiency, setEfficiency] = useState<any>(null);
  const [workerStats, setWorkerStats] = useState<any[]>([]);
  const [workerLoading, setWorkerLoading] = useState(false);

  useEffect(() => {
    manufacturingApi.getOrders("completed").then(setOrders).catch(() => {});
  }, []);

  const loadEfficiency = async (orderId: string) => {
    setSelectedOrder(orderId); setLoading(true);
    try { setEfficiency(await manufacturingApi.getEfficiencyByOrder(orderId)); }
    finally { setLoading(false); }
  };

  const loadWorkerStats = async () => {
    setWorkerLoading(true);
    try { setWorkerStats(await manufacturingApi.getEfficiencyByWorker()); }
    finally { setWorkerLoading(false); }
  };
  useEffect(() => { loadWorkerStats(); }, []);

  return (
    <div>
      <Card title="工时与效率分析" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <span>选择完工工单：</span>
          <Select
            showSearch style={{ width: 300 }} placeholder="搜索工单"
            value={selectedOrder} onChange={loadEfficiency} allowClear
            filterOption={(input, option) => (option?.label as string || "").includes(input)}
            options={orders.map((o: any) => ({ label: `${o.orderCode} - ${o.productName}`, value: o.id }))}
          />
        </Space>
        {efficiency && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}><Card size="small"><Statistic title="计划总工时" value={efficiency.totalPlannedHours} suffix="h" /></Card></Col>
              <Col span={6}><Card size="small"><Statistic title="实际总工时" value={efficiency.totalActualHours} suffix="h" /></Card></Col>
              <Col span={6}><Card size="small"><Statistic title="整体效率" value={efficiency.overallEfficiency} suffix="%" valueStyle={{ color: efficiency.overallEfficiency >= 90 ? "green" : efficiency.overallEfficiency >= 70 ? "orange" : "red" }} /></Card></Col>
              <Col span={6}><Card size="small"><Statistic title="产品" value={efficiency.productName} /></Card></Col>
            </Row>
            <Table dataSource={efficiency.details || []} rowKey="opSequence" size="small" columns={[
              { title: "序号", dataIndex: "opSequence" },
              { title: "工序名称", dataIndex: "opName" },
              { title: "计划工时", dataIndex: "plannedHours" },
              { title: "实际工时", dataIndex: "actualHours" },
              { title: "效率", dataIndex: "efficiency", render: (v: number) => <span style={{ color: v >= 90 ? "green" : v >= 70 ? "orange" : "red", fontWeight: "bold" }}>{v}%</span> },
              { title: "完工数", dataIndex: "completedQty" },
              { title: "合格数", dataIndex: "qualifiedQty" },
            ]} />
          </div>
        )}
      </Card>

      <Card title="人员效率统计">
        <Table dataSource={workerStats} rowKey="worker" loading={workerLoading} size="middle" columns={[
          { title: "工人", dataIndex: "worker" },
          { title: "总工时", dataIndex: "totalLaborHours", render: (v: number) => v.toFixed(1) + "h" },
          { title: "总加工数", dataIndex: "totalProcessed" },
          { title: "计划工时", dataIndex: "plannedHours", render: (v: number) => v.toFixed(1) + "h" },
          { title: "效率", dataIndex: "efficiency", render: (v: number) => <span style={{ color: v >= 90 ? "green" : v >= 70 ? "orange" : "red", fontWeight: "bold" }}>{v}%</span> },
        ]} />
      </Card>
    </div>
  );
}
