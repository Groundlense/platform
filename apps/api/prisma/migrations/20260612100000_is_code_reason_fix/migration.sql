-- Spec fix (groundlense_erd_rbac.html): `is_code_reason varchar(100)` was
-- implemented as a typo'd boolean `isCodeMeson`. Replace it with a nullable
-- varchar justification column on both audited tables. The boolean carried
-- no meaningful data (nothing in the codebase ever wrote it), so dropping
-- it is safe.

-- engineer_reviews (model EngineerReview)
ALTER TABLE "engineer_reviews" DROP COLUMN "isCodeMeson";
ALTER TABLE "engineer_reviews" ADD COLUMN "isCodeReason" VARCHAR(255);

-- activity_logs (model ActivityLog)
ALTER TABLE "activity_logs" DROP COLUMN "isCodeMeson";
ALTER TABLE "activity_logs" ADD COLUMN "isCodeReason" VARCHAR(255);
