-- CreateTable
CREATE TABLE "StratagemGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stratagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codename" TEXT,
    "name" TEXT NOT NULL,
    "keys" TEXT NOT NULL,
    "uses" TEXT NOT NULL,
    "cooldown" INTEGER NOT NULL,
    "activation" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "groupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stratagem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StratagemGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
