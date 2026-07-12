# API Changes Review — `apps/api` vs `groundlense_erd_rbac.html`

> Living document tracking the fixes applied to the backend after the spec review.
> Last updated: **2026-06-12**. Build verified with `npx nest build` (clean), migration
> applied with `prisma migrate deploy`, permissions reseeded with `prisma db seed`.

---

## 1. Changes applied (2026-06-12)

### 1.1 Boreholes controller — permissions restored
**Files:** `apps/api/src/boreholes/boreholes.controller.ts`
- The working tree had uncommitted changes that stripped `PermissionsGuard` and every
  `@Permissions(...)` decorator. Restored from HEAD, then re-applied with the new
  user-scoping signatures (see 1.5).
- Every route again enforces `BOREHOLE_CREATE / BOREHOLE_VIEW / BOREHOLE_EDIT /
  WORKER_ASSIGN / REPORT_VIEW`.

### 1.2 Users module locked down
**Files:** `users.controller.ts`, `users.service.ts`, `prisma/seed.ts`
- Controller previously had **no guards at all** (anyone could list/create/suspend users
  and reset PINs). Now `@UseGuards(JwtAuthGuard, PermissionsGuard)` with new permission
  codes `USER_VIEW` (GETs) and `USER_MANAGE` (POST/PATCH), seeded to
  `GEOTECH_ADMIN`, `EPC_ADMIN` (manage) and `GEOTECH_MANAGER` (view).
- **Credential hash leak fixed**: every query now uses an explicit `SAFE_USER_SELECT`
  that excludes `passwordHash`/`pinHash` (was returning full rows).
- **Hardcoded `Password@123` removed**: `createUser` now generates a random one-time
  password (`crypto.randomBytes(9).toString('base64url')`), returned once as
  `oneTimePassword`.
- **Org scoping**: non-SUPER_ADMIN callers only see/manage users in their own
  organization (`assertSameOrganization`); created users are forced into the caller's org.

### 1.3 JWT strategy — suspended/deleted users rejected
**File:** `auth/strategies/jwt.strategy.ts`
- `validate()` now throws `UnauthorizedException` when the user no longer exists or
  `status !== 'ACTIVE'`. Previously a token kept working forever after suspension,
  making the spec's "suspend users" action ineffective.

### 1.4 Sync service — no more "MVP simulation"
**Files:** `sync/sync.service.ts`, `sync/sync.controller.ts`
- **Operations are now materialized** into the real tables instead of being marked
  `SYNCED` and dropped:
  - `SPT_RECORD` → upsert `BoreholeInterval` by `(boreholeId, intervalNo)` with blows,
    N values, refusal, penetration, observedAt.
  - `SAMPLE` → create `Sample` (resolves the mobile app's local
    `interval-<uuid>-<n>` IDs; `collectedByUserId` = authenticated caller).
  - `WATER_LEVEL` → create `WaterTableObservation` with validated `readingType`.
  - `BORING UPDATE` → whitelisted fields only (`status`, `finalDepth`, `rigType`,
    `startedAt`, auto `completedAt`).
- **Fake device fabrication removed**: devices are auto-registered bound to the
  *authenticated* user (was: linked to `user.findFirst()` — a random user — with a
  hardcoded name "Supervisor Android Device").
- Per-operation outcome (`SYNCED`/`FAILED` + error) is recorded and returned, with
  idempotency on `(deviceId, operationId)` so replays don't duplicate data.
- `GET /sync/conflicts/:deviceId` now verifies the device belongs to the caller.

### 1.5 Org/project scoping (IDOR fixes)
**New:** `common/access/project-access.service.ts` + global `AccessModule`
- Central helpers: `projectScopeWhere(user)`, `assertProjectAccess`,
  `assertBoreholeAccess`, `assertIntervalAccess`, `assertSameOrganization`.
  SUPER_ADMIN bypasses; everyone else must be a party org (EPC/geotech) or a
  project member.
- Applied to:
  - **Projects**: `GET /projects` now scoped (was: returned *every* project of *every*
    org); `addMember`/`getMembers` require project access.
  - **Boreholes**: all 12 routes assert project/borehole/interval access (was: pure
    ID-based lookups — possession of a UUID = access).
  - **Teams**: org membership checked on all routes (was: org ID taken from the URL
    unchecked); `getTeam` no longer returns user hashes.
  - **Activity logs**: scoped to the caller's organization (was: platform-wide).
  - **Dashboard**: `summary` counts only the caller's visible projects (was: global
    platform counts); `projects/:id` asserts access and returns 404 (was a 500).
  - **Payments / media**: see 1.6 / 1.8.

### 1.6 Payments — server-side Razorpay verification + unlock
**Files:** `payments/payments.service.ts`, `payments/payments.controller.ts`,
`payments/dto/verify-payment.dto.ts`
- `PATCH /payments/:id/verify` no longer accepts a client-supplied `status`. The DTO
  now requires `razorpaySignature`; the server computes
  `HMAC-SHA256(orderId|paymentId, RAZORPAY_KEY_SECRET)` and compares with
  `crypto.timingSafeEqual`. Invalid signature → payment marked `FAILED`, 400 returned.
- On success, the payment is marked `SUCCESS` **and the project's `lockedAt` is
  cleared** — first wiring of the spec's "unlock paid boring data" rule.
- All payment routes assert project access.
- ⚠️ Requires `RAZORPAY_KEY_SECRET` in the API env files.

### 1.7 NABL labs — admin approval per spec
**Files:** `nabl-labs/nabl-labs.service.ts`, `nabl-labs/nabl-labs.controller.ts`,
`prisma/seed.ts`
- Lab registration no longer self-verifies (`isVerified` defaults to `false`).
- New `PATCH /nabl-labs/:labId/approve` guarded by new permission
  `NABL_LAB_APPROVE` (currently only SUPER_ADMIN via guard bypass — matches the
  spec's "Approve NABL labs: GL admins only").

### 1.8 Media — uploads no longer public
**Files:** `main.ts`, `media/media.controller.ts`, `media/media.service.ts`
- Removed `useStaticAssets('/uploads')` — field photos were fetchable by anyone with
  the URL, bypassing all RBAC.
- New authenticated `GET /api/v1/media/:id/file` streams the file after an
  interval-level access check.
- Upload hardening: collision-safe filenames (`timestamp-random.ext`), 15 MB limit,
  mimetype allowlist (jpeg/png/webp/pdf).
- ⚠️ **Frontend impact**: anything referencing `/uploads/<file>` must switch to
  `/api/v1/media/:id/file` with the bearer token.

### 1.9 Auth service fixes
**File:** `auth/auth.service.ts`
- **O(n) bcrypt scan removed**: refresh tokens are now high-entropy
  (`randomBytes(48)`) and stored as SHA-256 hashes, so refresh/logout is a single
  indexed lookup (was: bcrypt-comparing against *every* token in the DB).
  ⚠️ Existing refresh tokens are invalidated — users simply log in again.
- **Login fix**: password is tried first, then PIN. Previously any user with an
  `employeeCode` could *only* log in with a PIN, even office users with passwords.

### 1.10 Schema: borehole statuses
**Files:** `prisma/schema.prisma`,
`prisma/migrations/20260612000000_add_terminated_suspended_borehole_status/`,
`boreholes.service.ts`
- Added `TERMINATED` (mobile's resumable pause — it was already sending this value,
  which the server would have rejected) and `SUSPENDED` (spec: IE "Suspend boring if
  non-compliant") to `BoreholeStatus`, with updated status-transition rules:
  `IN_PROGRESS → TERMINATED|SUSPENDED`, `TERMINATED → IN_PROGRESS|COMPLETED|ABANDONED`,
  `SUSPENDED → IN_PROGRESS|ABANDONED`.
- **Migration applied** to the database.

### 1.11 No more fabricated data on borehole creation
**File:** `boreholes.service.ts`
- Removed the auto-generation of intervals at 1.5 m steps on borehole create. Per the
  spec, SPT records are *captured in the field*, never pre-fabricated server-side.
  Intervals are now created only by field sync (1.4) or `PATCH /intervals/:id`.
- `createSample` now records `collectedByUserId`/`collectedAt`.
- Also fixed a duplicate `CreateWaterTableDto` import.

### 1.12 Housekeeping
- `.gitignore`: `backup.sql` (the untracked DB dump) is now ignored — consider
  deleting `apps/api/backup.sql` outright.
- Seed updated with new permissions; re-ran `prisma db seed` (idempotent upserts).

---

## 2. How to verify

```bash
cd apps/api
npx prisma generate          # done — client includes new enum values
npx prisma migrate deploy    # done — enum migration applied
npx prisma db seed           # done — USER_VIEW/USER_MANAGE/NABL_LAB_APPROVE
npx nest build               # done — compiles clean
npm run start:dev
```

Manual spot checks:
1. `GET /api/v1/users` without a token → **401** (was 200 with hashes).
2. Log in as an EPC user, `GET /api/v1/projects` → only that org's projects.
3. `GET /api/v1/boreholes/<uuid-from-another-org>` → **403**.
4. POST `/api/v1/sync/operations` with an SPT payload → row appears in
   `borehole_intervals` (was: only a `sync_operations` row).
5. `PATCH /api/v1/payments/:id/verify` with a bogus signature → **400**, payment FAILED.
6. Old `/uploads/<file>` URL → 404; `GET /api/v1/media/:id/file` with token → file.

---

## 3. Known impacts on the other apps

| Consumer | Impact |
|---|---|
| **Web** | Demo-login fallback (`auth.ts`) will now hit real 401s; `lockedAt` is cleared by payment verify; media URLs must use the new endpoint. |
| **Mobile** | `verify` payload of sync ops unchanged; sync now returns per-op `results[]` — `success` is `false` if *any* op failed (mobile currently clears its whole queue on `success` only, which is now safer). Mobile's `'TERMINATED'` status is now accepted. |
| **Env** | `RAZORPAY_KEY_SECRET` must be set for payment verification. |

---

## 4. Gap closure update (2026-06-12, later the same day)

The following items from the list below were **implemented and verified**
(`prisma migrate deploy` ×2, `prisma generate`, `nest build` clean, reseeded):

- **Organizations module** — `GET /organizations` (safe directory fields), `GET/PATCH
  /organizations/:id` (own-org + ORG_MANAGE), `PATCH /organizations/:id/kyc-verify`
  (ORG_KYC_VERIFY → sets isVerified/verifiedAt), `POST /organizations` (SUPER_ADMIN).
- **`POST /auth/register`** (public) — org + first admin in a transaction, role mapped
  from org type, 409 on duplicate email/GSTIN, returns the login token pair. Phone-OTP
  still needs an SMS provider (commented in code).
- **Engineer reviews + query threads** (`src/reviews`) — `POST /intervals/:id/reviews`
  (APPROVE/REJECT/MODIFY_N; MODIFY_N requires `nValueNew` + `isCodeReason` and writes
  oldValue/newValue to the audit log per the Data Ownership Rule), review listings,
  `POST /boreholes/:id/threads`, `GET /threads/assigned-to-me` (worker inbox),
  `POST /threads/:id/messages` (worker can reply), thread close.
- **SHA-256 tamper chain** (`src/common/integrity`) — intervals are hash-chained
  (prevHash → sha256Hash, canonical JSON documented in IntegrityService) on sync
  materialization and engineer edits (with cascade rehash); water-table observations
  hashed standalone; `GET /boreholes/:id/integrity` verifies the chain;
  `GET /boreholes/:id/export?format=json|csv` and `GET /projects/:id/export` added.
- **Two-level RBAC enforcement begins** — `projectScopeWhere` now also grants access
  via accepted `project_companies` links and unrevoked `user_project_roles`;
  invitation endpoints (`POST/GET /projects/:id/companies`, respond/remove) and
  project-role assignment (`POST/GET /projects/:id/user-roles`); `getProjectRole` /
  `assertProjectRole` helpers ready for per-flow gating.
- **Schema fixes** — `isCodeMeson Boolean` → `isCodeReason String?` on EngineerReview
  + ActivityLog (migration `20260612100000`); `BoreholeInterval.recordedByUserId` FK
  added and populated by sync/edits (migration `20260612110000`).
- **`PATCH /samples/:id/dispatch`** — assigns a *verified* NABL lab, sets dispatch
  fields, status DISPATCHED.
- **`GET /projects/search?code=`** + per-project `boreholeStatusCounts`/`totalBoreholes`
  on `GET /projects`.
- **Swagger backfill** — 46 fields decorated across the 16 legacy DTOs.

Still open after this round: phone-OTP (SMS provider), Razorpay checkout/webhooks,
IS 1892 PDF rendering, `SampleType` spec domain + `amountPaise` + GL business-ID
columns (breaking migrations — coordinate with mobile), per-flow `assertProjectRole`
wiring (helpers exist, flows still rely on company-level permissions), revision-safe
edit history UI, demo-user seed cleanup, `apps/api/generated/prisma` dedup.

## 4b. Original remaining-work list (kept for history — see 4 for current status)

- [ ] **Two-level RBAC**: `user_company_roles` / `user_project_roles` /
      `project_companies` are still schema-only; the flat `UserRole` table remains the
      enforcement source. (The new org/project scoping closes the data-leak holes, but
      per-project role semantics — IE approve-only, client read-only — still need the
      spec's role matrix.)
- [ ] **Organizations module**: directory is empty — company CRUD + KYC verification.
- [ ] **Engineer reviews**: `EngineerReview` model has no endpoints (IE approve/reject,
      N-value modification with IS-clause justification).
- [ ] **SHA-256 tamper chain**: hash columns exist, nothing computes/verifies them.
- [ ] **Phone + OTP auth** and `/auth/register` (mobile + web signup depend on it).
- [ ] **Sample → NABL lab dispatch** endpoints (`assignedLabId`, `dispatchDate`).
- [ ] **Schema corrections** (need coordinated migrations + client updates):
      `SampleType` → spec domain (`SPT|UDS|ROCK_CORE|BULK|WATER`),
      `isCodeMeson Boolean` → `isCodeReason String`, `amountPaid Decimal` →
      `amountPaise BigInt`, GL business IDs (`glCompanyId` etc.), water-table
      two-reading shape, `recordedBy` on intervals.
- [ ] **Audit completeness**: `oldValue/newValue/ipAddress/actorCompanyId` never
      populated; several mutating endpoints don't log.
- [ ] **Swagger**: add `@ApiProperty` to DTOs in auth/boreholes/projects/sites/teams/users.
- [ ] **Revision-safe edits**: interval/soil-description updates still overwrite without
      a revision trail (spec's Data Ownership Rule).
- [ ] Remove demo users from `prisma/seed.ts` (keep roles/permissions only) and delete
      `apps/api/backup.sql`; deduplicate `apps/api/generated/prisma/schema.prisma`.
- [ ] IS 1892 PDF report generation / CSV-JSON export endpoints.

---

## Update — 2026-07-08

- **Live feed filter**: `GET /activity-logs/recent` excludes auth actions (LOGIN/LOGOUT/OTP/…) — ground activity only.
- **`GET /boreholes/assigned`** (+ optional `?projectId=`): worker's boreholes via team membership, powering the mobile assigned list and notices.
- **Setup freeze**: once any borehole is beyond PLANNED — borehole create and project member-add return 403; per-borehole assignment locks once that hole starts. `GET /projects/:id/setup-status` reports the lock. SUPER_ADMIN bypasses.
- **Activation hardened**: `POST /auth/create-password` is one-shot — refuses once the account is active (was an account-takeover hole via known mobile number).

## E2E validation — 2026-07-08

Automated lifecycle suite (`apps/api/test/e2e-lifecycle.mjs`) run against a live instance: **54/54 PASS**. Three real bugs found and fixed:

1. **FIELD_WORKER blocked from syncing** — sessions + `/sync/operations` required `BOREHOLE_EDIT`; now `SPT_CREATE` (workers hold it).
2. **Activation always failed** — `createUser` pre-set `mobileVerified: true`, tripping the one-shot guard; verification now happens only at worker activation.
3. **Query threads unreachable** — `assignedWorkerId` was never settable; `PATCH /boreholes/:id/assignment` now accepts it and threads route to that worker.

See `E2E_TEST_GUIDE.md` for the full checklist and manual UI walk-through. Restart any running dev API to pick up these fixes.

## Geo-tagged photo stamping — 2026-07-12

Field photos now carry a burned-in geo-tag banner (like GPS map cameras), applied server-side at upload (`src/media/photo-stamp.ts`, wired into `MediaService.create`):

- **Content**: GroundLense wordmark + pin mark, borehole ID + sub-structure (abutment/pier from `Borehole.name`), Structure Type | Chainage | Span, GPS coordinates ±accuracy from the device fix, capture date/time in IST.
- **Honest by construction**: every value comes from the DB record or the device; missing fields are omitted and missing GPS prints "GPS: not captured" — nothing fabricated.
- **Robust**: EXIF orientation normalized before compositing; a stamping failure logs a warning and keeps the unstamped upload (field evidence is never lost).
- **Infra**: `sharp` added to the API; docker-compose api container now installs `fontconfig` + `ttf-dejavu` (alpine ships no fonts, and SVG text needs them).
- Applies to image/jpeg, image/png, image/webp; PDFs pass through untouched. No mobile changes needed — the app already sends gpsLat/gpsLng/accuracyM/takenAt with each photo.
