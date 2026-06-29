-- AlterTable
ALTER TABLE "SamplingWorkOrder" ADD COLUMN "drawingId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "orgId" TEXT NOT NULL,
    "hireDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminEmployee_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "AdminOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdminEmployee" ("createdAt", "email", "employeeCode", "hireDate", "id", "name", "orgId", "phone", "status", "updatedAt") SELECT "createdAt", "email", "employeeCode", "hireDate", "id", "name", "orgId", "phone", "status", "updatedAt" FROM "AdminEmployee";
DROP TABLE "AdminEmployee";
ALTER TABLE "new_AdminEmployee" RENAME TO "AdminEmployee";
CREATE UNIQUE INDEX "AdminEmployee_employeeCode_key" ON "AdminEmployee"("employeeCode");
CREATE TABLE "new_AdminOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgCode" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminOrganization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AdminOrganization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AdminOrganization" ("createdAt", "description", "id", "orgCode", "orgName", "parentId", "sortOrder", "status", "updatedAt") SELECT "createdAt", "description", "id", "orgCode", "orgName", "parentId", "sortOrder", "status", "updatedAt" FROM "AdminOrganization";
DROP TABLE "AdminOrganization";
ALTER TABLE "new_AdminOrganization" RENAME TO "AdminOrganization";
CREATE UNIQUE INDEX "AdminOrganization_orgCode_key" ON "AdminOrganization"("orgCode");
CREATE TABLE "new_AdminPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "positionCode" TEXT NOT NULL,
    "positionName" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminPosition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "AdminOrganization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdminPosition" ("createdAt", "description", "id", "orgId", "positionCode", "positionName", "status", "updatedAt") SELECT "createdAt", "description", "id", "orgId", "positionCode", "positionName", "status", "updatedAt" FROM "AdminPosition";
DROP TABLE "AdminPosition";
ALTER TABLE "new_AdminPosition" RENAME TO "AdminPosition";
CREATE UNIQUE INDEX "AdminPosition_positionCode_key" ON "AdminPosition"("positionCode");
CREATE TABLE "new_AdminRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleCode" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AdminRole" ("createdAt", "description", "id", "roleCode", "roleName", "status", "updatedAt") SELECT "createdAt", "description", "id", "roleCode", "roleName", "status", "updatedAt" FROM "AdminRole";
DROP TABLE "AdminRole";
ALTER TABLE "new_AdminRole" RENAME TO "AdminRole";
CREATE UNIQUE INDEX "AdminRole_roleCode_key" ON "AdminRole"("roleCode");
CREATE TABLE "new_ErpWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ErpWorkOrder" ("createdAt", "endDate", "id", "orderCode", "priority", "productId", "quantity", "startDate", "status", "updatedAt") SELECT "createdAt", "endDate", "id", "orderCode", "priority", "productId", "quantity", "startDate", "status", "updatedAt" FROM "ErpWorkOrder";
DROP TABLE "ErpWorkOrder";
ALTER TABLE "new_ErpWorkOrder" RENAME TO "ErpWorkOrder";
CREATE UNIQUE INDEX "ErpWorkOrder_orderCode_key" ON "ErpWorkOrder"("orderCode");
CREATE TABLE "new_NpiApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "applicant" TEXT NOT NULL,
    "approver" TEXT,
    "comment" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NpiApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NpiProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NpiApproval" ("applicant", "approvalType", "approver", "comment", "createdAt", "decidedAt", "id", "projectId", "status", "updatedAt") SELECT "applicant", "approvalType", "approver", "comment", "createdAt", "decidedAt", "id", "projectId", "status", "updatedAt" FROM "NpiApproval";
DROP TABLE "NpiApproval";
ALTER TABLE "new_NpiApproval" RENAME TO "NpiApproval";
CREATE TABLE "new_NpiIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueCode" TEXT NOT NULL,
    "projectId" TEXT,
    "trialRunId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'major',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignee" TEXT,
    "solution" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NpiIssue_trialRunId_fkey" FOREIGN KEY ("trialRunId") REFERENCES "NpiTrialRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NpiIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NpiProject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NpiIssue" ("assignee", "createdAt", "description", "id", "issueCode", "projectId", "resolvedAt", "severity", "solution", "status", "title", "trialRunId", "updatedAt") SELECT "assignee", "createdAt", "description", "id", "issueCode", "projectId", "resolvedAt", "severity", "solution", "status", "title", "trialRunId", "updatedAt" FROM "NpiIssue";
DROP TABLE "NpiIssue";
ALTER TABLE "new_NpiIssue" RENAME TO "NpiIssue";
CREATE UNIQUE INDEX "NpiIssue_issueCode_key" ON "NpiIssue"("issueCode");
CREATE TABLE "new_NpiProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectCode" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "productId" TEXT,
    "startDate" DATETIME NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "actualEndDate" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NpiProject" ("actualEndDate", "createdAt", "description", "id", "priority", "productId", "projectCode", "projectName", "startDate", "status", "targetDate", "updatedAt") SELECT "actualEndDate", "createdAt", "description", "id", "priority", "productId", "projectCode", "projectName", "startDate", "status", "targetDate", "updatedAt" FROM "NpiProject";
DROP TABLE "NpiProject";
ALTER TABLE "new_NpiProject" RENAME TO "NpiProject";
CREATE UNIQUE INDEX "NpiProject_projectCode_key" ON "NpiProject"("projectCode");
CREATE TABLE "new_NpiTrialRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trialCode" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "result" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NpiTrialRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NpiProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NpiTrialRun" ("batchSize", "createdAt", "createdBy", "endDate", "id", "projectId", "result", "startDate", "status", "trialCode", "updatedAt") SELECT "batchSize", "createdAt", "createdBy", "endDate", "id", "projectId", "result", "startDate", "status", "trialCode", "updatedAt" FROM "NpiTrialRun";
DROP TABLE "NpiTrialRun";
ALTER TABLE "new_NpiTrialRun" RENAME TO "NpiTrialRun";
CREATE UNIQUE INDEX "NpiTrialRun_trialCode_key" ON "NpiTrialRun"("trialCode");
CREATE TABLE "new_PlmProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "modelNo" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'developing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PlmProduct" ("category", "createdAt", "description", "id", "modelNo", "productCode", "productName", "status", "updatedAt") SELECT "category", "createdAt", "description", "id", "modelNo", "productCode", "productName", "status", "updatedAt" FROM "PlmProduct";
DROP TABLE "PlmProduct";
ALTER TABLE "new_PlmProduct" RENAME TO "PlmProduct";
CREATE UNIQUE INDEX "PlmProduct_productCode_key" ON "PlmProduct"("productCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
