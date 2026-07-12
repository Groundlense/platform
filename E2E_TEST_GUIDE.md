# GroundLense — End-to-End Test Guide & MVP Parity Report

> Last executed: **2026-07-08** · Automated suite: **54/54 PASS** against a live API
> instance connected to the real Neon database.
> Companions: `API_CHANGES_REVIEW.md`, `WEB_CHANGES_REVIEW.md`, `MOBILE_CHANGES_REVIEW.md`.

---

## 1. Automated end-to-end suite (API lifecycle)

The suite lives at **`apps/api/test/e2e-lifecycle.mjs`**. It drives the exact HTTP
contract the web portal and mobile app use, through the full project lifecycle,
and verifies the data lands in the database. It creates `E2E-…`-prefixed records
(project, borehole, team, worker, lab) that are safe to delete afterwards.

### Run it

```bash
# 1. API must be running (dev default port 8000):
cd apps/api && npm run start:dev        # or: node dist/main.js

# 2. In another terminal:
node apps/api/test/e2e-lifecycle.mjs
# against a different instance:
E2E_BASE=http://localhost:3100/api/v1 node apps/api/test/e2e-lifecycle.mjs
```

Requires the seeded accounts (`npx prisma db seed`): `admin@xyzinfra.com`,
`admin@abcgeotech.com`, `superadmin@groundlense.com` (Password@123).

### What it covers — all PASS on 2026-07-08

| # | Area | Checks |
|---|------|--------|
| 1 | Auth | unauth rejected; wrong password 401; 3 role logins; `/auth/me` org + **no hash leak**; refresh-token rotation; **old refresh token revoked** |
| 2 | Project setup (web flow) | EPC admin creates project; setup-status unlocked; geotech admin creates borehole; **no pre-fabricated intervals**; team creation |
| 3 | Crew onboarding | admin creates worker (USER_MANAGE) — response has **no hash / no hardcoded password**; team + project membership; **worker activates via mobile + own password**; **activation is one-shot** (takeover attempt → 400); worker logs in with employee code |
| 4 | Assignment | borehole assigned to team + named worker while PLANNED; **worker sees it via `GET /boreholes/assigned`** |
| 5 | Field work (mobile flow) | worker starts a boring session; pushes a 4-op offline sync queue (status, SPT interval, sample, water table) — all `SYNCED`; **each record verified present in the DB**; borehole status → IN_PROGRESS; **replay is idempotent (no duplicates)** |
| 6 | Setup lock | setup-status flips to locked; new borehole → 403; member add → 403; reassignment of the started borehole → 403 |
| 7 | Media (photo pipeline) | worker uploads a real multipart photo to the interval; file served to an authorized user; **blocked without auth** |
| 8 | Review + queries | engineer N-modification (IS-clause remark) persists; engineer raises a query thread; **worker inbox shows it**; worker replies |
| 9 | Lab | NABL lab registers **unverified**; GL admin approves; lab result submitted against the field sample; readable by the project party |
| 10 | Report / feed / dashboard | report-data aggregates intervals + samples + water table; **live feed has zero login/logout noise** but shows ground actions; dashboard summary org-scoped |
| 11 | Payments | payment created PENDING; **bogus Razorpay signature rejected** (400) |
| 12 | RBAC / tenancy | worker without REPORT_VIEW blocked from report; EPC feed contains no geotech-org rows; **suspending a user kills their live token immediately** |

### Bugs found by this suite and fixed (2026-07-08)

1. **FIELD_WORKER couldn't sync at all** — sessions and `/sync/operations` required
   `BOREHOLE_EDIT`, which the seeded FIELD_WORKER role doesn't have. Every real
   worker would have hit 403 on their first sync. Routes now require `SPT_CREATE`
   (the field-data-capture permission).
2. **Activation always failed for admin-created workers** — `createUser` pre-set
   `mobileVerified: true`, which the one-shot activation guard read as "already
   active". Verification now happens only when the worker activates.
3. **Engineer queries could never reach a worker** — `assignedWorkerId` existed in
   the schema but nothing could set it. The assignment endpoint now accepts it,
   and threads route to that worker's inbox.

⚠️ If your dev API was already running before these fixes, **restart it** so it
serves the new build.

---

## 2. Manual end-to-end script (UI walk-through)

Do this once against local dev (API :8000, web `npm run dev`, mobile on an
Android device/emulator with `API_BASE_URL` in `apps/mobile/src/config.ts`
pointing at your machine).

### A. Web — project setup (as EPC admin, then geotech admin)
1. Log in with wrong password → inline error, no dashboard. Log in as
   `admin@xyzinfra.com` → dashboard, projects org-scoped.
2. New project → 4-step modal → real `GL-PRJ-…` code appears in the share box;
   card appears on the dashboard. "Pay & activate" records a PENDING payment.
3. Log in as `admin@abcgeotech.com` → open the project → **Setup tab**: add
   boreholes/locations; create a drilling team; **+ Add Crew Member** (real
   mobile number you control) → invite panel → **Share on WhatsApp** → message
   arrives with app link + activation steps.
4. Assign boreholes to the team (checkbox list). The share panel offers the
   "New borehole assigned" WhatsApp message for members with mobiles.

### B. Mobile — worker onboarding + field day
5. Install/open the app → **Create account** → enter the invited mobile number →
   set a password → success → log in (employee code or mobile + password).
6. Project selection shows the real project (after Sync). Boring list shows
   "N assigned to you"; a **New borehole assigned** alert fires once.
7. **Airplane mode ON** (offline test): Rig setup → Start boring (rig photo via
   real camera) → SPT loop: blows, refusal, WT popup, soil description, samples
   (slate + sealed-tube photos), optionally Rock → coring runs → Terminate
   (resumable) or Closure (summary shows *your* real counts + your name as
   signature).
8. **Airplane mode OFF** → within ~15 s auto-sync runs (or reopen the app).
   Every entry and photo uploads; queue drains.
9. Reopen the terminated boring → amber resume banner shows the real stop depth.

### C. Web — verify the data came through
10. **Live Monitor**: cross-section shows your real strata/N-values; the feed
    shows SPT/sample/assignment events — **no login/logout rows**; photos render.
11. **Setup tab** now shows the amber **"Setup locked — fieldwork has started"**
    banner; add-member/borehole/assignment controls are disabled (server also
    403s them).
12. **Review tab**: your intervals appear; apply an N-modification with an IS
    clause → refresh → it persisted. Raise a query to the field worker.
13. **Mobile**: Engineer queries inbox shows the query → reply → visible on web.
14. **Lab tab**: samples listed with 14-day deadline chips; register/approve a
    NABL lab (approve as superadmin) → enter results → Lock & Save → row locks.
15. **Report tab**: SPT-vs-depth graph plots your data; integrity/tamper chain
    verifies; exports download via the authenticated proxy.
16. **Contractor portal** (log in as `admin@xyzinfra.com`): read-only summary,
    real cross-sections, photo strip, investigation cost = SUCCESS payments.

### D. Negative checks
17. Old worker password after activation → rejected. Re-running activation with
    the same mobile → "Account is already active".
18. Suspend the worker (superadmin) → their app session dies on next request.
19. Payment verify with a made-up signature → 400 (set `RAZORPAY_KEY_SECRET`
    for real verification).

---

## 3. MVP parity vs the reference HTMLs

### `groundlense_v4.html` (web portal) — status

| Prototype feature | Status |
|---|---|
| Role-based login + portals (engineer/contractor/geotech) | ✅ Working |
| Signup with OTP (email/mobile) | ✅ Wired to real `/auth/register` + OTP endpoints (SMS mocked until Twilio creds set) |
| Dashboard: project cards, new-project modal, payment step, locked cards | ✅ Real (Razorpay *checkout* still pending — payments record PENDING) |
| Setup: teams, crew invite (WhatsApp), locations, Excel import | ✅ Real, incl. invite + **setup lock**; Excel import present |
| Live Monitor: cross-section, bore viewer, anomaly cards, activity feed | ✅ Real data; feed filtered to ground activity |
| Review: N-modification with IS clause, query threads to workers | ✅ Persisted + threads round-trip (approve state still session-local) |
| Lab: NABL registry, sample deadlines, results entry + lock | ✅ Real (labs require GL-admin approval) |
| Report: SPT graph, liquefaction, report preview, exports | ✅ Real; PDF is print-preview, CSV/JSON exports authenticated |
| Tamper evidence (SHA-256 chain) | ✅ Integrity endpoint + verification UI |
| GL admin portal (platform ops) | ❌ Not built (out of MVP scope so far) |
| Razorpay checkout + webhooks | ⏳ Pending (signature verification ready server-side) |

### `groundlense_worker_app_v3.html` (mobile worker app) — status

| Prototype feature | Status |
|---|---|
| Login (worker ID/PIN) + account activation | ✅ Real, incl. WhatsApp-invite onboarding |
| Project selection + assigned boring list | ✅ Real, with new-assignment alerts |
| Rig setup → GPS check → start boring | ✅ Live GPS tracker (distance + walk direction, arrival detection), Google Maps navigation, arrival position recorded → planned-vs-actual deviation on portals |
| SPT loop with corrections (overburden/dilatancy/refusal) | ✅ IS 2131 calcs on real data |
| Soil description (voice) | ✅ typed; **voice transcription pending** (needs speech lib) |
| Samples incl. UDS checks, slate/sealed photos | ✅ Real camera + offline photo queue, **GPS-stamped** |
| Rock coring (TCR/RQD, weathering) | ✅ |
| Water table + 24-hr stable reading | ✅ manual toggle; **push reminder pending** (needs notifications lib) |
| Terminate / resume with amber banner | ✅ Real session data |
| Boring closure (summary, signature, lock) | ✅ Real aggregates; signature is typed-name (**drawn pad pending**) |
| Engineer query inbox + replies | ✅ Real threads |
| Offline-first storage + auto-sync to Neon | ✅ Verified end-to-end, idempotent, per-op results |

### Bottom line
The three apps now cover the MVP flows of both reference HTMLs with **real data
end-to-end** (verified by the 54-check suite). The remaining gaps are the
device-capability integrations on mobile (GPS capture, voice, push
notifications, drawn signature), Razorpay checkout UI, the web review-approve
persistence, and the GL platform-admin portal — each already surfaced honestly
in the UI as "coming soon" rather than simulated.
