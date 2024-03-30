-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GlobalEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "factionId" INTEGER,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GlobalEvent_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GlobalEvent" ("createdAt", "factionId", "id", "index", "message", "title", "updatedAt") SELECT "createdAt", "factionId", "id", "index", "message", "title", "updatedAt" FROM "GlobalEvent";
DROP TABLE "GlobalEvent";
ALTER TABLE "new_GlobalEvent" RENAME TO "GlobalEvent";
CREATE UNIQUE INDEX "GlobalEvent_index_key" ON "GlobalEvent"("index");
CREATE TABLE "new_Faction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Faction" ("createdAt", "id", "index", "name", "updatedAt") SELECT "createdAt", "id", "index", "name", "updatedAt" FROM "Faction";
DROP TABLE "Faction";
ALTER TABLE "new_Faction" RENAME TO "Faction";
CREATE UNIQUE INDEX "Faction_index_key" ON "Faction"("index");
CREATE TABLE "new_Reward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "type" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Reward" ("amount", "createdAt", "id", "index", "type", "updatedAt") SELECT "amount", "createdAt", "id", "index", "type", "updatedAt" FROM "Reward";
DROP TABLE "Reward";
ALTER TABLE "new_Reward" RENAME TO "Reward";
CREATE UNIQUE INDEX "Reward_index_key" ON "Reward"("index");
CREATE TABLE "new_Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" INTEGER NOT NULL,
    "index" BIGINT NOT NULL,
    "count" INTEGER NOT NULL,
    "planetId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("count", "createdAt", "id", "index", "planetId", "type", "updatedAt") SELECT "count", "createdAt", "id", "index", "planetId", "type", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE UNIQUE INDEX "Campaign_index_key" ON "Campaign"("index");
CREATE TABLE "new_Sector" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Sector" ("createdAt", "id", "index", "name", "updatedAt") SELECT "createdAt", "id", "index", "name", "updatedAt" FROM "Sector";
DROP TABLE "Sector";
ALTER TABLE "new_Sector" RENAME TO "Sector";
CREATE UNIQUE INDEX "Sector_index_key" ON "Sector"("index");
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
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "planetId" INTEGER,
    "factionId" INTEGER,
    "campaignId" INTEGER,
    "eventType" TEXT NOT NULL,
    "health" INTEGER NOT NULL,
    "maxHealth" INTEGER NOT NULL,
    "hqNodeIndex" INTEGER,
    "startTime" DATETIME NOT NULL,
    "expireTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("campaignId", "createdAt", "eventType", "expireTime", "factionId", "health", "hqNodeIndex", "id", "index", "maxHealth", "planetId", "startTime", "updatedAt") SELECT "campaignId", "createdAt", "eventType", "expireTime", "factionId", "health", "hqNodeIndex", "id", "index", "maxHealth", "planetId", "startTime", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_index_key" ON "Order"("index");
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
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
INSERT INTO "new_Assignment" ("briefing", "createdAt", "description", "expiresAt", "id", "index", "progress", "rewardId", "title", "type", "updatedAt") SELECT "briefing", "createdAt", "description", "expiresAt", "id", "index", "progress", "rewardId", "title", "type", "updatedAt" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_index_key" ON "Assignment"("index");
CREATE UNIQUE INDEX "Assignment_rewardId_key" ON "Assignment"("rewardId");
CREATE TABLE "new_News" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "type" INTEGER NOT NULL,
    "tagIds" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_News" ("createdAt", "id", "index", "message", "publishedAt", "tagIds", "type", "updatedAt") SELECT "createdAt", "id", "index", "message", "publishedAt", "tagIds", "type", "updatedAt" FROM "News";
DROP TABLE "News";
ALTER TABLE "new_News" RENAME TO "News";
CREATE UNIQUE INDEX "News_index_key" ON "News"("index");
CREATE TABLE "new_War" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "time" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_War" ("createdAt", "endDate", "id", "index", "startDate", "time", "updatedAt") SELECT "createdAt", "endDate", "id", "index", "startDate", "time", "updatedAt" FROM "War";
DROP TABLE "War";
ALTER TABLE "new_War" RENAME TO "War";
CREATE UNIQUE INDEX "War_index_key" ON "War"("index");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
