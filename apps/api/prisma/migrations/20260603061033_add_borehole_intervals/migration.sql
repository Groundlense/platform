-- CreateTable
CREATE TABLE "borehole_intervals" (
    "id" TEXT NOT NULL,
    "boreholeId" TEXT NOT NULL,
    "intervalNo" INTEGER NOT NULL,
    "fromDepth" DECIMAL(10,2) NOT NULL,
    "toDepth" DECIMAL(10,2) NOT NULL,
    "soilDescription" TEXT,
    "nValue" INTEGER,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borehole_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "borehole_intervals_boreholeId_intervalNo_key" ON "borehole_intervals"("boreholeId", "intervalNo");

-- AddForeignKey
ALTER TABLE "borehole_intervals" ADD CONSTRAINT "borehole_intervals_boreholeId_fkey" FOREIGN KEY ("boreholeId") REFERENCES "boreholes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
