# Web Changes Review — `apps/web` vs `groundlense_v4.html`

> Living document tracking fixes applied to the web app after the spec review.
> Last updated: **2026-06-12**. Verified with `npx tsc --noEmit` (clean) and
> `npx next build` (clean). Companion doc: `API_CHANGES_REVIEW.md`.

The driving requirement: **no dummy/mock/hardcoded data anywhere** — every screen now
renders real API data or an honest empty/disabled state.

---

## 1. Auth & login

**Files:** `components/login/LoginForm.tsx`, `app/actions/auth.ts`, `app/login/page.tsx`, `lib/api.ts`
- **Demo-login backdoor removed.** Previously: empty credentials were auto-filled with
  `admin@xyzinfra.com / Password@123`, and *any* API failure silently created a
  `mockUser` with a `demo_access_token` and pushed to /dashboard. Now: credentials are
  required, the real NestJS error message is shown inline, and login only succeeds
  against the real API.
- `redirect()` moved outside try/catch (NEXT_REDIRECT no longer swallowed); the
  `?redirect=` param set by middleware is honored (with a same-origin safety check).
- `lib/api.ts` now extracts the actual NestJS error body (string or string[]) instead
  of generic "failed: 401".
- **Signup**: backend has no `/auth/register`, so the signup flow no longer pretends to
  work — it shows "Registration is not available yet — ask your organization admin to
  create your account." Hardcoded GL code `GL-CON-4821` and the fake link-parties list
  removed; password-strength bars now compute from the typed password.

## 2. Dashboard

**Files:** `app/dashboard/page.tsx`, `components/dashboard/*`
- **Role-based routing** per the prototype: EPC_CONTRACTOR users open projects in the
  read-only **contractor portal** (`/projects/:id/contractor` — previously orphaned,
  unreachable from anywhere); everyone else goes to the data portal.
- **ProjectSearch fixed**: it used to `fetch("/api/v1/projects")` from the browser with
  no auth header → always 401, silently empty. Now filters the server-fetched,
  org-scoped projects list.
- **Empty-state bug fixed**: zero projects no longer renders the "New project" tile AND
  the "No projects yet" state together.
- **New-project modal actually creates projects** (was fully decorative — submit just
  closed it). Controlled Step 1/2 forms → `createProjectAction`; the real persisted
  `projectCode` is shown in the Step 3 share box; "Pay & activate" records a real
  PENDING payment via `createPaymentAction`. Hardcoded access requests
  (STUP/Apensia) removed.
- Locked project cards: real `lockedAt` drives the overlay with a working
  "Pay now ₹N" button (records a PENDING payment).
- SummaryRow uses real `/dashboard/summary` totals; breakdowns the API doesn't provide
  render "—" instead of invented numbers.

## 3. Engineer portal (`PortalClient.tsx` — full de-mock)

**Files:** `components/portal/PortalClient.tsx`, `app/projects/[projectId]/portal/page.tsx`, NEW `app/actions/portal.ts`
- **All fabricated data deleted**: the fallback "Patna-Gaya NH-83" project, the
  5-borehole `GL-BH-0047` mock dataset, and — worst — the merge step that injected
  fake SPT intervals, water-table readings, media, chainages, and coordinates into
  *real* boreholes. Fake team members, fake NABL lab "Geocon CC-1847", fake activity
  feed, padded photo counts — all gone. Empty states explain "data appears when field
  teams sync."
- **Anomalies are computed, not hardcoded**: an interval is flagged if `isRefusal` or
  `nValue ≥ 30` and ≥ 2.5× the median of the previous 3 intervals (was: hardcoded to
  the literal mock ID `GL-BH-0047-A-03`, so it could never fire on real data).
- **Review tab persists**: "Apply Modification" calls `PATCH /intervals/:id` with the
  corrected N and a remark embedding the mandatory IS-clause + reason; audit line shows
  the real logged-in engineer and timestamp. (Approve/accept remains session-local,
  labelled "(session) — not yet persisted", pending an engineer-reviews backend.)
- **Lab tab is real**: sample table from real samples with computed 14-day deadline
  chips; stat cards computed; the results form starts empty (magic seeds 58.7/LL 35/
  c=0.42 removed); "Lock & Save Results" actually POSTs
  `/samples/:id/lab-results` (NABL lab chosen from `GET /nabl-labs`; empty registry →
  submit disabled with notice). Existing lab results are fetched and lock their rows.
- **Report tab is real**: SPT N-vs-depth graph plotted from real intervals (was two
  hardcoded SVG paths); liquefaction CSR/CRR from real intervals (dead-code double
  assignment removed); pile capacity shows "Requires lab results" (was 4 hardcoded
  rows); the hardcoded SHA-256 "chain root" and fake certificate toggle replaced by a
  disabled card ("Available after field data is hash-sealed").
- **Live Monitor**: cross-section depth axis scales to the real max depth (was fixed
  0–18 m, so a 30 m hole drew off-canvas); strata from real intervals; "Easting"
  mislabel fixed (it was showing latitude); GPS deviation shows "not recorded" (the
  schema has one lat/lng pair — planned-vs-actual doesn't exist to compute).
- **Setup tab**: members table from real project members; "View log" opens a real
  slide-in panel of that user's activity logs; non-functional buttons (Save Setup, Add
  Team, Excel import/export) are visibly disabled "Coming soon" instead of silently
  inert.
- CSS fixes: invalid `rounded: 9999px` removed; missing `data-table`/`pill-*` classes
  defined.

## 4. Contractor portal (`ContractorClient.tsx` — full de-mock)

**Files:** `components/contractor/ContractorClient.tsx`, `app/projects/[projectId]/contractor/page.tsx`, NEW `app/actions/contractor.ts`, NEW `app/api/media/[id]/route.ts`
- **Cross-section from real intervals**: `getBoreholeLayers()` (which invented
  Fill/Silt/Clay/Sand strata with N=4/12/14/38 from total depth alone) deleted; bands
  now come from real interval depths/descriptions/N-values, axis scaled to real depth,
  water-table line from real observations. Empty boreholes draw an honest empty shaft.
- **False flags fixed**: flags were derived from `boreholeCode.includes("2")/("3")` —
  which marked nearly every real code anomalous. Replaced by the same computed
  heuristic as the portal. Fabricated "+4.2m" GPS chips removed; "GPS deviation: not
  recorded" shown (single coordinate pair in schema).
- **Real summary header**: structures = real sites, completed = real status counts,
  **investigation cost = sum of SUCCESS payments** (was boreholes × 5000), anomaly
  count replaces the fake GPS-deviation stat.
- **Real photo strip**: the 4 hardcoded photo cards replaced with actual uploaded media,
  served through the new authenticated proxy `/api/media/:id` (the API no longer
  exposes public `/uploads`; this Next route handler attaches the Bearer token
  server-side and streams the file).
- Site-vs-engineer toggle is honest: engineer view marks "(reviewed)" only when the
  interval's remarks record an IS-clause modification; no invented "N=18 (corrected)".
- Org-name fallbacks ("GR Infraprojects/NHAI/STUP") → real org relations or "—";
  hover cards/info rows show real coordinates/dates/status with "—" for missing;
  `stroke-dasharray` JSX warnings fixed; downloads (PDF/cert/ZIP) disabled
  "Available soon" (no backend yet).

---

## 2. How to verify

```bash
cd apps/web
npx tsc --noEmit     # done — clean
npx next build       # done — clean
npm run dev          # then:
```
1. Login with wrong credentials → inline error, **no** dashboard access (was: always
   logged in as Demo User).
2. Login as an EPC user (`admin@xyzinfra.com` if seed data present) → project cards
   open the contractor portal; geotech users land on the data portal.
3. Open a project with no field data → empty states everywhere, zero invented
   boreholes/intervals/photos.
4. New project modal → creates a real project; its real `GL-PRJ-…` code appears.
5. Review tab → Apply Modification persists (refresh and the new N survives).
6. Lab tab → Lock & Save creates a row in `lab_results` (404 → form; saved → locked).

---

## 3. Backend gaps surfaced (needed to finish prototype parity)

| Prototype feature | Missing backend | Current honest behavior |
|---|---|---|
| Signup (3-step company registration) | `POST /auth/register` + OTP | "Registration not available yet" notice |
| "Request access" cross-org search + approvals | access-request module | Search covers own org only; "No access requests yet" |
| Geotech partner picker in new-project modal | `GET /organizations` directory | Raw org-ID text input with helper text |
| Razorpay checkout | order creation + checkout JS + webhook | Payments recorded PENDING; banner explains |
| Reports generated / per-status boring counts on dashboard | counts in `/projects` or `/dashboard/summary` | "—" |
| Review approve / query field team | engineer-reviews + review-thread endpoints | Session-local state, labelled not persisted |
| Tamper certificate | SHA-256 hash chain implementation | Disabled card |
| PDF report / CSV / photos ZIP downloads | export endpoints | Disabled "Available soon" |
| GPS deviation verdicts | planned-vs-actual coordinates in schema | "Not recorded" |
| Setup tab persistence (parameters, teams, Excel import) | project-setup endpoints | Disabled "Coming soon" |

These map to the "Remaining work" checklist in `API_CHANGES_REVIEW.md` — implementing
those API pieces unlocks each row here.

---

## 4. Gap closure update (2026-06-12, later the same day)

Backend gaps were closed and wired in (verified: `tsc --noEmit` + `next build` clean):

- **Signup works end-to-end** — the prototype's registration flow now calls the new
  `POST /auth/register` via `registerAction`, signs the company + admin in, and lands
  on the dashboard. 409 duplicate email/GSTIN shown inline. (Logo upload remains an
  honest placeholder — no backend field.)
- **New-project modal** — geotech partner is now a real select fed by
  `GET /organizations?type=GEOTECH_CONTRACTOR` (no more raw UUID input).
- **Dashboard cards** — real per-status breakdown, borehole status **dot-strip** with
  overflow, and a real progress % from the new `boreholeStatusCounts` on
  `GET /projects` (the prototype elements previously blocked on missing counts).
- **Review tab persists for real** — Apply Modification posts `MODIFY_N` reviews with
  the mandatory IS-clause (`isCodeReason`); Approve/Accept post persisted `APPROVE`
  reviews; "(session)" honesty labels removed; review history renders from the API.
- **Tamper certificate is live** — the Report tab fetches
  `GET /boreholes/:id/integrity`, shows chain-intact/broken state + the real chain
  root, and enables certificate generation only when the chain verifies. Unhashed
  legacy intervals get a clear amber warning.
- **Exports work** — CSV/JSON downloads via a new authenticated proxy route
  (`app/api/boreholes/[id]/export/route.ts`).

Known follow-ups: project-company invite/respond UI (endpoints exist, no UI yet),
sample-dispatch UI in the Lab tab, Razorpay checkout, PDF report rendering, and the
register role mapping for IE firms (currently registers as GEOTECH_CONTRACTOR).

---

## Update — 2026-07-08

- **Crew onboarding**: "+ Add Crew Member" on the Setup tab creates the worker (name, mobile, role), adds them to the project/team, and opens an invite panel: bilingual WhatsApp message (wa.me) with the app link and their activation steps (enter mobile → set password in the app). Existing/active accounts get a no-code notice. Set `NEXT_PUBLIC_WORKER_APP_URL` for the download link.
- **Assignment share**: after assigning boreholes to a team, a share panel offers per-member WhatsApp messages: "New borehole assigned: <codes>… tap Sync to see it."
- **Setup lock**: `GET /projects/:id/setup-status` drives an amber "Setup locked — fieldwork has started" banner; all setup mutations (add team/member/borehole, edits, per-borehole assignment of non-PLANNED holes) are disabled, and server 403s surface verbatim.
- **Live feed**: verified clean — renders the server feed, which now excludes login/logout.
