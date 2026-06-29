-- CreateTable
CREATE TABLE "CrmQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "materialCost" REAL NOT NULL DEFAULT 0,
    "laborCost" REAL NOT NULL DEFAULT 0,
    "manufacturingFee" REAL NOT NULL DEFAULT 0,
    "referencePrice" REAL NOT NULL DEFAULT 0,
    "profitRate" REAL NOT NULL DEFAULT 15,
    "finalPrice" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "validUntil" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrmQuote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmQuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CrmQuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "CrmQuote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmQuote_quoteCode_key" ON "CrmQuote"("quoteCode");

-- CreateIndex
CREATE INDEX "CrmQuoteItem_quoteId_idx" ON "CrmQuoteItem"("quoteId");
