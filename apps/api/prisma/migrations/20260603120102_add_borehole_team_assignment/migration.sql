-- AlterTable
ALTER TABLE "boreholes" ADD COLUMN     "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "boreholes" ADD CONSTRAINT "boreholes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
