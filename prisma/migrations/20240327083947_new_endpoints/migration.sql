/*
  Warnings:

  - Added the required column `time` to the `War` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "News" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "tagIds" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "missionsWon" BIGINT NOT NULL,
    "missionsLost" BIGINT NOT NULL,
    "missionTime" BIGINT NOT NULL,
    "bugKills" BIGINT NOT NULL,
    "automatonKills" BIGINT NOT NULL,
    "illuminateKills" BIGINT NOT NULL,
    "bulletsFired" BIGINT NOT NULL,
    "bulletsHit" BIGINT NOT NULL,
    "timePlayed" BIGINT NOT NULL,
    "deaths" BIGINT NOT NULL,
    "revives" BIGINT NOT NULL,
    "friendlyKills" BIGINT NOT NULL,
    "missionSuccessRate" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "type" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "briefing" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "sectorId" INTEGER NOT NULL,
    "health" INTEGER NOT NULL,
    "maxHealth" INTEGER NOT NULL,
    "players" INTEGER NOT NULL,
    "disabled" BOOLEAN NOT NULL,
    "regeneration" INTEGER NOT NULL,
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
INSERT INTO "new_Planet" ("createdAt", "disabled", "globalEventId", "health", "id", "index", "initialOwnerId", "maxHealth", "name", "ownerId", "players", "positionX", "positionY", "regeneration", "sectorId", "updatedAt") SELECT "createdAt", "disabled", "globalEventId", "health", "id", "index", "initialOwnerId", "maxHealth", "name", "ownerId", "players", "positionX", "positionY", "regeneration", "sectorId", "updatedAt" FROM "Planet";
DROP TABLE "Planet";
ALTER TABLE "new_Planet" RENAME TO "Planet";
CREATE UNIQUE INDEX "Planet_index_key" ON "Planet"("index");
CREATE UNIQUE INDEX "Planet_statisticId_key" ON "Planet"("statisticId");
CREATE TABLE "new_War" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "time" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_War" ("createdAt", "endDate", "id", "index", "startDate", "updatedAt") SELECT "createdAt", "endDate", "id", "index", "startDate", "updatedAt" FROM "War";
DROP TABLE "War";
ALTER TABLE "new_War" RENAME TO "War";
CREATE UNIQUE INDEX "War_index_key" ON "War"("index");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "News_index_key" ON "News"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_index_key" ON "Reward"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_index_key" ON "Assignment"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_rewardId_key" ON "Assignment"("rewardId");
