-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierCode" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "bankAccount" TEXT,
    "taxId" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '潜在',
    "rating" TEXT NOT NULL DEFAULT 'C',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierQcdsScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "qualityScore" REAL NOT NULL DEFAULT 0,
    "costScore" REAL NOT NULL DEFAULT 0,
    "deliveryScore" REAL NOT NULL DEFAULT 0,
    "serviceScore" REAL NOT NULL DEFAULT 0,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierQcdsScore_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待审批',
    "applicant" TEXT,
    "approver" TEXT,
    "comment" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierApproval_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '草稿',
    "totalAmount" REAL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '个',
    "unitPrice" REAL,
    "totalPrice" REAL,
    "expectedDate" DATETIME,
    CONSTRAINT "PurchaseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "beforeQty" REAL NOT NULL DEFAULT 0,
    "afterQty" REAL NOT NULL,
    "reference" TEXT,
    "operator" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseCode" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '原材料仓',
    "address" TEXT,
    "manager" TEXT,
    "status" TEXT NOT NULL DEFAULT '启用',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WarehouseLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationCode" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '启用',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WarehouseInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "locationId" TEXT,
    "materialId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialCode" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "safetyStock" REAL NOT NULL DEFAULT 0,
    "abcClass" TEXT NOT NULL DEFAULT 'C',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarehouseInventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WarehouseInventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspector" TEXT,
    "result" TEXT NOT NULL DEFAULT '合格',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrderReceipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderSaleOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrderSaleOrder_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconCode" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderAmount" REAL NOT NULL DEFAULT 0,
    "receiptAmount" REAL NOT NULL DEFAULT 0,
    "invoiceAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '待对账',
    "diffType" TEXT,
    "diffAmount" REAL NOT NULL DEFAULT 0,
    "confirmedBy" TEXT,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApReconciliation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentCode" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT '银行转账',
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApPayment_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "ApReconciliation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_supplierCode_key" ON "Supplier"("supplierCode");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderCode_key" ON "PurchaseOrder"("orderCode");

-- CreateIndex
CREATE INDEX "InventoryRecord_materialId_idx" ON "InventoryRecord"("materialId");

-- CreateIndex
CREATE INDEX "InventoryRecord_warehouse_idx" ON "InventoryRecord"("warehouse");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_warehouseCode_key" ON "Warehouse"("warehouseCode");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseLocation_warehouseId_locationCode_key" ON "WarehouseLocation"("warehouseId", "locationCode");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseInventory_warehouseId_materialId_key" ON "WarehouseInventory"("warehouseId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderReceipt_receiptCode_key" ON "PurchaseOrderReceipt"("receiptCode");

-- CreateIndex
CREATE INDEX "PurchaseOrderReceipt_orderId_idx" ON "PurchaseOrderReceipt"("orderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderSaleOrder_saleOrderId_idx" ON "PurchaseOrderSaleOrder"("saleOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderSaleOrder_purchaseOrderId_saleOrderId_key" ON "PurchaseOrderSaleOrder"("purchaseOrderId", "saleOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ApReconciliation_reconCode_key" ON "ApReconciliation"("reconCode");

-- CreateIndex
CREATE UNIQUE INDEX "ApPayment_paymentCode_key" ON "ApPayment"("paymentCode");
