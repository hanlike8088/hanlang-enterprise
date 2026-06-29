-- CreateTable
CREATE TABLE "CrmComplaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaintCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "complaintType" TEXT NOT NULL DEFAULT 'quality',
    "severity" TEXT NOT NULL DEFAULT 'minor',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrmComplaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrmComplaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CrmOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconciliationCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "paymentDueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrmReconciliation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrmReconciliation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CrmOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmPayment" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrmPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CrmOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CrmPayment_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "CrmReconciliation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmComplaint_complaintCode_key" ON "CrmComplaint"("complaintCode");

-- CreateIndex
CREATE INDEX "CrmComplaint_customerId_idx" ON "CrmComplaint"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmReconciliation_reconciliationCode_key" ON "CrmReconciliation"("reconciliationCode");

-- CreateIndex
CREATE INDEX "CrmReconciliation_customerId_idx" ON "CrmReconciliation"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmPayment_paymentCode_key" ON "CrmPayment"("paymentCode");

-- CreateIndex
CREATE INDEX "CrmPayment_customerId_idx" ON "CrmPayment"("customerId");

-- CreateIndex
CREATE INDEX "CrmPayment_reconciliationId_idx" ON "CrmPayment"("reconciliationId");
