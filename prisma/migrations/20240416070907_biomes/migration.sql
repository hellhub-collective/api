/*
  Warnings:

  - Added the required column `biomeId` to the `Planet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Biome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Effect" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_Effect" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_Effect_A_fkey" FOREIGN KEY ("A") REFERENCES "Effect" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Effect_B_fkey" FOREIGN KEY ("B") REFERENCES "Planet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "sectorId" INTEGER NOT NULL,
    "health" INTEGER NOT NULL,
    "maxHealth" INTEGER NOT NULL,
    "players" INTEGER NOT NULL,
    "disabled" BOOLEAN NOT NULL,
    "regeneration" INTEGER NOT NULL,
    "liberation" REAL NOT NULL,
    "liberationRate" REAL NOT NULL,
    "liberationState" TEXT NOT NULL,
    "initialOwnerId" INTEGER NOT NULL,
    "positionX" REAL NOT NULL,
    "positionY" REAL NOT NULL,
    "globalEventId" INTEGER,
    "biomeId" INTEGER NOT NULL,
    "statisticId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Faction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_initialOwnerId_fkey" FOREIGN KEY ("initialOwnerId") REFERENCES "Faction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_globalEventId_fkey" FOREIGN KEY ("globalEventId") REFERENCES "GlobalEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Planet_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_statisticId_fkey" FOREIGN KEY ("statisticId") REFERENCES "Stats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Planet" ("createdAt", "disabled", "globalEventId", "health", "id", "index", "initialOwnerId", "liberation", "liberationRate", "liberationState", "maxHealth", "name", "ownerId", "players", "positionX", "positionY", "regeneration", "sectorId", "statisticId", "updatedAt") SELECT "createdAt", "disabled", "globalEventId", "health", "id", "index", "initialOwnerId", "liberation", "liberationRate", "liberationState", "maxHealth", "name", "ownerId", "players", "positionX", "positionY", "regeneration", "sectorId", "statisticId", "updatedAt" FROM "Planet";
DROP TABLE "Planet";
ALTER TABLE "new_Planet" RENAME TO "Planet";
CREATE UNIQUE INDEX "Planet_index_key" ON "Planet"("index");
CREATE UNIQUE INDEX "Planet_statisticId_key" ON "Planet"("statisticId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Biome_index_key" ON "Biome"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Effect_index_key" ON "Effect"("index");

-- CreateIndex
CREATE UNIQUE INDEX "_Effect_AB_unique" ON "_Effect"("A", "B");

-- CreateIndex
CREATE INDEX "_Effect_B_index" ON "_Effect"("B");
