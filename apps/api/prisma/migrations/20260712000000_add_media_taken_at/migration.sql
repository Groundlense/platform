-- Device capture time for field photos (createdAt is only the upload/sync
-- time, which can be hours later when the crew was offline).
ALTER TABLE "media" ADD COLUMN "takenAt" TIMESTAMP(3);
