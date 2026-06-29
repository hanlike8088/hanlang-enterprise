-- CreateTable
CREATE TABLE "SamplingWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productCategory" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "deadline" DATETIME NOT NULL,
    "description" TEXT,
    "attachmentPaths" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "applicant" TEXT NOT NULL,
    "customerName" TEXT,
    "approver" TEXT,
    "approverComment" TEXT,
    "approvedAt" DATETIME,
    "assignee" TEXT,
    "assignedAt" DATETIME,
    "progressNote" TEXT,
    "exceptionReason" TEXT,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SamplingWorkOrder_orderCode_key" ON "SamplingWorkOrder"("orderCode");
