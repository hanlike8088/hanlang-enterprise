import { Modal, Form, Input, Select, InputNumber, Button, Space, Card, Table } from 'antd';

interface WarehouseModalsProps {
  whModalOpen: boolean;
  locModalOpen: boolean;
  stockInOpen: boolean;
  stockOutOpen: boolean;
  fifoStockInOpen: boolean;
  fifoStockOutOpen: boolean;
  editingWh: any;
  selectedWh: any;
  warehouses: any[];
  locations: any[];
  whForm: any;
  locForm: any;
  stockForm: any;
  batchForm: any;
  setWhModalOpen: (v: boolean) => void;
  setLocModalOpen: (v: boolean) => void;
  setStockInOpen: (v: boolean) => void;
  setStockOutOpen: (v: boolean) => void;
  setFifoStockInOpen: (v: boolean) => void;
  setFifoStockOutOpen: (v: boolean) => void;
  submitWh: () => void;
  submitLoc: (values: any) => void;
  submitStockIn: () => void;
  submitStockOut: () => void;
  submitFifoStockIn: () => void;
  submitFifoStockOut: () => void;
}

export default function WarehouseModals(props: WarehouseModalsProps) {
  const { whModalOpen, locModalOpen, stockInOpen, stockOutOpen, fifoStockInOpen, fifoStockOutOpen, editingWh, selectedWh, warehouses, locations, whForm, locForm, stockForm, batchForm, setWhModalOpen, setLocModalOpen, setStockInOpen, setStockOutOpen, setFifoStockInOpen, setFifoStockOutOpen, submitWh, submitLoc, submitStockIn, submitStockOut, submitFifoStockIn, submitFifoStockOut } = props;
  return (
    <>

      <Modal
        title={editingWh ? '编辑仓库' : '新建仓库'}
        open={whModalOpen}
        onOk={submitWh}
        onCancel={() => setWhModalOpen(false)}
        width={480}
      >
        <Form form={whForm} layout="vertical">
          <Form.Item name="warehouseName" label="仓库名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="原材料仓">
            <Select
              options={['原材料仓', '半成品仓', '成品仓', '辅料仓'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Form.Item>
          <Form.Item name="manager" label="负责人">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="启用">
            <Select options={['启用', '停用'].map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`库位管理 - ${selectedWh?.warehouseName || ''}`}
        open={locModalOpen}
        onCancel={() => setLocModalOpen(false)}
        width={500}
        footer={null}
      >
        <Card size="small" title="新增库位" style={{ marginBottom: 16 }}>
          <Form form={locForm} layout="inline" onFinish={submitLoc}>
            <Form.Item name="locationName" label="库位名称" rules={[{ required: true }]}>
              <Input style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="locationCode" label="编码">
              <Input style={{ width: 100 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Form.Item>
          </Form>
        </Card>
        <Table
          pagination={false}
          size="small"
          dataSource={locations}
          columns={[
            { title: '编码', dataIndex: 'locationCode' },
            { title: '名称', dataIndex: 'locationName' },
            { title: '物料数', render: (_: any, r: any) => r._count?.inventories || 0 },
          ]}
          rowKey="id"
        />
      </Modal>

      <Modal
        title="入库操作"
        open={stockInOpen}
        onOk={submitStockIn}
        onCancel={() => setStockInOpen(false)}
        width={500}
      >
        <Form form={stockForm} layout="vertical">
          <Form.Item name="warehouseId" label="仓库" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w: any) => ({ value: w.id, label: w.warehouseName }))}
            />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
          </Form.Item>
            <Input />
          </Form.Item>
          <Form.Item name="materialId" label="物料ID">
            <Input />
          </Form.Item>
          <Form.Item name="batchNo" label="批次号">
            <Input placeholder="输入或留空自动生成" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
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
      </Modal>

      <Modal
        title="出库操作（FIFO）"
        open={stockOutOpen}
        onOk={submitStockOut}
        onCancel={() => setStockOutOpen(false)}
        width={500}
      >
        <Form form={stockForm} layout="vertical">
          <Form.Item name="warehouseId" label="仓库" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w: any) => ({ value: w.id, label: w.warehouseName }))}
            />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
          </Form.Item>
            <Input />
          </Form.Item>
          <Form.Item name="materialId" label="物料ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
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
          系统将按 FIFO 规则（先进先出）自动分配批次
        </div>
      </Modal>

      {/* FIFO 批次入库弹出框 */}
      <Modal
        title="批次入库（FIFO）"
        open={fifoStockInOpen}
        onOk={submitFifoStockIn}
        onCancel={() => setFifoStockInOpen(false)}
        width={500}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item name="warehouseId" label="仓库" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w: any) => ({ value: w.id, label: w.warehouseName }))}
            />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
          </Form.Item>
            <Input />
          </Form.Item>
          <Form.Item name="materialId" label="物料编码">
            <Input />
          </Form.Item>
          <Form.Item
            name="batchNo"
            label="批次号"
            rules={[{ required: true, message: '请输入批次号' }]}
          >
            <Input placeholder="如: LOT20260627A" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
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
      </Modal>

      {/* FIFO 批次出库弹出框 */}
      <Modal
        title="FIFO出库（先进先出）"
        open={fifoStockOutOpen}
        onOk={submitFifoStockOut}
        onCancel={() => setFifoStockOutOpen(false)}
        width={500}
      >
        <Form form={fifoForm} layout="vertical">
          <Form.Item name="warehouseId" label="仓库" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w: any) => ({ value: w.id, label: w.warehouseName }))}
            />
          </Form.Item>
          <Form.Item
            name="materialId"
            label="物料编码"
            rules={[{ required: true, message: '请输入物料编码' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true }]}>
          </Form.Item>
    </>
  );
}
