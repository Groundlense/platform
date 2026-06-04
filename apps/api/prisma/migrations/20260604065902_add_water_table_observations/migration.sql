-- CreateTable
CREATE TABLE "water_table_observations" (
    "id" TEXT NOT NULL,
    "boreholeId" TEXT NOT NULL,
    "depth" DECIMAL(8,2) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_table_observations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "water_table_observations" ADD CONSTRAINT "water_table_observations_boreholeId_fkey" FOREIGN KEY ("boreholeId") REFERENCES "boreholes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
