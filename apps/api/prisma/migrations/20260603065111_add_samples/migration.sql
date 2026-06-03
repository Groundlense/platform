-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('DISTURBED', 'UNDISTURBED');

-- CreateTable
CREATE TABLE "samples" (
    "id" TEXT NOT NULL,
    "intervalId" TEXT NOT NULL,
    "sampleNumber" TEXT NOT NULL,
    "sampleType" "SampleType" NOT NULL,
    "sampleDepth" DECIMAL(10,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_intervalId_fkey" FOREIGN KEY ("intervalId") REFERENCES "borehole_intervals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
