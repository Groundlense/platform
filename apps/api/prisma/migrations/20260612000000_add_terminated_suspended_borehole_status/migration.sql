-- AlterEnum: resumable field pause + IE-ordered suspension
ALTER TYPE "BoreholeStatus" ADD VALUE 'TERMINATED';
ALTER TYPE "BoreholeStatus" ADD VALUE 'SUSPENDED';
