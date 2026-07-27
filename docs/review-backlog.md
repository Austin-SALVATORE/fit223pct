# Post-M8 review backlog

Findings from a parallel three-lens review (accessibility, i18n, dead
code) run 27 Jul 2026 against `main` at `45e80ee`. Read-only review;
nothing here is fixed. Each item cites `file:line`. This is a fix
contract for the dev, not a set of instructions to the reviewer.

**Highest-leverage item first:** the systemic guard in §4 retires an
entire bug class (the one the shipped weekdayActivities bug belonged
to). Land it with I1; it is worth more than any single fix below.

## Severity legend
Blocker = unusable for the affected user · Serious = real barrier or
wrong output · Minor = polish. i18n items are Ixx, accessibility Axx.

---

## 1. Blockers

### A1 — Confirming a destructive swap ejects focus out of the modal
`src/features/workout/SwapSheet.tsx:132-134` → `44-53` → `117-124`.
Tapping a substitution when sets are already logged swaps the panel
subtree for `<ConfirmClear>`; the focused row unmounts, focus falls to
`<body>` outside the `aria-modal` dialog. The "clears N logged sets"
warning (`:171`) is never announced; Escape stops working (handler
bound to the panel, `:110`); recovery needs a page reload with the
destructive confirm still pending.
*Fix:* on entering the confirm step move focus to the confirm heading
(`:170`, `tabIndex={-1}` + ref) or button; mirror back to the list on
cancel.

### A2 — The fifth check-in rating collapses the card and loses focus silently
`src/features/checkin/CheckInCard.tsx:41`, `:68`, `:81-86`. Rating the
final signal makes `complete` true; the expanded branch unmounts,
focus falls to `<body>`, and the resulting readiness tier (`:97`) —
the entire payoff — renders into a region that was never announced.
Today's hero also re-derives readiness (`TodayPage.tsx:305`) with no
live region.
*Fix:* focus the collapsed row heading on the expanded→collapsed
transition, or announce the tier via a polite live region. This is the
"what happens next" product rule failing, not only a WCAG clause.

*A1 and A2 share one root cause — a conditional branch-swap at the
moment of user action destroys focus. I1 (below) is the same seam in
the i18n layer. Treat as one theme, not three tickets.*

### I1 — In-progress workout hero renders raw English session focus
`src/features/today/TodayPage.tsx:464-466`. Reads `session.focus`
directly instead of via `useSessionFocus` — the same file imports and
uses that hook correctly at `:294-295`. A zh-CN/fr user resuming a
workout sees "Push & pull foundation" instead of the translation that
already exists in `seed.json` for all three sessions in all three
locales. Today is the primary screen; "in progress" is high-traffic.
*Fix:* hoist `useSessionFocus(...)` above the conditionals (Rules of
Hooks; mirror `PlanPage.tsx:149`, add an `EMPTY_SESSION` constant).
**Owner decision underneath:** the variable is named `sessionName` but
reads `.focus`; all three reviewers independently flagged a possible
product bug beneath the i18n one. See §5.

### I2 — All JSON import validation errors are English in every locale
`src/domain/programImport.ts:370-375` → `plan:import.schemaError`,
which is a pure `{{message}}` passthrough in en/fr/zh-CN. `issue.message`
is raw English from the schemas (`:7,14,25,79,89,100,104,109,132,136`)
plus Zod's built-ins. The Markdown import path (`programMarkdown.ts`)
is exemplary — ~20 keyed descriptors — so the JSON path is the outlier.
*Fix:* map Zod issue codes + schema messages to `plan:import.*` keys,
mirroring `programMarkdown.ts`.

---

## 2. Serious

### A3 — `aria-label` on a `<p>` is prohibited; rest screen has no heading
`src/features/workout/RestScreen.tsx:58-70`. The rest-phase focus
landing is a `<p tabIndex={-1}>` with an `aria-label`; `role="paragraph"`
prohibits author naming, so AT drops it (or reads it *instead of*
"Rest"). The screen has no heading at all.
*Fix:* make it an `<h2>` or `role="status"`, string as content not label.

### A4 — Discarding an in-progress workout is a silent two-tap
`src/features/today/TodayPage.tsx:486-495`. The button arms by swapping
its own label in place; the element stays mounted, so nothing announces
the state change. A blind user can destroy an in-progress workout
without perceiving the confirm step. Arming is visual only.
*Fix:* announce armed state via live region, or use the two-control
confirm the swap sheet already has (`SwapSheet.tsx:174`).

### A5 — Control borders fail non-text contrast (WCAG 1.4.11) UI-wide
`src/ui/index.css:15-16` vs `:13-14`. Measured: `border` on `surface`
1.26:1, on `raised` 1.15:1; `border-strong` on `surface` 1.69:1 — all
below 3:1. `border-border` is the only edge on Stepper ± buttons,
SecondaryButton, RestButton, the quiet-start affordance, unselected
RatingPicker pills, and every GroupedList. In gym lighting the controls
have no perceivable edge.
*Fix:* raise `--color-border-strong` to ≥3:1 and use it for interactive
boundaries; keep `--color-border` for decorative dividers. (The palette
comment reasons about *text* contrast only — non-text was never covered.)

### A6 — Rating-picker selection conveyed by hue alone
`src/ui/RatingPicker.tsx:39-43`; same pattern `LanguageSwitcher.tsx:34-38`.
Selected vs unselected differ only in amber-vs-ink hue (near-identical
luminance) plus a faint tint. In greyscale / CVD / high-contrast mode
the check-in selection is hard or impossible to see. `aria-pressed`
covers screen readers; this is the visual channel only.
*Fix:* add a non-colour cue (solid fill or weight), not just hue.

### A7 — Technique photo strip unreachable by keyboard
`src/ui/FrameStepper.tsx:55-59`. `overflow-x-auto` with no `tabIndex`
and no controls; Safari/Firefox (iOS-first PWA) can't focus a bare
scroller. Frames are `alt=""` (`:78`) and dots `aria-hidden` (`:87`),
so the named `<section>` (`:54`) exposes nothing to a screen reader.
*Fix:* `tabIndex={0}` on the track or add prev/next; reconsider naming a
region whose contents are decorative.

### A8 — Destructive import confirm is a live region containing its own buttons
`src/features/plan/ProgramDataActions.tsx:152-165`. "This replaces your
existing program" is `role="alert"` with Replace/Cancel inside it; focus
never moves. User is told about controls but not taken to them, inside
an assertive region that can re-interrupt. It overwrites the owner's
program — it deserves a real confirm.
*Fix:* announce in a live region, render the choice as a focus-moved
confirm outside the alert.

### I3 — Hardcoded seconds/reps units and Western decimals (code + locale files)
Two halves:
- **Code sites** route raw units through no `t()`:
  `src/features/progress/formatTrend.ts:4-15` ("reps"/"s"),
  `src/features/today/SessionPreview.tsx:118`,
  `src/features/workout/SetScreen.tsx:197` ("Last time" line).
- **Locale-file sites** are themselves untranslated:
  `domain:highlight.effortSeconds` and `plan:dayDetail.secondsEffort`
  are byte-identical `s` across all three locales; zh-CN translates the
  unit correctly in `workout:sessionSummary.topSeconds` (`秒`) but not
  these — internal inconsistency proving the correct form was known.
zh-CN is the real defect (French bare `s` is a defensible SI symbol).
*Fix:* code sites → `t('progress:unit.reps', {count})` etc. + values
through `Intl.NumberFormat`; locale sites → retranslate the two keys.
**Sequencing:** the locale-file half must land **before or with A14**,
or A14's new accessible names get modelled on the broken key and ship
the untranslated unit a third time.

### I7 — Label/value and list joins hardcode English punctuation (4 sites)
The project already rules on this: `plan:import.schemaErrorWithPath`
punctuates per-locale (en `": "`, fr `" : "`, zh-CN `"："`). Four sites
bypass it:
1. `src/features/today/TodayPage.tsx:303` — the amber eyebrow, **visible
   on Today every training day**; zh-CN gets ASCII spaces around the
   middot, the exact failure `PlanPage.tsx:230` documents and
   `Intl.ListFormat` was adopted to fix.
2. `src/features/today/SessionPreview.tsx:116,120` — visible line.
3. `SessionPreview.tsx:37` — aria-label.
4. `src/ui/RatingPicker.tsx:35` — aria-label on every check-in pill.
*Fix:* a `common:labelValue` key following the existing per-locale
punctuation, and `Intl.ListFormat` for joins (as `PlanPage.tsx:226`).

---

## 3. Minor

- **I4** — `src/ui/Stepper.tsx:116` `toFixed(1)` renders `.` in French;
  reached with decimals at `MeasurementCard.tsx:74` (kg) and `:82` (cm).
  French needs `82,5`. The `Intl.NumberFormat` machinery already exists
  (`i18next.ts:72`); the stepper isn't wired to it.
- **I5** — `fr:workout.json sessionSummary.topSetLine` keeps English
  "top" (zh-CN localized to `最佳`). Shows after every workout. **Owner
  call on wording** — see §5.
- **I6** — Volume "k" abbreviation (`WeeklyReviewCard.tsx:76`,
  `SessionSummary.tsx:138`) is Western; Chinese groups by 万. Use
  `Intl.NumberFormat(locale, {notation:'compact'})` (fixes decimal too).
- **A9** — `<h2>` inside `<button>`: `CheckInCard.tsx:126-134`,
  `MeasurementCard.tsx:48-60` — heading absorbed into button name, lost
  from heading nav.
- **A10** — Stepper `<output>` is a `role="status"` live region;
  press-and-hold repeats at 140 ms (`Stepper.tsx:55,35`) → ~7
  announcements/sec. Debounce or announce on release.
- **A11** — Hold-timer elapsed count unreachable to SR
  (`HoldTimer.tsx:41-58`); mitigated because the Stepper pre-fills on
  stop.
- **A12** — Redundant region names duplicate their own heading:
  `ProgressPage.tsx:69/77/135`, `LibraryPage.tsx:59`, `PlanPage.tsx:112`.
  Use `aria-labelledby` or drop the section label.
- **A13** — Workout Mode has no `main` landmark
  (`WorkoutPage.tsx:129-155`, renders outside AppShell); rest phase has
  zero headings (see A3).
- **A14** — Prescription strings read as punctuation soup to SR:
  `SessionPreview.tsx:112-121`, `StrengthCard.tsx:50` — `60→65→70` is
  announced "60 right arrow 65…", `8–10` becomes "8 10". **Distinct from
  I7:** same lines, different defect. i18n correctly ruled these symbols
  are locale-neutral (no key needed); this is a screen-reader text
  alternative, visible glyphs unchanged. Both ship independently; do
  not close one with the other. The SR alternative is user-facing prose
  and **must be keyed** — zh-CN takes `_other` only or
  `localeParity.test.ts:59` fails, and its seconds wording must come
  from `topSeconds`, not the I3-broken keys.

---

## 4. Systemic guard (highest leverage — land with I1)

The recurring shape across I1, I3, I7 is **not** "a missing
translation": the correct key exists in all three locales, is consulted
at one render site, and a second site hardcodes the value instead. This
is exactly where the shipped weekdayActivities bug lived. Neither
existing test can catch it — the orphan sweep proves no key is *dead*,
`localeParity.test.ts` proves no key is *missing*, but nothing proves
every site that *should* ask for a key does.

**Add a lint/test asserting no seed-object field (`.name`/`.focus`/
`.title`/`.cues`/`.note`/`.label`) is read directly in `src/features/**`
outside `src/i18n/`.** That set should be empty; it currently has
exactly one member (I1). Land the guard *with* the I1 fix — otherwise
the next instance ships the same way this one did.

Secondary: `localeParity.test.ts` compares key families and plural
categories only, not values. 17 fr and 4 zh-CN strings are
byte-identical to English; most are legitimate loanwords (`kg`, "Tempo
3-1-1", proper nouns), but I5 is a real miss no test catches. Consider
an identical-to-English detector with an explicit allowlist so
intentional loanwords are declared, not indistinguishable from
oversights.

---

## 5. Owner decisions — RULED 27 Jul

- **I1 underlying — RULED: show name *and* focus on resume.** The
  reviewers' "wrong field" suspicion was half right: the variable is
  misnamed (`sessionName` holds `.focus`), but titling with focus is
  already consistent with the training-day hero
  (`TodayPage.tsx:302-304`, `title={sessionFocus}`). The real gap is
  that the session *name* never appears when resuming, so the day's
  identity is lost — contrary to the coach's "every training day has
  a clear identity" principle that M8's weekday-pinned sessions
  exist to serve. The resume hero becomes:
  eyebrow `In progress · Chest & Back`, title `Push & pull foundation`.
  Both values go through `useSessionName` / `useSessionFocus`.
- **I5 wording — RULED: `meilleure série`.** Parallels the zh-CN
  `最佳` and keeps the French locale internally consistent (the
  register is otherwise fully French). Renders as
  `3 séries · meilleure série 60 kg × 8`.

*(An earlier open question — the French "reps" loanword — was withdrawn
during review: `topReps` is the sole exception among a dozen consistent
uses of "répétitions", so it's an oversight to fix, not a ruling. It's
folded into I3-adjacent cleanup, no owner call needed.)*

---

## 6. Verified clean (negative results worth keeping)

- **Domain purity:** zero React/i18next imports in `src/domain/**`;
  every error path returns a `MessageDescriptor`.
- **weekdayActivities fix is complete** at all three render sites
  (`TodayPage.tsx:587`, `PlanDayPage.tsx:271`, `PlanPage.tsx:149`) —
  render bodies checked, not just hook calls.
- **Focus management on navigation, the modal focus trap,
  `prefers-reduced-motion` (every Framer surface), visible focus, list
  semantics, heading order, accessible names** — all verified sound;
  see the a11y pass. No hardcoded-English aria-labels anywhere.
- **Glossary compliance:** zh `活动度` (zero `灵活性`); fr `tu`
  throughout (zero `vous`); terminology stays "readiness"/état/状态.
- **Locale key orphans:** zero (cross-confirmed by two reviewers).

## 7. Not completed

The dead-code review's **non-locale scope was never delivered** —
unused exports in `src/domain/`/`src/lib/`, stale docs in `docs/**`
(incl. whether `docs/Training.md` fully shed its RIR/A-B content), dead
test fixtures, and leftover shims are **unaudited**. The locale-key
slice (zero orphans) is the only part that completed. Worth a follow-up
pass before assuming that scope is clean.
