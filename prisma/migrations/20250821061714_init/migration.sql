-- CreateTable
CREATE TABLE "GameMold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "structureType" TEXT NOT NULL,
    "experienceType" TEXT NOT NULL,
    "primaryObjective" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "lockStructure" BOOLEAN NOT NULL DEFAULT false,
    "allowThemes" BOOLEAN NOT NULL DEFAULT true,
    "allowPacing" BOOLEAN NOT NULL DEFAULT true,
    "allowRewards" BOOLEAN NOT NULL DEFAULT true,
    "allowAvatars" BOOLEAN NOT NULL DEFAULT true,
    "customizationNotes" TEXT,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "learnerProfiles" TEXT NOT NULL,
    "executiveFunctionTargets" TEXT,
    "sensoryPreferences" TEXT,
    "skillTargets" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT,
    "instructions" TEXT NOT NULL,
    "pacingCalm" BOOLEAN NOT NULL DEFAULT false,
    "pacingFast" BOOLEAN NOT NULL DEFAULT false,
    "reinforcement" TEXT,
    "moldId" TEXT NOT NULL,
    CONSTRAINT "Scene_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "GameMold" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    CONSTRAINT "Asset_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MoldAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moldId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "lastInteraction" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoldAssignment_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "GameMold" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MoldAssignment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
