-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawingCode" TEXT NOT NULL,
    "drawingName" TEXT NOT NULL,
    "productId" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "latestVersion" TEXT NOT NULL DEFAULT 'V1.0',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Drawing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PlmProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrawingVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawingId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'pdf',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "changeNote" TEXT,
    "uploadBy" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DrawingVersion_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "Drawing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Drawing_drawingCode_idx" ON "Drawing"("drawingCode");

-- CreateIndex
CREATE INDEX "DrawingVersion_drawingId_idx" ON "DrawingVersion"("drawingId");
