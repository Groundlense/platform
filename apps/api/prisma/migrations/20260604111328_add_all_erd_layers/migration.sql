-- CreateEnum
CREATE TYPE "BoringMethod" AS ENUM ('WASH_BORING', 'ROTARY_DRILLING', 'PERCUSSION_DRILLING', 'AUGER_BORING');

-- CreateEnum
CREATE TYPE "PhotoEntityType" AS ENUM ('BORING', 'INTERVAL', 'SAMPLE', 'WATER_LEVEL');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('SOIL_SAMPLE', 'CORE_BOX', 'SITE_SETUP', 'WATER_LEVEL');

-- CreateEnum
CREATE TYPE "WaterReadingType" AS ENUM ('DRILLING_LEVEL', 'REST_LEVEL', 'STABILIZED_LEVEL');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('ENGINEER_REVIEW', 'CLIENT_REVIEW', 'IE_REVIEW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "SyncEntityType" AS ENUM ('BORING', 'SPT_RECORD', 'SAMPLE', 'PHOTO', 'WATER_LEVEL');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('SYSTEM', 'ORGANIZATION', 'PROJECT');

-- CreateEnum
CREATE TYPE "ProjectCompanyRole" AS ENUM ('INITIATOR', 'CONTRACTOR', 'SUBCONTRACTOR', 'CONSULTANT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrganizationType" ADD VALUE 'SYSTEM_OWNER';
ALTER TYPE "OrganizationType" ADD VALUE 'CLIENT';
ALTER TYPE "OrganizationType" ADD VALUE 'NABL_LAB';
ALTER TYPE "OrganizationType" ADD VALUE 'IE_FIRM';
ALTER TYPE "OrganizationType" ADD VALUE 'STRUCTURAL_CONSULTANT';

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "actorCompanyId" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isCodeMeson" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newValue" JSONB,
ADD COLUMN     "oldValue" JSONB,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "borehole_intervals" ADD COLUMN     "blow1" INTEGER,
ADD COLUMN     "blow2" INTEGER,
ADD COLUMN     "blow3" INTEGER,
ADD COLUMN     "dilatancyApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gpsLat" DECIMAL(10,8),
ADD COLUMN     "gpsLng" DECIMAL(11,8),
ADD COLUMN     "isRefusal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nCorrected" INTEGER,
ADD COLUMN     "observedAt" TIMESTAMP(3),
ADD COLUMN     "penetrationMm" INTEGER,
ADD COLUMN     "prevHash" TEXT,
ADD COLUMN     "sha256Hash" TEXT;

-- AlterTable
ALTER TABLE "boreholes" ADD COLUMN     "assignedWorkerId" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "method" "BoringMethod",
ADD COLUMN     "rigType" TEXT,
ADD COLUMN     "startDepth" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "accuracyM" DECIMAL(5,2),
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" "PhotoEntityType",
ADD COLUMN     "gpsLat" DECIMAL(10,8),
ADD COLUMN     "gpsLng" DECIMAL(11,8),
ADD COLUMN     "photoType" "PhotoType",
ADD COLUMN     "sha256Hash" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "registeredAddress" TEXT,
ADD COLUMN     "subscriptionExpiry" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "billingCompanyId" TEXT,
ADD COLUMN     "chainageFrom" DECIMAL(10,3),
ADD COLUMN     "chainageTo" DECIMAL(10,3),
ADD COLUMN     "district" TEXT,
ADD COLUMN     "initiatedByCompanyId" TEXT,
ADD COLUMN     "initiatedByUserId" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "targetCompletionDate" TIMESTAMP(3),
ADD COLUMN     "totalBoringsPlanned" INTEGER;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scope" "ScopeType" NOT NULL DEFAULT 'ORGANIZATION';

-- AlterTable
ALTER TABLE "samples" ADD COLUMN     "assignedLabId" TEXT,
ADD COLUMN     "collectedAt" TIMESTAMP(3),
ADD COLUMN     "collectedByUserId" TEXT,
ADD COLUMN     "depthFrom" DECIMAL(10,2),
ADD COLUMN     "depthTo" DECIMAL(10,2),
ADD COLUMN     "dispatchDate" TIMESTAMP(3),
ADD COLUMN     "dispatchedToLabId" TEXT,
ADD COLUMN     "sampleCondition" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "notificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "supervisorUserId" TEXT,
ADD COLUMN     "teamPrefix" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "preferredLanguage" TEXT DEFAULT 'en',
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "userType" TEXT;

-- AlterTable
ALTER TABLE "water_table_observations" ADD COLUMN     "readingType" "WaterReadingType",
ADD COLUMN     "sha256Hash" TEXT;

-- CreateTable
CREATE TABLE "nabl_labs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nablCertNumber" TEXT NOT NULL,
    "labName" TEXT NOT NULL,
    "accreditedTests" JSONB NOT NULL,
    "certValidFrom" TIMESTAMP(3) NOT NULL,
    "certValidUntil" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nabl_labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "grantedByUserId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_company_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_project_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedByUserId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_project_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_companies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "ProjectCompanyRole" NOT NULL DEFAULT 'CONTRACTOR',
    "invitedByUserId" TEXT,
    "inviteAcceptedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boring_sessions" (
    "id" TEXT NOT NULL,
    "boreholeId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "startDepth" DECIMAL(10,2) NOT NULL,
    "endDepth" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "terminationReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soil_descriptions" (
    "id" TEXT NOT NULL,
    "sptRecordId" TEXT NOT NULL,
    "soilType" TEXT NOT NULL,
    "uscsCode" TEXT,
    "color" TEXT,
    "consistency" TEXT,
    "description" TEXT NOT NULL,
    "remarks" TEXT,
    "enteredByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soil_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "nablLabId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testValues" JSONB NOT NULL,
    "resultValues" JSONB NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportPdfUrl" TEXT NOT NULL,
    "testedOn" TIMESTAMP(3) NOT NULL,
    "sha256Hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_reviews" (
    "id" TEXT NOT NULL,
    "boreholeId" TEXT NOT NULL,
    "reviewedByUserId" TEXT NOT NULL,
    "reviewType" "ReviewType" NOT NULL DEFAULT 'ENGINEER_REVIEW',
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "isCodeMeson" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineer_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_threads" (
    "id" TEXT NOT NULL,
    "boreholeId" TEXT NOT NULL,
    "raisedByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "threadType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "initiatedByUserId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "boringsPurchased" INTEGER NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_operations" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "entityType" "SyncEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "operationType" "OperationType" NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),
    "boringSessionId" TEXT,

    CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_logs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "entityType" "SyncEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "localVersion" INTEGER NOT NULL,
    "serverVersion" INTEGER NOT NULL,
    "conflictDetails" JSONB NOT NULL,
    "resolution" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "conflict_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nabl_labs_companyId_key" ON "nabl_labs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_roles_userId_companyId_roleId_key" ON "user_company_roles"("userId", "companyId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_project_roles_userId_projectId_companyId_roleId_key" ON "user_project_roles"("userId", "projectId", "companyId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "project_companies_projectId_companyId_role_key" ON "project_companies"("projectId", "companyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "soil_descriptions_sptRecordId_key" ON "soil_descriptions"("sptRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "lab_results_sampleId_key" ON "lab_results"("sampleId");

-- AddForeignKey
ALTER TABLE "nabl_labs" ADD CONSTRAINT "nabl_labs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_project_roles" ADD CONSTRAINT "user_project_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_project_roles" ADD CONSTRAINT "user_project_roles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_project_roles" ADD CONSTRAINT "user_project_roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_project_roles" ADD CONSTRAINT "user_project_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_project_roles" ADD CONSTRAINT "user_project_roles_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_initiatedByCompanyId_fkey" FOREIGN KEY ("initiatedByCompanyId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_billingCompanyId_fkey" FOREIGN KEY ("billingCompanyId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_companies" ADD CONSTRAINT "project_companies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_companies" ADD CONSTRAINT "project_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_companies" ADD CONSTRAINT "project_companies_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boreholes" ADD CONSTRAINT "boreholes_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boring_sessions" ADD CONSTRAINT "boring_sessions_boreholeId_fkey" FOREIGN KEY ("boreholeId") REFERENCES "boreholes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boring_sessions" ADD CONSTRAINT "boring_sessions_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_descriptions" ADD CONSTRAINT "soil_descriptions_sptRecordId_fkey" FOREIGN KEY ("sptRecordId") REFERENCES "borehole_intervals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_descriptions" ADD CONSTRAINT "soil_descriptions_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_dispatchedToLabId_fkey" FOREIGN KEY ("dispatchedToLabId") REFERENCES "nabl_labs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_assignedLabId_fkey" FOREIGN KEY ("assignedLabId") REFERENCES "nabl_labs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_table_observations" ADD CONSTRAINT "water_table_observations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_nablLabId_fkey" FOREIGN KEY ("nablLabId") REFERENCES "nabl_labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_reviews" ADD CONSTRAINT "engineer_reviews_boreholeId_fkey" FOREIGN KEY ("boreholeId") REFERENCES "boreholes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_reviews" ADD CONSTRAINT "engineer_reviews_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_threads" ADD CONSTRAINT "review_threads_boreholeId_fkey" FOREIGN KEY ("boreholeId") REFERENCES "boreholes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_threads" ADD CONSTRAINT "review_threads_raisedByUserId_fkey" FOREIGN KEY ("raisedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_threads" ADD CONSTRAINT "review_threads_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_messages" ADD CONSTRAINT "review_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "review_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_messages" ADD CONSTRAINT "review_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_boringSessionId_fkey" FOREIGN KEY ("boringSessionId") REFERENCES "boring_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_logs" ADD CONSTRAINT "conflict_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_logs" ADD CONSTRAINT "conflict_logs_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorCompanyId_fkey" FOREIGN KEY ("actorCompanyId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
