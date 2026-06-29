-- CreateTable
CREATE TABLE "CrmCustomer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'potential',
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "creditLimit" REAL,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrmContactRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "contactDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactType" TEXT NOT NULL DEFAULT 'phone',
    "content" TEXT NOT NULL,
    "nextFollowUp" DATETIME,
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmContactRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmCustomer_customerCode_key" ON "CrmCustomer"("customerCode");

-- CreateIndex
CREATE INDEX "CrmContactRecord_customerId_idx" ON "CrmContactRecord"("customerId");
