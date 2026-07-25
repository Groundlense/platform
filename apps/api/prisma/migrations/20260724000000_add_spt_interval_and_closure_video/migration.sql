-- Project-level SPT test interval in meters (typical 1.5 / 3 / 5).
-- Part of project setup — frozen once fieldwork starts.
ALTER TABLE "projects" ADD COLUMN "sptIntervalM" DECIMAL(4,1) NOT NULL DEFAULT 1.5;

-- Closure/rig-removal verification video from the mobile app
-- (POST /intervals/:id/media with purpose=CLOSURE_VIDEO, video/mp4).
ALTER TYPE "PhotoType" ADD VALUE 'CLOSURE_VIDEO';
ALTER TYPE "MediaType" ADD VALUE 'VIDEO';
