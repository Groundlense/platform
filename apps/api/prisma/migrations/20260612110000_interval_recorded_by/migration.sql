-- AlterTable
ALTER TABLE "borehole_intervals" ADD COLUMN "recordedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "borehole_intervals" ADD CONSTRAINT "borehole_intervals_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
