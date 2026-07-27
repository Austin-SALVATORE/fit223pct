# Smart Connector — Phase 0 Investigation

**Status: ON HOLD (owner decision 22 Jul). Investigation complete and
preserved; no phases scheduled, no PoCs pending, no implementation.**
When revived, re-verify the fast-moving externals (Capacitor plugin
landscape, Mi Fitness→Apple Health behavior) — the architecture
reasoning stands. This document is the review contract for the
proposed milestone: product assessment, feasibility, architecture
decision records, domain model, algorithm proposal, phased plan, and
risk register. Owner decisions required before Phase 0 closes are
collected in §11.

Hardware/context established 22 Jul: scale is the **Xiaomi 8-Electrode
Body Composition Scale (XMTZC01YM)** — segmental BIA via pull-out hand
bar — owned by **Mi Fitness**. Per Xiaomi's own support documentation,
Mi Fitness can write weight and body-fat rate to Apple Health. Watch is
an Apple Watch writing to HealthKit natively.

---

## 1. Critical assessment

**The feature is aligned with the product's stated direction** —
"differentiation comes from training intelligence, not illustrations;
recovery data must become an input to the training engine" is the
owner's own long-term framing, and Smart Connector is exactly that.
The product question in the brief (one daily state, not a dashboard)
is the right one. Four assumptions need correcting before anything
else:

1. **The DailyState must BE the readiness engine, not a sibling.**
   Fit223 already ships a categorical, driver-based, explainable
   readiness model (ready/steady/easier — docs/Readiness.md) with a
   subjective check-in, prescriptions integration, and three locales of
   carefully-reviewed terminology. The brief's proposed "Recovery: Good
   / Normal / Reduced" is a second vocabulary for the same concept.
   Building it would give the app two competing answers to "what state
   am I in today." Smart Connector's real shape is: **the existing
   readiness engine gains objective drivers** (sleep, RHR, HRV, load)
   alongside the subjective five, and DailyState is the enriched
   explanation of the tier it already produces. The terminology
   constraint (readiness, never wellness/medical) carries over intact.

2. **The brief contains a pre-M8 fossil.** The example recommendation
   "keep the final compound sets around RIR 2" and the output "proceed
   but cap RIR" reference a control the owner removed from the product
   this week (docs/PyramidProgression.md). Recommendation vocabulary
   must use the pyramid-era levers: *drop the top set*, *use the
   lighter substitution*, *swap to recovery activity*, *postpone* —
   the same levers readiness already owns.

3. **This is a personal product, and that changes the hardest
   constraint.** Almost everything scary about "iOS health app" —
   App Store review, health-data app policies, public privacy
   policy — applies to *distribution*, not development. Fit223 has one
   user. A native shell installed via Xcode or TestFlight on the
   owner's own device needs the HealthKit entitlement and usage
   strings, nothing more. The cost is an Apple Developer membership
   decision (§11).

4. **Seven phases is a program, not a milestone.** Phases 0–3 are the
   milestone ("Smart Connector"). Phases 4–6 are separate future
   milestones gated on the first proving useful. The metric list must
   also shrink: only metrics that feed a defined product decision are
   ingested (§5). SpO₂ and respiratory rate are **rejected** (no
   training decision consumes them; medical-adjacent). Stand hours and
   VO₂max are **deferred** (no consumer yet).

One scheduling constraint: **M8 (Pyramid Progression) ships first.**
Smart Connector's recommendations speak in pyramid levers, so the
levers must exist. Phase 0's PoCs don't touch the runtime and can run
in parallel with M8.

---

## 2. Feasibility matrix

### A. Apple / PWA feasibility — explicit answers

| Question | Answer |
|---|---|
| Can the PWA read Apple Health directly? | **No.** There is no web API for HealthKit; Safari/WebKit exposes neither HealthKit nor Web Bluetooth. This is structural, not a workaround gap. |
| Is a native iOS component required? | **Yes**, for any automatic data. The only choice is its shape. |
| Capacitor wrapper vs separate Swift companion? | **Wrapper.** A separate companion cannot share storage with a Safari-installed PWA (Safari's IndexedDB is sandboxed per-origin inside Safari; App Groups don't reach it). Every companion→PWA channel is bad: URL schemes (manual, payload-limited), file export/import (manual), localhost server (killed in background), cloud relay (violates local-first). Wrapping the existing web app in Capacitor puts the WKWebView, its IndexedDB, and the HealthKit plugin **in one process** — the bridge is a function call. |
| HealthKit → local DB without cloud? | **Yes.** In-process plugin call → normalization in TypeScript → Dexie. Zero network. |
| Native↔web communication? | Capacitor plugin bridge (JS ⇄ Swift, in-process). A thin custom plugin is ~200 lines of Swift if community plugins don't fit; `@capgo/capacitor-health` is the actively maintained candidate (tracks Capacitor majors), with `perfood/capacitor-healthkit` as reference. PoC A picks. |
| What works as a Home-Screen PWA? | Everything current — and nothing new. The Safari PWA cannot gain health access, ever. On iPhone, the install channel changes to the wrapped app; the PWA remains the product for desktop/Android/dev. |
| Automatic vs open-the-app sync? | Foreground: on-open sync via anchored queries (`HKAnchoredObjectQuery`, persisted anchors) — covers the daily-morning use pattern. Background: HealthKit background delivery wakes *native* code only (the WKWebView's JS is not running); native stages new-sample notifications into an inbox the web layer drains on next open. |
| Background delivery viable? | **Yes, with limits**: per-type minimum frequencies (immediate for workouts, ~hourly for most metrics), and it buys freshness, not web-layer computation. Treat as an optimization, not the design's foundation — on-open sync is the foundation. |
| Is a watchOS app needed? | **No** for reading. The watch writes sleep, HR, HRV, RHR, and workouts into the iPhone's HealthKit store on its own. The brief's four watch scopes separate cleanly: scope 1 (import watch-written data) is Phases 2–3; scopes 2–4 (control/live-HR/watch UI) are the deferred Phase 6 milestone. |
| Entitlements / policies? | HealthKit entitlement + `NSHealthShareUsageDescription` (read) and `NSHealthUpdateUsageDescription` (Phase 5 write-back only). App Store health-data policies apply only if distributed; personal installs skip review. Health data must never reach logs or any telemetry (the app has none — keep it that way). |

### B. Xiaomi feasibility — XMTZC01YM specifically

| Route | Verdict | Notes |
|---|---|---|
| 1. HealthKit aggregation (Mi Fitness → Apple Health) | **RECOMMENDED** | Xiaomi documents Mi Fitness↔Apple Health sync (weight, body-fat rate). If PoC C confirms it on the owner's phone, the Xiaomi "integration" is configuration, not code — Fit223 only ever talks to HealthKit. |
| 2. Official Xiaomi API | **Rejected** | No supported public API/partner program suitable for a personal local-first app. |
| 3. Official data export | **Backfill only** | GDPR-style export; fine for one-time history import (a Phase 4 nicety), useless for daily sync. |
| 4. Direct BLE | **Rejected for v1** | Would require the native layer anyway (no Web Bluetooth on iOS). The 8-electrode model's protocol is newer and far less community-documented than the old Scale 2 (openScale-era work targets XMTZC02HM/05HM); segmental composition is computed in Mi Fitness's algorithms, so raw impedance would force reproducing Xiaomi's formulas — accuracy, maintenance, and pointless-precision risks. Revisit only if Route 1 empirically fails. |
| — Undocumented Xiaomi cloud | **Rejected outright** | Fragile, account-security exposure, violates local-first. |

**Fallback if body-fat doesn't survive the Mi Fitness→Health sync:**
manual body-fat entry on the existing Sunday **checkpoint** day (the
weigh-in UI shipped in M6) — one field, reading the number off the Mi
Fitness screen weekly. Weight itself has high confidence of syncing.

---

## 3. Recommended architecture

```
Apple Watch ──────────┐
                      ▼
        Apple Health / HealthKit (iPhone)   ← the ONLY integration boundary
                      ▲
Mi Fitness ───────────┘  (weight, body-fat — configuration, not code)
                      │
        ┌─────────────┴──────────────────────────────┐
        │  Fit223 iOS app (Capacitor shell)          │
        │                                            │
        │  Swift: HealthKit plugin                   │
        │   • anchored queries + persisted anchors   │
        │   • background-delivery inbox (staged)     │
        │   • raw samples never leave this layer     │
        │            │ normalized, minimal           │
        │            ▼                               │
        │  WKWebView: the existing Fit223 web app    │
        │   • src/lib/healthBridge facade            │
        │     (native impl / web no-op impl)         │
        │   • domain normalization + dedup (TS)      │
        │   • Dexie: healthSamples, externalWorkouts,│
        │     connectors, dailyStates                │
        │   • readiness engine + objective drivers   │
        │   • Today summary / trends / explanations  │
        └────────────────────────────────────────────┘
```

Trust boundaries: HealthKit permission dialog (per-type, iOS-enforced)
→ native plugin (holds raw access) → normalized subset crossing the
bridge → Dexie (derived + windowed cache). No network anywhere in the
flow. Offline is trivially preserved: sync is a local IPC call.

The **web build must keep working without the native layer**: the
`healthBridge` facade ships a no-op web implementation (capability
detection), so desktop/dev/PWA builds run unchanged and the connector
UI honestly says "requires the iOS app."

**Migration** (one-time, iPhone only): the M5 data-portability
full-data export/import IS the bridge — export from the Safari PWA,
import into the wrapped app on first launch. An existing feature
retires the milestone's scariest-looking problem.

---

## 4. Architecture Decision Records

**ADR-1 — HealthKit is the single integration boundary.**
Fit223 integrates with HealthKit and nothing else. Xiaomi, and any
future wearable or scale, reaches Fit223 only by writing to Apple
Health. Consequence: one permission model, one dedup regime, one
provider to test; new devices are configuration. Trade-off accepted:
metrics a vendor won't write to Health don't exist for Fit223 (manual
checkpoint entry is the relief valve).

**ADR-2 — Capacitor wrapper, not a companion app.**
The iPhone install channel becomes a Capacitor-wrapped build of the
existing web app; the Safari PWA remains for every other platform and
for development. Rejected: separate Swift companion (no storage bridge
to Safari's sandbox — every channel is manual or cloud); full native
rewrite (absurd for one platform). Trade-off accepted: Capacitor major
upgrades enter the maintenance surface; WKWebView storage must be
protected by the existing export/backup habit.

**ADR-3 — Xiaomi rides through Mi Fitness → Apple Health.**
No Xiaomi-specific code in any phase of this milestone. PoC C verifies
empirically; documented fallback = weekly manual body-fat at the
Sunday checkpoint. BLE and cloud routes rejected (§2B).

**ADR-4 — Raw stays native; Dexie holds normalized-windowed + derived.**
HealthKit is already the permanent, user-controlled archive — Fit223
does not replicate it. Dexie stores: normalized samples **only for
metrics the product consumes**, within a rolling window (90 days,
constant); derived baselines and DailyState snapshots kept
indefinitely (small, and they are Fit223's own work product). Health
samples are **excluded from the full-data export by default**
(re-derivable from HealthKit; keeps backups shareable), included
behind an explicit toggle. Consequence: disconnect/delete is cheap and
honest — drop the cache, keep or drop derived per user choice.

**ADR-5 — Sync is foreground-first, idempotent, anchor-based.**
On every app-open (and pull-to-refresh on the connector screen): drain
the native inbox, run anchored queries per metric, normalize, upsert
by HealthKit UUID, process deletions as tombstones. Background
delivery only stages; it never computes. Duplicate imports are
structurally impossible (UUID upsert); re-sync after anchor loss is a
bounded re-window, not a special case.

---

## 5. Domain model

New domain area `src/domain/health/` (pure, descriptor pattern —
no React/i18next, same as the rest of domain/).

```ts
type HealthMetric =
  | 'weight' | 'bodyFatPct' | 'leanMass'
  | 'restingHeartRate' | 'hrv'            // hrv = SDNN as HealthKit provides
  | 'sleepDuration'                        // per night, minutes
  | 'steps' | 'activeEnergy'               // daily totals, load context only
// Deliberately absent: BMI (derived, not stored), sleep stages (v1 uses
// duration only), SpO2/respiratoryRate (rejected), VO2max/standHours
// (deferred — no consumer).

interface HealthSample {
  id: string                    // `${provider}:${externalId}`
  metric: HealthMetric
  value: number                 // canonical units: kg, %, bpm, ms, min, kcal
  startAt: string; endAt: string  // ISO with offset; day rules below
  sourceProvider: 'apple-health' | 'manual'
  sourceApp?: string            // HKSource bundle id (e.g. Mi Fitness)
  sourceDevice?: string
  externalId: string            // HealthKit UUID; manual = generated
  importedAt: string
  qualityFlags?: ('outlier' | 'partial-day' | 'user-corrected')[]
}

interface ExternalWorkout {
  id: string                    // HK workout UUID
  activityType: string          // HK activity type, mapped to app vocab
  startAt: string; endAt: string
  activeEnergyKcal?: number
  avgHeartRate?: number; maxHeartRate?: number
  sourceApp?: string; sourceDevice?: string
  matchedWorkoutId?: string     // Fit223 workout, when overlap-matched
  matchConfidence?: 'exact' | 'probable' | 'none'
  importedAt: string
}

interface Connector {
  id: 'apple-health'            // one row in this milestone; model allows more
  status: 'connected' | 'disconnected' | 'error' | 'unavailable'
  perMetricAuthorization: Record<HealthMetric, 'granted' | 'denied' | 'notDetermined'>
  anchors: Record<string, string>   // serialized HK query anchors
  lastSuccessfulSyncAt?: string; lastAttemptedSyncAt?: string
  lastError?: string            // key, not prose — locale-free storage
}

interface DailyState {          // persisted snapshot, one per day
  date: string                  // local calendar day
  readiness?: ReadinessResult   // the EXISTING model's output, enriched
  objectiveDrivers: DriverReading[]  // each: metric, value, baseline,
                                     // deviation, contribution, confidence
  sleep?: { minutes: number; vsBaseline: MessageDescriptor }
  bodyTrend?: { weightDelta7d?: number; bodyFatTrend?: TrendResult }
  externalLoad?: { workouts: number; note?: MessageDescriptor }
  completeness: { present: HealthMetric[]; missing: HealthMetric[];
                  stale: HealthMetric[] }
  recommendation: MessageDescriptor      // pyramid-era levers only
  explanations: MessageDescriptor[]      // every recommendation shows its
                                         // reasons — M3 contract holds
  algorithmVersion: number
}
```

**Ownership & conflict rules** (the brief's cases, decided):

- **Dedup:** upsert by HealthKit UUID. Same sample re-imported =
  overwrite-in-place, no duplicate possible. HK deletion events →
  delete local row (tombstone recorded in sync log for audit).
- **Overlapping workouts** (Fit223 strength session + watch
  "Traditional Strength Training"): time-overlap ≥50% within ±15 min →
  `matchedWorkoutId` set, the ExternalWorkout becomes *enrichment*
  (HR data) of the Fit223 workout, never a second training-load entry.
  Fit223's own log is always the authority on what training happened;
  external workouts add cardio context, never duplicate load.
- **Duplicate weights** (Xiaomi via Health + manual checkpoint entry
  same day): same-metric samples within the same local day →
  device (`sourceApp` = Mi Fitness) preferred over manual for the
  *displayed* value; both retained with provenance; trends consume one
  value per day (last-device-else-manual).
- **Two RHR sources:** prefer the watch (`sourceDevice`), fall back to
  any; never average across sources.
- **Tennis replaces the gym day:** the external workout is shown on
  that day's DailyState ("external activity logged") and counts toward
  load; it does not mark the planned session complete — skipping is
  always fine is non-negotiable, and silently marking-complete would
  falsify the consistency trend.
- **Fit223 workout edited after HK write-back** (Phase 5): Fit223 is
  source of truth; the HK copy is updated (same UUID via metadata
  key), never forked.
- **Day boundaries:** samples belong to the local calendar day of
  their `endAt`; **sleep belongs to the wake-day** (the night ending
  this morning). DST transitions resolved by local wall-clock. Units
  normalized at the bridge (HealthKit already serves requested units).
- **Outliers:** |Δweight| > 2 kg/day or HRV/RHR beyond 3σ of the
  28-day window → flagged `outlier`, shown but excluded from baselines
  and recommendations. Never silently discarded.

---

## 6. Product specification

**Today page** gains one card — the enriched readiness summary,
replacing nothing:

> **Readiness: steady** · Sleep 7 h 18 min, near your baseline ·
> Resting HR +3 over baseline · HRV slightly low · Two sessions in
> the last three days · Weight −0.4 kg this week
> **Today: Session A — train as planned; drop the top set if it
> feels heavy.**
> *Based on: check-in, sleep, heart data · Missing: none*

Rules: the categorical tier stays the headline (no invented numeric
score — the brief's "no unexplained 83" is already app law);
each line is a driver with a baseline comparison; the completeness
footer is always present; every state from the brief's list is
visually distinct (no data / stale / normal / abnormal / permission
denied / connector error) — reusing the insufficient-data discipline
from M4's trends.

**Connector settings** (inside existing Settings): one Apple Health
row — status, per-metric grants (with per-metric re-request),
last-sync, sync-now, disconnect (drops cache, offers to keep derived
history), and an honest "requires the iOS app" state on web/desktop.
Permissions are requested **just-in-time per phase**: Phase 2 asks for
its read set on connector activation, not at app onboarding; Phase 5's
write permission is asked only when write-back is enabled.

**History:** sleep/RHR/HRV/weight/body-fat join the existing Progress
phrase-driven trends (no charts, same insufficient-data states).

**Errors:** connector errors are stored as keys, rendered in all three
locales, and never contain health values.

---

## 7. Algorithm proposal (v1 — conservative, explainable)

- **Baselines:** 28-day rolling median per metric (median, not mean —
  robust to outliers), requiring ≥14 samples to activate; before
  that, the driver reports "building your baseline" and contributes
  nothing. Deviation = today (or 7-day EWMA for HRV) vs baseline.
- **Objective drivers** (each → good / neutral / poor / absent):
  sleep duration vs baseline; RHR deviation; HRV deviation (EWMA);
  training density (sessions in last 72 h, external included).
- **Fusion rule — subjective wins:** objective drivers may move the
  readiness tier **at most one step, and only toward easier**, and
  never against a *worse* subjective check-in. Device data can say
  "you feel fine but your body disagrees — go easier"; it must never
  say "you feel wrecked but your watch says train." No check-in +
  strong objective coverage → objective drivers may set the tier
  alone, labeled as such. This implements the brief's "do not let
  device data silently override the user" as a hard rule, not a
  preference.
- **Recommendation outputs** (pyramid-era, all existing or M8 levers):
  train as planned · drop the top set · use the lighter substitution ·
  swap to recovery activity · consider postponing · no recommendation
  (insufficient evidence — a first-class output, shown honestly).
- **Guardrails:** single-sample deviations never trigger anything
  (multi-day patterns only, except sleep which is inherently
  per-night); body-fat% NEVER drives recommendations (BIA noise —
  trend display only); no illness/injury/medical language anywhere
  (readiness vocabulary constraint, all locales); `algorithmVersion`
  stamped on every DailyState so logic changes never silently
  reinterpret history.

---

## 8. Phased plan (refined from the brief)

**Phase 0 — Discovery** *(this doc + three PoCs + owner decisions)*
- PoC C — **zero code, owner-runnable today**: enable Apple Health
  sync in Mi Fitness, weigh in (grip the hand bar), check the Health
  app for weight AND body-fat entries, note latency and source
  metadata. This single experiment decides the entire Xiaomi strategy.
- PoC A — HealthKit spike: Capacitor shell + candidate plugin reads
  one metric (weight), normalizes, idempotent re-sync, revoked
  permission handled.
- PoC B — the real Fit223 web app in the Capacitor shell: Dexie
  works, service worker/PWA behavior sane, full-data export/import
  migration proven, WKWebView storage persistence confirmed.
- Owner decisions: §11.

**Phase 1 — DailyState on existing data** *(pure web, after M8)*
Domain model + DailyState computed from what the app already has:
check-ins, workout history, checkpoint weigh-ins. Adds ONE input
field: body-fat% on the Sunday checkpoint (which the Xiaomi path
feeds a number to weekly even before Phase 2 exists). **Cut from the
brief:** manual sleep-entry UI — throwaway work weeks before Phase 2
automates it; baselines simply activate later. Validates the summary
UX and baseline logic with zero native risk.

**Phase 2 — Apple Health read-only bridge** *(the native milestone)*
Capacitor shell becomes the iPhone install channel (one-time
export/import migration); connector UI; authorization; anchored
idempotent import of: weight, body-fat, RHR, HRV, sleep duration,
steps, active energy, external workouts. No write-back, no watch app.

**Phase 3 — Synthesis**
Baselines, objective drivers fused into readiness (§7), external
workout matching, completeness/confidence surfaces, Progress trends,
correction affordance (mark sample as wrong → `user-corrected`,
excluded from baselines).

**Phase 4 — Xiaomi completion** *(expected: nothing to build)*
If PoC C succeeded, this phase is documentation + optionally the
historical export backfill. BLE only if Route 1 empirically failed
AND weekly manual entry proves too annoying — explicitly re-decided,
not drifted into.

**Phase 5 — Workout loop** *(separate future milestone)*
Write Fit223 workouts to HealthKit (dedup vs watch via matching
rules), associate workout HR, post-workout cardio summary, 1-min HR
recovery where data supports it.

**Phase 6 — Watch experience** *(separate future milestone, own
brief)* Only after Phases 2–3 prove the data is consulted in real
use.

**Releasable slices:** each phase lands usable alone — 1 without any
native code, 2 without algorithm changes, 3 completes the milestone.

---

## 9. Repository impact map

- `ios/` — Capacitor project (new, committed); `capacitor.config.ts`;
  Xcode project with HealthKit entitlement + usage strings.
- `src/lib/healthBridge/` — facade: `native.ts` (plugin calls),
  `web.ts` (no-op, capability-detected). The web/PWA build compiles
  and runs with zero native imports.
- `src/domain/health/` — normalization, baselines, daily-state,
  matching; pure + descriptor pattern; the bulk of the tests.
- `src/data/` — Dexie version bump: `healthSamples`,
  `externalWorkouts`, `connectors`, `dailyStates` (+ repositories).
  Additive migration; existing tables untouched.
- `src/features/today/` — readiness card enrichment;
  `src/features/settings/` — connector screen;
  `src/features/progress/` — new trends.
- `src/locales/{en,fr,zh-CN}/` — new namespaces; glossary passes for
  fr/zh (sleep/heart terminology needs the same native-reader rigor
  as M7 — "readiness" rules apply).
- Tests: synthetic fixtures only (generator util, never real health
  records committed — repo rule); timezone/DST suites; dedup/anchor
  suites; fusion-rule table tests.
- Build: `vite build` unchanged for web; `cap sync ios` for the shell;
  CI unchanged (native build is owner-machine-only for now).

## 10. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Mi Fitness silently changes/breaks Health sync | Medium | Fit223 never talks to Xiaomi; staleness detection surfaces it ("last scale reading 12 days ago"); manual checkpoint fallback always works. |
| WKWebView storage eviction/loss | High | Persistent storage API + the existing export habit (backup reminder in connector settings); derived data re-computable; raw re-syncable from HealthKit. |
| Capacitor/iOS major-version churn | Medium | Thin plugin surface (one facade file); pin versions; the web product never depends on the shell. |
| Free vs paid Apple account: 7-day cert expiry would make the app die weekly | High (if free) | Recommend paid ($99/yr) — decision §11. |
| BIA body-fat noise read as signal | Medium | Body-fat never drives recommendations; trend-only display with M4's insufficient-data discipline. |
| Medical-interpretation drift | High (product) | Hard vocabulary rule carried from M3; no diagnosis language; outputs are training levers only; review-gated copy in all locales. |
| Data quality depends on watch-wear habits (sleep/HRV need night wear) | Medium | Completeness surfaces make gaps visible instead of degrading silently; §11 question. |
| iCloud device backup includes app (Dexie) data | Low | Document it; health samples are a windowed cache; owner can exclude the app from backup if desired. |
| Scope creep toward a health dashboard | High (product) | The metric enum is closed; every metric must name its consuming decision; this doc is the review contract. |

## 11. Open questions (blocking, owner-answerable)

1. **Do you wear the Apple Watch during sleep?** Sleep/HRV/RHR — the
   three strongest readiness signals — are captured overnight. If not,
   the milestone's value shifts heavily toward weight/body-comp +
   external workouts, and that changes what Phase 2 requests.
2. **Apple Developer membership ($99/yr) — acceptable?** Without it,
   the installed shell's certificate dies every 7 days (weekly
   re-install from Xcode). With it: 1-year certs or TestFlight.
   Effectively mandatory for this milestone to be livable.
3. **PoC C result:** does body-fat actually appear in Apple Health
   from *your* Mi Fitness version after a hand-bar measurement?
   (Weight is near-certain; body-fat is documented but must be seen.)
4. **Install-channel switch accepted?** On iPhone, Fit223 moves from
   Safari PWA to the installed shell (one-time export/import
   migration). Everywhere else nothing changes.

## 12. Recommendation

**Approve the milestone in the reduced shape: Phases 0–3.** Run PoC C
today (zero code — Mi Fitness settings + one weigh-in). Green-light
PoCs A and B as small spikes in parallel with M8 development. Phase 1
starts after M8 ships. Defer write-back (5) and the watch app (6) into
their own future milestones, and reject BLE, Xiaomi cloud, SpO₂, and
respiratory rate now so they can't drift back in.

The initial hypothesis in the brief survives review with one
structural amendment: HealthKit-as-hub is right, but the "Fit223 iOS
Health Bridge" must be the **whole app wrapped in Capacitor**, not a
companion beside the PWA — companion-to-PWA storage isolation makes
every other shape manual or cloud-dependent. And one product
amendment: DailyState is the existing readiness engine speaking with
more evidence — not a second brain.
