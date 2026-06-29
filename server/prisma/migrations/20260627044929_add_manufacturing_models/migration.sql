-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalCode" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "docCode" TEXT,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "requestedBy" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approver" TEXT,
    "approvedAt" DATETIME,
    "decision" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transitionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovalRecord_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "AdminWorkflowTransition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductRouting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "routingCode" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'V1.0',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoutingOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routingId" TEXT NOT NULL,
    "opSequence" INTEGER NOT NULL,
    "opName" TEXT NOT NULL,
    "opCode" TEXT NOT NULL,
    "workCenter" TEXT,
    "machineNo" TEXT,
    "standardLaborHours" REAL NOT NULL DEFAULT 0,
    "standardMachineHours" REAL NOT NULL DEFAULT 0,
    "previousOpSequence" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoutingOperation_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "ProductRouting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManufacturingOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "productCode" TEXT,
    "routingId" TEXT,
    "planId" TEXT,
    "quantity" INTEGER NOT NULL,
    "completedQty" INTEGER NOT NULL DEFAULT 0,
    "qualifiedQty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "plannedStart" DATETIME,
    "plannedEnd" DATETIME,
    "actualStart" DATETIME,
    "actualEnd" DATETIME,
    "customerName" TEXT,
    "salesOrderCode" TEXT,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManufacturingOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManufacturingOrderOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "routingOpId" TEXT,
    "opSequence" INTEGER NOT NULL,
    "opName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "workCenter" TEXT,
    "machineNo" TEXT,
    "assignedWorker" TEXT,
    "plannedHours" REAL NOT NULL DEFAULT 0,
    "actualHours" REAL NOT NULL DEFAULT 0,
    "plannedStart" DATETIME,
    "plannedEnd" DATETIME,
    "actualStart" DATETIME,
    "actualEnd" DATETIME,
    "inputQty" INTEGER NOT NULL DEFAULT 0,
    "completedQty" INTEGER NOT NULL DEFAULT 0,
    "qualifiedQty" INTEGER NOT NULL DEFAULT 0,
    "defectQty" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManufacturingOrderOperation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ManufacturingOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialIssuing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueCode" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "operationId" TEXT,
    "materialId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialCode" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '件',
    "warehouseId" TEXT,
    "locationId" TEXT,
    "issuedBy" TEXT,
    "receivedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialIssuing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ManufacturingOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportCode" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "worker" TEXT,
    "shift" TEXT,
    "processedQty" INTEGER NOT NULL DEFAULT 0,
    "qualifiedQty" INTEGER NOT NULL DEFAULT 0,
    "defectQty" INTEGER NOT NULL DEFAULT 0,
    "defectReason" TEXT,
    "laborHours" REAL NOT NULL DEFAULT 0,
    "machineHours" REAL NOT NULL DEFAULT 0,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "scanCode" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationReport_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "ManufacturingOrderOperation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planCode" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planPeriod" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "capacityHours" REAL NOT NULL DEFAULT 0,
    "usedHours" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionPlanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "orderId" TEXT,
    "itemName" TEXT NOT NULL,
    "workCenter" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'machine',
    "resourceId" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calendarDate" DATETIME NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "shift" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "capacityHours" REAL NOT NULL DEFAULT 8,
    "note" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrmPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "reconciliationId" TEXT,
    "amount" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'bank_transfer',
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNo" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrmPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CrmOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CrmPayment_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "CrmReconciliation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CrmPayment" ("amount", "createdAt", "customerId", "id", "notes", "orderId", "paymentCode", "paymentDate", "paymentMethod", "reconciliationId", "referenceNo") SELECT "amount", "createdAt", "customerId", "id", "notes", "orderId", "paymentCode", "paymentDate", "paymentMethod", "reconciliationId", "referenceNo" FROM "CrmPayment";
DROP TABLE "CrmPayment";
ALTER TABLE "new_CrmPayment" RENAME TO "CrmPayment";
CREATE UNIQUE INDEX "CrmPayment_paymentCode_key" ON "CrmPayment"("paymentCode");
CREATE INDEX "CrmPayment_customerId_idx" ON "CrmPayment"("customerId");
CREATE INDEX "CrmPayment_reconciliationId_idx" ON "CrmPayment"("reconciliationId");
CREATE TABLE "new_ErpMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT NOT NULL,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ErpMaterial" ("category", "createdAt", "id", "materialCode", "materialName", "price", "safetyStock", "spec", "stock", "unit", "updatedAt") SELECT "category", "createdAt", "id", "materialCode", "materialName", "price", "safetyStock", "spec", "stock", "unit", "updatedAt" FROM "ErpMaterial";
DROP TABLE "ErpMaterial";
ALTER TABLE "new_ErpMaterial" RENAME TO "ErpMaterial";
CREATE UNIQUE INDEX "ErpMaterial_materialCode_key" ON "ErpMaterial"("materialCode");
CREATE TABLE "new_PlmBom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "bomCode" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'V1.0',
    "materialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlmBom_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PlmProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PlmBom" ("bomCode", "createdAt", "id", "materialId", "productId", "quantity", "unit", "updatedAt", "version") SELECT "bomCode", "createdAt", "id", "materialId", "productId", "quantity", "unit", "updatedAt", "version" FROM "PlmBom";
DROP TABLE "PlmBom";
ALTER TABLE "new_PlmBom" RENAME TO "PlmBom";
CREATE UNIQUE INDEX "PlmBom_bomCode_key" ON "PlmBom"("bomCode");
CREATE TABLE "new_PlmDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "docCode" TEXT NOT NULL,
    "docName" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "patentType" TEXT,
    "expirationDate" DATETIME,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'V1.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlmDocument_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PlmProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlmDocument" ("createdAt", "docCode", "docName", "docType", "expirationDate", "filePath", "fileSize", "id", "patentType", "productId", "updatedAt", "version") SELECT "createdAt", "docCode", "docName", "docType", "expirationDate", "filePath", "fileSize", "id", "patentType", "productId", "updatedAt", "version" FROM "PlmDocument";
DROP TABLE "PlmDocument";
ALTER TABLE "new_PlmDocument" RENAME TO "PlmDocument";
CREATE UNIQUE INDEX "PlmDocument_docCode_key" ON "PlmDocument"("docCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRecord_approvalCode_key" ON "ApprovalRecord"("approvalCode");

-- CreateIndex
CREATE INDEX "ApprovalRecord_module_status_idx" ON "ApprovalRecord"("module", "status");

-- CreateIndex
CREATE INDEX "ApprovalRecord_docId_idx" ON "ApprovalRecord"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRouting_routingCode_key" ON "ProductRouting"("routingCode");

-- CreateIndex
CREATE INDEX "RoutingOperation_routingId_idx" ON "RoutingOperation"("routingId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingOrder_orderCode_key" ON "ManufacturingOrder"("orderCode");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_status_idx" ON "ManufacturingOrder"("status");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_planId_idx" ON "ManufacturingOrder"("planId");

-- CreateIndex
CREATE INDEX "ManufacturingOrderOperation_orderId_idx" ON "ManufacturingOrderOperation"("orderId");

-- CreateIndex
CREATE INDEX "ManufacturingOrderOperation_status_idx" ON "ManufacturingOrderOperation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialIssuing_issueCode_key" ON "MaterialIssuing"("issueCode");

-- CreateIndex
CREATE INDEX "MaterialIssuing_orderId_idx" ON "MaterialIssuing"("orderId");

-- CreateIndex
CREATE INDEX "MaterialIssuing_materialId_idx" ON "MaterialIssuing"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationReport_reportCode_key" ON "OperationReport"("reportCode");

-- CreateIndex
CREATE INDEX "OperationReport_operationId_idx" ON "OperationReport"("operationId");

-- CreateIndex
CREATE INDEX "OperationReport_scanCode_idx" ON "OperationReport"("scanCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionPlan_planCode_key" ON "ProductionPlan"("planCode");

-- CreateIndex
CREATE INDEX "ProductionPlan_status_idx" ON "ProductionPlan"("status");

-- CreateIndex
CREATE INDEX "ProductionPlan_planPeriod_idx" ON "ProductionPlan"("planPeriod");

-- CreateIndex
CREATE INDEX "ProductionPlanItem_planId_idx" ON "ProductionPlanItem"("planId");

-- CreateIndex
CREATE INDEX "WorkCalendar_calendarDate_idx" ON "WorkCalendar"("calendarDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCalendar_calendarDate_shift_key" ON "WorkCalendar"("calendarDate", "shift");
