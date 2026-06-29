-- CreateTable
CREATE TABLE "AdminCodingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "yearDigits" INTEGER NOT NULL DEFAULT 4,
    "serialDigits" INTEGER NOT NULL DEFAULT 4,
    "separator" TEXT NOT NULL DEFAULT '-',
    "currentSerial" INTEGER NOT NULL DEFAULT 1,
    "resetPeriod" TEXT NOT NULL DEFAULT 'yearly',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminWorkflowState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stateCode" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "isEnd" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminWorkflowTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "fromStateId" TEXT NOT NULL,
    "toStateId" TEXT NOT NULL,
    "transitionName" TEXT NOT NULL,
    "requiredPerm" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminWorkflowTransition_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "AdminWorkflowState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminWorkflowTransition_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "AdminWorkflowState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminSystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminCodingRule_docType_key" ON "AdminCodingRule"("docType");

-- CreateIndex
CREATE UNIQUE INDEX "AdminWorkflowState_stateCode_key" ON "AdminWorkflowState"("stateCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminWorkflowTransition_module_fromStateId_toStateId_key" ON "AdminWorkflowTransition"("module", "fromStateId", "toStateId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSystemSetting_settingKey_key" ON "AdminSystemSetting"("settingKey");
