-- CreateTable
CREATE TABLE "AssignmentTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" INTEGER NOT NULL,
    "values" TEXT NOT NULL,
    "valueTypes" TEXT NOT NULL,
    "assignmentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssignmentTask_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" BIGINT NOT NULL,
    "progress" TEXT NOT NULL,
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
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
