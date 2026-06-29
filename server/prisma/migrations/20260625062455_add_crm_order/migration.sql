-- CreateTable
CREATE TABLE "CrmOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderCode" TEXT NOT NULL,
    "quoteId" TEXT,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deliveryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending_confirm',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrmOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CrmOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CrmOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmOrder_orderCode_key" ON "CrmOrder"("orderCode");

-- CreateIndex
CREATE INDEX "CrmOrderItem_orderId_idx" ON "CrmOrderItem"("orderId");
