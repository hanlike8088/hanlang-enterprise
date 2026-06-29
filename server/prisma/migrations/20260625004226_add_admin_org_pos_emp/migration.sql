-- CreateTable
CREATE TABLE "NpiProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectCode" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '立项',
    "priority" TEXT NOT NULL DEFAULT '中',
    "productId" TEXT,
    "startDate" DATETIME NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "actualEndDate" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NpiTrialRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trialCode" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT '计划中',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "result" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NpiTrialRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NpiProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NpiIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueCode" TEXT NOT NULL,
    "projectId" TEXT,
    "trialRunId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT '主要',
    "status" TEXT NOT NULL DEFAULT '待处理',
    "assignee" TEXT,
    "solution" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NpiIssue_trialRunId_fkey" FOREIGN KEY ("trialRunId") REFERENCES "NpiTrialRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NpiIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NpiProject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NpiApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待审批',
    "applicant" TEXT NOT NULL,
    "approver" TEXT,
    "comment" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NpiApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NpiProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlmProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "modelNo" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT '开发中',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlmBom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "bomCode" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'V1.0',
    "materialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlmBom_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PlmProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlmDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "docCode" TEXT NOT NULL,
    "docName" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'V1.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlmDocument_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PlmProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErpMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT NOT NULL,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待生产',
    "priority" TEXT NOT NULL DEFAULT '中',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgCode" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '启用',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminOrganization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AdminOrganization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "positionCode" TEXT NOT NULL,
    "positionName" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT '启用',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminPosition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "AdminOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "orgId" TEXT NOT NULL,
    "hireDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT '在职',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminEmployee_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "AdminOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminEmployeePosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminEmployeePosition_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "AdminEmployee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminEmployeePosition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "AdminPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NpiProject_projectCode_key" ON "NpiProject"("projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "NpiTrialRun_trialCode_key" ON "NpiTrialRun"("trialCode");

-- CreateIndex
CREATE UNIQUE INDEX "NpiIssue_issueCode_key" ON "NpiIssue"("issueCode");

-- CreateIndex
CREATE UNIQUE INDEX "PlmProduct_productCode_key" ON "PlmProduct"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "PlmBom_bomCode_key" ON "PlmBom"("bomCode");

-- CreateIndex
CREATE UNIQUE INDEX "PlmDocument_docCode_key" ON "PlmDocument"("docCode");

-- CreateIndex
CREATE UNIQUE INDEX "ErpMaterial_materialCode_key" ON "ErpMaterial"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "ErpWorkOrder_orderCode_key" ON "ErpWorkOrder"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminOrganization_orgCode_key" ON "AdminOrganization"("orgCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPosition_positionCode_key" ON "AdminPosition"("positionCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmployee_employeeCode_key" ON "AdminEmployee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmployeePosition_employeeId_positionId_key" ON "AdminEmployeePosition"("employeeId", "positionId");
