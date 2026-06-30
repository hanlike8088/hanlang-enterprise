import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Descriptions,
  Space,
  message,
  Button,
} from 'antd';
import {
  CloudSyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function K3CloudPage() {
  const [loginInfo, setLoginInfo] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [login, mat, sup] = await Promise.all([
        axios.get('/api/k3cloud/login').then((r) => r.data),
        axios.get('/api/k3cloud/materials').then((r) => r.data),
        axios.get('/api/k3cloud/suppliers').then((r) => r.data),
      ]);
      setLoginInfo(login);
      setMaterials(mat?.Result || mat || []);
      setSuppliers(sup?.Result || sup || []);
      message.success('金蝶数据同步成功');
    } catch (e: any) {
      message.error('金蝶连接失败: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const matColumns = [
    { title: '物料编码', dataIndex: 0, key: 'code', width: 160 },
    { title: '物料名称', dataIndex: 1, key: 'name', width: 200 },
    { title: '规格型号', dataIndex: 2, key: 'spec' },
  ];

  const supColumns = [
    { title: '供应商编码', dataIndex: 0, key: 'code', width: 140 },
    { title: '供应商名称', dataIndex: 1, key: 'name', width: 250 },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <CloudSyncOutlined /> 金蝶云星空对接
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          刷新数据
        </Button>
      </div>

      {loginInfo && (
        <Card size="small" style={{ marginBottom: 16, background: '#f6ffed' }}>
          <Descriptions size="small" column={3}>
            <Descriptions.Item label="连接状态">
              <Tag icon={<CheckCircleOutlined />} color="success">
                已连接
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="服务器">{loginInfo.server}</Descriptions.Item>
            <Descriptions.Item label="公司">{loginInfo.company}</Descriptions.Item>
            <Descriptions.Item label="数据库">{loginInfo.dataCenter}</Descriptions.Item>
            <Descriptions.Item label="Session">
              {loginInfo.sessionId?.substring(0, 16)}...
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={`物料 (${Array.isArray(materials) ? materials.length : 0})`} size="small">
            <Table
              dataSource={Array.isArray(materials) ? materials.slice(0, 10) : []}
              columns={matColumns}
              rowKey={(_, i) => String(i)}
              size="small"
              pagination={false}
              loading={loading}
            />
            {Array.isArray(materials) && materials.length > 10 && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                共 {materials.length} 条，仅显示前 10 条
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={`供应商 (${Array.isArray(suppliers) ? suppliers.length : 0})`} size="small">
            <Table
              dataSource={Array.isArray(suppliers) ? suppliers.slice(0, 10) : []}
              columns={supColumns}
              rowKey={(_, i) => String(i)}
              size="small"
              pagination={false}
              loading={loading}
            />
            {Array.isArray(suppliers) && suppliers.length > 10 && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                共 {suppliers.length} 条，仅显示前 10 条
              </Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
