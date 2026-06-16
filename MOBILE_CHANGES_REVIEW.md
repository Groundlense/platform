# Mobile Changes Review — `apps/mobile` vs `groundlense_worker_app_v3.html`

> Living document tracking fixes applied to the React Native worker app after the
> spec review. Last updated: **2026-06-12**. Verified with `npx tsc --noEmit` (clean)
> and a residual-mock-data sweep (zero hits).
> Companions: `API_CHANGES_REVIEW.md`, `WEB_CHANGES_REVIEW.md`.

Driving requirement: **no dummy/mock/hardcoded data** — every screen renders what the
worker actually entered or an honest empty/disabled state.

---

## 1. Services layer

**NEW `src/config.ts`** — `API_BASE_URL` as a single documented constant (Android
emulator loopback `10.0.2.2` by default, with instructions for iOS sim / physical
devices / production).

**`services/api.ts`**
- Login stores **both** tokens; a 401 interceptor performs a single-flight
  `POST /auth/refresh`, stores the rotated pair, and retries the request once. On
  refresh failure the session is cleared and the error propagates to the UI — **no
  fabricated tokens, ever** (previously the app kept running on `'mock-jwt-token'`).
- New session methods wired to the real API: `startBoringSession`,
  `endBoringSession`, `getBoreholeSessions` — the prototype's shift/handover audit
  trail now reaches the server.

**`services/sync.ts`** — the data-loss fix (mobile side; server side in API doc §1.4)
- Push uses the server's new per-operation `results[]`: only `SYNCED` ops leave the
  local queue; `FAILED` ops stay queued with their error (one bad op no longer blocks
  or wipes the rest).
- Pull **merges** instead of overwriting: server wins for synced records, local wins
  for records that still have a pending queue op. A day of offline field work can no
  longer be erased by a sync.
- `deviceId` is a persisted random UUID per install (was the user's ID — defeating
  the device-binding fraud-prevention concept).

**`services/storage.ts`** — token-pair helpers, `getDeviceId()`, per-op queue removal.

## 2. Auth & project selection

**LoginScreen** — pre-filled `GL-W-0001`/`1234` removed; the **mock-login backdoor
deleted** (any API error used to sign you in as a hardcoded "Ramesh Chandra"). Real
errors show inline. Offline continue is allowed only for the previously-logged-in
worker matching the stored `employeeCode` — no token fabrication. Registration tab is
an honest notice ("supervisor will create your worker ID") since no register/OTP
endpoint exists.

**ProjectSelectionScreen** — fabricated search result for `GL-PRJ-2025-0047` and the
three invented projects ("NH-48 · Package 14" etc.) deleted; search runs against the
real synced cache with the prototype's amber not-found state; empty cache shows "No
projects assigned yet" + sync button; hardcoded "Team A" chip and `GL-W-0042`
fallback removed.

## 3. Boring flow

**BoringListScreen** — no longer **seeds 4 fake boreholes into persistent storage**
(which then leaked into the sync queue as real field data). Fetches real boreholes,
caches them, honest empty state. Header and progress bar (was fixed 30% / "1 done · 1
terminated…") now computed from real statuses. Stray `t('udsSampling')` copy-paste
bug fixed.

**RigSetupScreen** — driller derives from the logged-in user (was hardcoded
`GL-D-0018 · Ramesh Singh`); start date defaults to today and is validated before
queueing (was a hardcoded `04-12-2025` that produced `Invalid Date` on edit).

**StartBoringScreen** — fake GPS (spec-copied coordinates, "+4.2m deviation", "45m
away · Walk north") deleted; shows planned coordinates with an honest "GPS capture
coming soon" notice; **"Open Google Maps" now actually opens Google Maps** via
`Linking` with the planned coordinates. Resume flow computes restart depth/interval
from the real last session or deepest interval (was hardcoded 10.5 m / interval 8)
and renders the prototype's amber resume banner with real termination details.
Sessions start via the real API when online, local record offline.

**TerminateScreen** — termination is queued even when no session exists (previously
silently lost); session end goes to `PATCH /sessions/:id/end`; permanent stop routes
through Boring Closure instead of short-circuiting to COMPLETED. Resumable pause uses
the new `TERMINATED` status the API now accepts.

**SPTEntryScreen** — blow counts start at 0 (were demo 5/8/10); loop bar computes
"Interval N of M planned" and its dots from the real planned depth and recorded
intervals (was "of 13" with 5 static dots); overburden correction uses the real
recorded water table or honestly assumes a dry profile with a "WT not recorded yet"
note (was hardcoded 6.5 m); refusal requires a valid 1–150 mm penetration; missing
navigation params show an error view instead of a fabricated `bh-03` borehole; photo
button is an honest "coming soon" (no longer claims "GPS stamped on photo bytes").

## 4. Sampling, rock, water table, closure

**SampleCollectionScreen** — sample IDs derive generically from the borehole code
(was hardcoded to project `-0047`, broken for every other project) with per-depth
sequence numbers; the UDS variant gained the prototype's tube penetration/recovery
inputs, computed recovery ratio, and **two mandatory confirmations** (waxed/sealed,
stored upright) that block Next; loop exit compares against the real planned depth
(was magic 10.5/13.5); selecting Rock soil routes to Rock Coring (previously
unreachable); 14-day lab deadline persisted with the sample.

**SoilDescriptionScreen** — canned Hindi "transcripts" removed; voice is an honest
disabled state with a typed input; Rock branch wired.

**RockCoringScreen** — demo defaults 150/120/90 removed (empty inputs, validation);
added the prototype's **weathering-grade tiles (IS 4078)** included in the record;
run depth advances by the actual run length (was always +1.5 m); after each run the
worker chooses **"Next run" (loop) or "End coring → Closure"** (was force-navigated
to closure after one run); core-box photo honest "coming soon"; guitar emoji 🎸
replaced with rock styling; param validation added.

**WaterTableScreen** — depth/remarks start empty (were pre-filled `6.50`); the false
"reminder scheduled automatically!" claim replaced with honest guidance; added a
**During-drilling / 24-hr-stable toggle** (`DRILLING_LEVEL` / `STABILIZED_LEVEL`) so
the IS 6935 stable reading can be recorded manually — functionally replacing the
missing Screen 11 until push notifications exist.

**BoringClosureScreen** (the legal record — was 100% fabricated) — every value now
aggregates from the worker's actual entries: session start/end timestamps + computed
duration (was "15 Apr 2025 / 7 hrs 31 min"), real interval count (was "13 entries"),
real SPT/UDS sample counts, real water table preferring the 24-hr stable reading (was
"6.20m"), rock depth + RQD from real rock runs (rows hidden when absent), photos
honestly "None (camera coming soon)" (was "18 photos"). Signature records the **real
logged-in worker** with timestamp (was "Ramesh Chandra"); GWT confirmation defaults
from real observations and is required before submit; the false "Generating SHA-256
certificate" claim replaced with "Data locked and queued for sync".

**EngineerQueryScreen** — all canned content (fake query from "Er. Rajesh Kumar",
fabricated blow counts, pre-written reply) deleted. Renders a real query only if one
is passed via navigation; otherwise an honest "No queries from engineers yet" state.
Send is disabled "coming soon" — there is no review-thread backend, so replies cannot
actually be delivered (previously they were queued into a BORING update and went
nowhere while claiming success).

---

## 5. How to verify

```bash
cd apps/mobile
npx tsc --noEmit       # done — clean
npx react-native run-android   # emulator; API at 10.0.2.2:3000
```
1. Login with wrong PIN → inline error, no mock session.
2. Fresh install, no network → "No projects assigned yet" (no invented projects).
3. Complete a boring offline → sync → records appear in the API DB
   (`borehole_intervals`, `samples`, `water_table_observations`) and the local queue
   drains only for SYNCED ops.
4. Terminate with resume → reopen → amber banner shows the real depth/reason;
   restart depth matches where you stopped.
5. Boring Closure shows your actual counts/timestamps and your own name as signature.

## 6. Native-capability gaps (deliberate honest states — need libraries + permissions + rebuild)

| Prototype feature | Needs | Current honest behavior |
|---|---|---|
| Camera + GPS-stamped photos | react-native-vision-camera / image-picker + CAMERA permission | "Camera coming soon" disabled buttons; records sync without photos |
| Live GPS + deviation check | @react-native-community/geolocation + location permissions | Planned coordinates shown; real Maps deep link works via `Linking` |
| Hindi voice transcription | @react-native-voice/voice + RECORD_AUDIO | Disabled mic + typed input |
| 24-hr WT push reminder (Screen 11) | notifee/FCM + POST_NOTIFICATIONS | Manual 24-hr stable toggle on the WT screen |
| Auto-sync on reconnect | @react-native-community/netinfo | Manual sync buttons |
| Drawn signature pad | react-native-signature-canvas | Typed-name tap-to-sign with timestamp |
| Engineer queries (Screen 12) | Backend review-thread module + notification entry point | Empty state; send disabled |

Backend gaps shared with web (`/auth/register` + OTP, project search by code,
review threads) are tracked in `API_CHANGES_REVIEW.md` §4.

---

## 7. Gap closure update (2026-06-12, later the same day)

Two of the backend gaps were closed and wired in (verified: `tsc --noEmit` clean):

- **Project search is server-backed** — `GET /projects/search?code=` powers all three
  prototype states: found+assigned (open the project), **found-but-not-assigned (the
  red "contact your supervisor" card — previously impossible)**, and not-found
  (amber). Offline falls back to the local cache with an honest hint.
- **Engineer queries are live** — the query screen is now a real inbox fed by
  `GET /threads/assigned-to-me` (threads with engineer name, borehole, message
  history); workers reply via `POST /threads/:id/messages` — the send button is
  enabled and actually delivers. A "📨 Engineer queries" entry point was added on the
  project-selection screen. Offline shows an honest retry state. Voice input remains
  "coming soon" (native module).

The native-capability table above (camera/GPS/notifications/voice/signature/NetInfo)
is unchanged — those still require adding the libraries + permissions + a rebuild.
