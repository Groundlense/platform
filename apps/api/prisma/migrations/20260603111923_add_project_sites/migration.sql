-- AlterTable
ALTER TABLE "boreholes" ADD COLUMN     "siteId" TEXT;

-- CreateTable
CREATE TABLE "project_sites" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_sites_projectId_code_key" ON "project_sites"("projectId", "code");

-- AddForeignKey
ALTER TABLE "boreholes" ADD CONSTRAINT "boreholes_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "project_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_sites" ADD CONSTRAINT "project_sites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
