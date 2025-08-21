-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "moldId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "mode" TEXT,
    "notes" TEXT,
    "skillMetrics" JSONB,
    CONSTRAINT "GameSession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameSession_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "GameMold" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "MoldAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GameSession_childId_idx" ON "GameSession"("childId");

-- CreateIndex
CREATE INDEX "GameSession_moldId_idx" ON "GameSession"("moldId");

-- CreateIndex
CREATE INDEX "GameSession_assignmentId_idx" ON "GameSession"("assignmentId");

-- CreateIndex
CREATE INDEX "GameSession_startedAt_idx" ON "GameSession"("startedAt");
