-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleCode" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT '启用',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permCode" TEXT NOT NULL,
    "permName" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminRolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permId" TEXT NOT NULL,
    CONSTRAINT "AdminRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminRolePermission_permId_fkey" FOREIGN KEY ("permId") REFERENCES "AdminPermission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminPositionRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "positionId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "AdminPositionRole_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "AdminPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminPositionRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_roleCode_key" ON "AdminRole"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_permCode_key" ON "AdminPermission"("permCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRolePermission_roleId_permId_key" ON "AdminRolePermission"("roleId", "permId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPositionRole_positionId_roleId_key" ON "AdminPositionRole"("positionId", "roleId");
