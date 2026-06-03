-- CreateEnum
CREATE TYPE "BoreholeStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "boreholes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "boreholeCode" TEXT NOT NULL,
    "name" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "groundLevelRL" DECIMAL(10,2),
    "plannedDepth" DECIMAL(10,2),
    "finalDepth" DECIMAL(10,2),
    "status" "BoreholeStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boreholes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boreholes_projectId_boreholeCode_key" ON "boreholes"("projectId", "boreholeCode");

-- AddForeignKey
ALTER TABLE "boreholes" ADD CONSTRAINT "boreholes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boreholes" ADD CONSTRAINT "boreholes_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
