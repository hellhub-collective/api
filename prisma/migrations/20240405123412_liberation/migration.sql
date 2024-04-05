/*
  Warnings:

  - Added the required column `liberation` to the `Planet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liberationRate` to the `Planet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liberationState` to the `Planet` table without a default value. This is not possible if the table is not empty.

*/
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
    "statisticId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Faction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_initialOwnerId_fkey" FOREIGN KEY ("initialOwnerId") REFERENCES "Faction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planet_globalEventId_fkey" FOREIGN KEY ("globalEventId") REFERENCES "GlobalEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Planet_statisticId_fkey" FOREIGN KEY ("statisticId") REFERENCES "Stats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Planet" ("createdAt", "disabled", "globalEventId", "health", "id", "index", "initialOwnerId", "maxHealth", "name", "ownerId", "players", "positionX", "positionY", "regeneration", "sectorId", "statisticId", "updatedAt") SELECT "createdAt", "disabled", "globalEventId", "health", "id", "index", "initialOwnerId", "maxHealth", "name", "ownerId", "players", "positionX", "positionY", "regeneration", "sectorId", "statisticId", "updatedAt" FROM "Planet";
DROP TABLE "Planet";
ALTER TABLE "new_Planet" RENAME TO "Planet";
CREATE UNIQUE INDEX "Planet_index_key" ON "Planet"("index");
CREATE UNIQUE INDEX "Planet_statisticId_key" ON "Planet"("statisticId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
