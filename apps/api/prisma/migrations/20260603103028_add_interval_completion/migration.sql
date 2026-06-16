/*
  Warnings:

  - You are about to drop the column `isCompleted` on the `samples` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "borehole_intervals" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "samples" DROP COLUMN "isCompleted";
