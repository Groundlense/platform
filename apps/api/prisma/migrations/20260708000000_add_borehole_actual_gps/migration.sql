-- Worker's real GPS at boring start (planned-vs-actual deviation)
ALTER TABLE "boreholes" ADD COLUMN "actualLat" DECIMAL(15,7);
ALTER TABLE "boreholes" ADD COLUMN "actualLng" DECIMAL(15,7);
ALTER TABLE "boreholes" ADD COLUMN "actualAccuracyM" DECIMAL(6,2);
