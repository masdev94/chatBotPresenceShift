-- CreateTable
CREATE TABLE "Ritual" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ritual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RitualConfigVersion" (
    "id" TEXT NOT NULL,
    "ritualId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "notes" TEXT,
    "configJson" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RitualConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ritual_slug_key" ON "Ritual"("slug");

-- CreateIndex
CREATE INDEX "RitualConfigVersion_ritualId_idx" ON "RitualConfigVersion"("ritualId");

-- CreateIndex
CREATE UNIQUE INDEX "RitualConfigVersion_ritualId_versionNumber_key" ON "RitualConfigVersion"("ritualId", "versionNumber");

-- AddForeignKey
ALTER TABLE "RitualConfigVersion" ADD CONSTRAINT "RitualConfigVersion_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES "Ritual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
