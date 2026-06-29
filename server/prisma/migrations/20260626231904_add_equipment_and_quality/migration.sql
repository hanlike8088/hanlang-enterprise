-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "paymentTerms" TEXT;

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentCode" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "modelNo" TEXT,
    "manufacturer" TEXT,
    "location" TEXT,
    "purchaseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT '运行中',
    "category" TEXT NOT NULL DEFAULT '外购设备',
    "patentId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EquipmentDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT '图纸',
    "docName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "uploadBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentDocument_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TpmCheckStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "checkItem" TEXT NOT NULL,
    "checkMethod" TEXT,
    "normalRange" TEXT,
    "unit" TEXT,
    "frequency" TEXT NOT NULL DEFAULT '每日',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TpmCheckStandard_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TpmCheckPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planCode" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "checkDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待执行',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TpmCheckPlan_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TpmCheckRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "checkItem" TEXT NOT NULL,
    "checkResult" TEXT NOT NULL DEFAULT '正常',
    "reading" TEXT,
    "note" TEXT,
    "checkedBy" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredRepair" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TpmCheckRecord_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TpmCheckPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TpmCheckRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planCode" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT '定期保养',
    "content" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "nextDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT '计划中',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenancePlan_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "planId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "workType" TEXT NOT NULL DEFAULT '保养',
    "status" TEXT NOT NULL DEFAULT '待执行',
    "description" TEXT,
    "assignedTo" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceWorkOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MaintenancePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceWorkOrder_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestCode" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "faultDescription" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT '一般',
    "reporter" TEXT,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT '待派工',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "repairMethod" TEXT,
    "partsUsed" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT '待维修',
    "result" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairWorkOrder_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RepairRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairWorkOrder_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partCode" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT NOT NULL DEFAULT '个',
    "safetyStock" REAL NOT NULL DEFAULT 0,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "price" REAL,
    "category" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SparePartRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "beforeQty" REAL NOT NULL,
    "afterQty" REAL NOT NULL,
    "reference" TEXT,
    "operator" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SparePartRecord_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SparePart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialCode" TEXT,
    "itemName" TEXT NOT NULL,
    "specUpper" REAL,
    "specLower" REAL,
    "unit" TEXT,
    "aql" TEXT,
    "testMethod" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IncomingMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionCode" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "materialId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialCode" TEXT,
    "supplierName" TEXT,
    "batchNo" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '个',
    "arrivalDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT '待检',
    "inspector" TEXT,
    "inspectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InspectionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incomingId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "specUpper" REAL,
    "specLower" REAL,
    "unit" TEXT,
    "measuredValue" REAL NOT NULL,
    "result" TEXT NOT NULL DEFAULT '待判',
    "note" TEXT,
    "inspectedBy" TEXT,
    "inspectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspectionRecord_incomingId_fkey" FOREIGN KEY ("incomingId") REFERENCES "IncomingMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DefectDisposition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incomingId" TEXT NOT NULL,
    "disposition" TEXT NOT NULL DEFAULT '退货',
    "reason" TEXT,
    "quantity" REAL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    CONSTRAINT "DefectDisposition_incomingId_fkey" FOREIGN KEY ("incomingId") REFERENCES "IncomingMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FirstPieceInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionCode" TEXT NOT NULL,
    "workOrderId" TEXT,
    "productName" TEXT NOT NULL,
    "shift" TEXT,
    "machineNo" TEXT,
    "status" TEXT NOT NULL DEFAULT '待检验',
    "inspector" TEXT,
    "result" TEXT,
    "note" TEXT,
    "inspectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PatrolInspectionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planCode" TEXT NOT NULL,
    "checkDate" DATETIME NOT NULL,
    "shift" TEXT,
    "productLine" TEXT,
    "frequency" TEXT NOT NULL DEFAULT '每2小时',
    "status" TEXT NOT NULL DEFAULT '待执行',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PatrolInspectionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT,
    "checkItem" TEXT NOT NULL,
    "checkResult" TEXT NOT NULL DEFAULT '合格',
    "note" TEXT,
    "checkedBy" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredNcr" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PatrolInspectionRecord_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PatrolInspectionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutgoingInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionCode" TEXT NOT NULL,
    "orderId" TEXT,
    "productName" TEXT NOT NULL,
    "batchNo" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '个',
    "status" TEXT NOT NULL DEFAULT '待检',
    "inspector" TEXT,
    "result" TEXT,
    "note" TEXT,
    "inspectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NcrReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ncrCode" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "productName" TEXT NOT NULL,
    "defectType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT '一般',
    "quantity" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT '待评审',
    "disposition" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CapaReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capaCode" TEXT NOT NULL,
    "ncrId" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "responsible" TEXT,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT '待实施',
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CapaReport_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "NcrReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GaugeInstrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gaugeCode" TEXT NOT NULL,
    "gaugeName" TEXT NOT NULL,
    "modelNo" TEXT,
    "manufacturer" TEXT,
    "serialNo" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT '使用中',
    "calibrationCycle" INTEGER NOT NULL DEFAULT 12,
    "lastCalibrationDate" DATETIME,
    "nextCalibrationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gaugeId" TEXT NOT NULL,
    "calibrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" TEXT NOT NULL DEFAULT '合格',
    "agency" TEXT,
    "certificateNo" TEXT,
    "note" TEXT,
    "calibratedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalibrationRecord_gaugeId_fkey" FOREIGN KEY ("gaugeId") REFERENCES "GaugeInstrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_equipmentCode_key" ON "Equipment"("equipmentCode");

-- CreateIndex
CREATE INDEX "EquipmentDocument_equipmentId_idx" ON "EquipmentDocument"("equipmentId");

-- CreateIndex
CREATE INDEX "TpmCheckStandard_equipmentId_idx" ON "TpmCheckStandard"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TpmCheckPlan_planCode_key" ON "TpmCheckPlan"("planCode");

-- CreateIndex
CREATE INDEX "TpmCheckPlan_equipmentId_idx" ON "TpmCheckPlan"("equipmentId");

-- CreateIndex
CREATE INDEX "TpmCheckPlan_checkDate_idx" ON "TpmCheckPlan"("checkDate");

-- CreateIndex
CREATE INDEX "TpmCheckRecord_planId_idx" ON "TpmCheckRecord"("planId");

-- CreateIndex
CREATE INDEX "TpmCheckRecord_equipmentId_idx" ON "TpmCheckRecord"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenancePlan_planCode_key" ON "MaintenancePlan"("planCode");

-- CreateIndex
CREATE INDEX "MaintenancePlan_equipmentId_idx" ON "MaintenancePlan"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorkOrder_orderCode_key" ON "MaintenanceWorkOrder"("orderCode");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_equipmentId_idx" ON "MaintenanceWorkOrder"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairRequest_requestCode_key" ON "RepairRequest"("requestCode");

-- CreateIndex
CREATE INDEX "RepairRequest_equipmentId_idx" ON "RepairRequest"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairWorkOrder_orderCode_key" ON "RepairWorkOrder"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "RepairWorkOrder_requestId_key" ON "RepairWorkOrder"("requestId");

-- CreateIndex
CREATE INDEX "RepairWorkOrder_equipmentId_idx" ON "RepairWorkOrder"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_partCode_key" ON "SparePart"("partCode");

-- CreateIndex
CREATE INDEX "SparePartRecord_partId_idx" ON "SparePartRecord"("partId");

-- CreateIndex
CREATE INDEX "InspectionStandard_materialId_idx" ON "InspectionStandard"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingMaterial_inspectionCode_key" ON "IncomingMaterial"("inspectionCode");

-- CreateIndex
CREATE INDEX "IncomingMaterial_purchaseOrderId_idx" ON "IncomingMaterial"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "IncomingMaterial_status_idx" ON "IncomingMaterial"("status");

-- CreateIndex
CREATE INDEX "InspectionRecord_incomingId_idx" ON "InspectionRecord"("incomingId");

-- CreateIndex
CREATE UNIQUE INDEX "DefectDisposition_incomingId_key" ON "DefectDisposition"("incomingId");

-- CreateIndex
CREATE UNIQUE INDEX "FirstPieceInspection_inspectionCode_key" ON "FirstPieceInspection"("inspectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "PatrolInspectionPlan_planCode_key" ON "PatrolInspectionPlan"("planCode");

-- CreateIndex
CREATE INDEX "PatrolInspectionPlan_checkDate_idx" ON "PatrolInspectionPlan"("checkDate");

-- CreateIndex
CREATE INDEX "PatrolInspectionPlan_status_idx" ON "PatrolInspectionPlan"("status");

-- CreateIndex
CREATE INDEX "PatrolInspectionRecord_planId_idx" ON "PatrolInspectionRecord"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingInspection_inspectionCode_key" ON "OutgoingInspection"("inspectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "NcrReport_ncrCode_key" ON "NcrReport"("ncrCode");

-- CreateIndex
CREATE UNIQUE INDEX "CapaReport_capaCode_key" ON "CapaReport"("capaCode");

-- CreateIndex
CREATE UNIQUE INDEX "CapaReport_ncrId_key" ON "CapaReport"("ncrId");

-- CreateIndex
CREATE UNIQUE INDEX "GaugeInstrument_gaugeCode_key" ON "GaugeInstrument"("gaugeCode");

-- CreateIndex
CREATE INDEX "CalibrationRecord_gaugeId_idx" ON "CalibrationRecord"("gaugeId");
