# Recovery routines — guided stretching

**Status: specified, not designed.** This is the review contract. The
architecture is the architect's to propose; this document states what
must be true of it. Owner-requested 28 Jul.

## The problem

Recovery days list what to do and then leave you alone with it.
`ActivityItem` is `{ label, detail? }` and renders as inert text —
"Stretch — 10–15 minutes" tells you the intent and nothing about the
execution. A user who wants to stretch well has to already know how.

Meanwhile the app is very good at exactly this problem on training
days: one thing at a time, an illustration, a clear next step.
Recovery days get none of it.

## The milestone

**Recovery activity items become entry points.** Tapping "Stretching"
opens a guided routine — a sequence of stretches with illustrations,
each one shown and timed, the way Workout Mode shows one set at a
time.

**Stretching is the mandatory routine.** It is the one this milestone
delivers.

## Owner rulings (28 Jul)

1. **No completion tracking.** The routine guides and ends; nothing is
   written, nothing counted, no streak, no gap. This preserves M6's
   non-negotiable — recovery days never guilt you — and it is the
   ruling most likely to be eroded later by a well-meaning "wouldn't
   it be nice to see consistency". It would not be nice. Skipping
   stays free.
2. **Stretching only this milestone.** Mobility, foam rolling and
   walking stay as text. Prove the pattern before multiplying the art
   batch and the coach's authoring load.
3. **Auto-advance**, with a lead-in before each hold, plus pause,
   next, back, and leave-at-any-time. A routine that needs a tap
   between every stretch defeats itself when your hands are on the
   floor.
4. **Wake lock is in scope.** A hands-free routine means no touch
   input for ~10 minutes, so the screen sleeps exactly when the user
   needs to see the next stretch. Shipping without it would make the
   feature's own premise unusable. Workout Mode does not use it today
   and may adopt it later.
5. **Two illustrations per stretch** — entry pose and held pose. The
   lead-in shows entry, the display switches to the held pose when the
   timer starts, so the second frame has a job rather than being
   completeness for its own sake. Doubles the art batch, knowingly.

   **Qualified 29 Jul for one stretch.** `half-kneeling-hip-flexor-stretch`
   ships with two near-identical frames, accepted by the owner after
   three attempts. The reason generalises: an entry/held pair only
   reads where the two positions differ by **limb configuration** —
   heel loaded or not, hands on the floor or on the feet, hips raised
   or folded, ankle crossed or not. All of those landed in one or two
   attempts. A hip flexor stretch differs from its own setup by a
   pelvic tilt, which is close to invisible in a stylised side
   profile, so no prompt produces a distinguishable pair. It still
   ships two frames rather than one, because a single-frame asset
   would break the `frameCount >= 2` manifest assertion that guards
   every other step.

   **Decide this per stretch at brief time, before commissioning
   art.** Discovering it after three regenerations is what this
   batch paid for.

   **Enforced since 29 Jul** by `src/lib/routineAsset.coverage.test.ts`
   — "every routine step ships at least two frames" asserts
   `frameCount >= 2` in the manifest for every step id.

   It needed its own assertion because the rest of the coverage guard
   cannot see this: it checks that a step resolves art at all and that
   its id does not collide with a Library id, but `routineStepAsset`
   falls back to the entry frame when a held frame is missing — assets
   never block a feature. So a single-frame stretch degraded quietly
   to a still image, the player looked correct, and nothing went red.
   Near-identical frames still pass, and should:
   `half-kneeling-hip-flexor-stretch` ships two real frames, so it
   satisfies this honestly rather than by exemption — an exemption
   list here would be the hole the assertion exists to close.

   The end screen showing no number remains the invariant in this
   milestone that only people can hold.

## What must be true

- **A stretch routine is not a `Program` and not a Library exercise.**
  It has no weights, no sets, no progression, no logging. Forcing it
  into either shape would drag prescription and progression semantics
  into a place that must not have them. What it *is* — a new entity, a
  narrower variant, something else — is the architect's call.
- **Not every activity item leads somewhere.** "Complete rest is a
  fine choice too" must never look tappable. The affordance appears
  only where a routine exists, and its absence must read as normal
  rather than broken.
- **Content is the coach's.** Which stretches, how long each is held,
  the order, per-side or not — none of that is decided in this repo.
  The app provides the vehicle. (`.claude/rules/program-content.md`.)
- **The seeded-vs-imported rule holds.** Routine content that ships
  with the app is locale-keyed; anything a user authors renders
  verbatim. Storage stays locale-free.
- **Illustrations follow the established style.** Stretch poses are a
  new *category*, not a new visual language — same figure, same
  palette, same pipeline and QA gates as the exercise catalogue.
  Whether a held pose needs frames at all is an art-direction question
  for the owner, not a pipeline decision.
- **Accessibility is not an afterthought here.** A timed, auto-
  advancing sequence is exactly the shape that strands screen-reader
  users. Whatever the player looks like, it answers: what is happening,
  what do I do, what happens next — and it can be paused and left at
  any point.
- **Offline and local-first**, like everything else. No network at
  routine time.

## Device pass — ordered, and the order matters

Automated tests cannot reach any of this: jsdom has no display and no
power management, so every wake-lock test proves our *logic* is
correct given a model of the browser, never that the browser behaves
that way. Run these on a real device, in this order.

1. **Background the app mid-routine and return.** First, not last.
   It is the only step that can detect broken wake-lock
   re-acquisition, and it is invisible to every automated test. A
   documented iOS report (vueuse #3484, iPad 16.5) shows
   `NotAllowedError` on exactly this path — not on the initial
   request.
   - *If it fails:* no client-side redesign fixes it. The platform
     releases on hide however the lock was obtained, so returning
     always needs a fresh non-gesture request. Accept it, document
     it, and the routine simply behaves as it does today after the
     first background.
2. **Play a full routine untouched** and confirm the screen never
   sleeps.
   - *If the initial acquire fails:* the fix is acquiring on the
     starting tap and handing the sentinel to the player — contained
     to the hook's signature and one call site.
3. Repeat in **low-power mode**, and as an **installed PWA** as well
   as in-browser.
4. **Play a wall stretch and watch the wall** — chest or calf — at the
   moment the lead-in ends and the hold begins. A known defect ships
   here: the wall band shifts position and changes width between the
   two frames on all four wall assets, worst on `wall-chest-stretch`
   (43.8% → 25.4% of frame width).

   The cause is structural, not artistic. `slice()` in
   `scripts/convert-assets.mjs` trims each frame to its opaque content
   then pads `FRAME_PAD = 40` px per side. A wall sitting at the source
   strip's outer edge cannot be padded — there is nothing beyond it —
   so it lands flush; the same wall on the gutter-facing side of the
   other frame gets the full 40 px. Hence exactly one flush frame and
   one with a 37–40 px gap, in every wall asset. Four regeneration
   attempts could not beat it: the achievable target was 8–39 px of
   background in a ~1800 px source, under 2% of the width.

   It shipped because the visible effect lands on a deliberate
   transition rather than mid-motion, and because regenerating art
   cannot fix a pipeline constant. **If it reads badly on device, the
   fix is in `scripts/` — owner territory — not in another art batch.**
5. **Screen reader**: what VoiceOver actually utters at each play
   boundary, and whether auto-advance strands you. The tests prove
   focus target, `aria-describedby` wiring and `aria-live="off"`;
   they cannot prove what is spoken.

## Out of scope (deliberate)

Logging or tracking of any kind; progression across sessions; user-
authored routines; the other three recovery activities; anything on
training days. Routines are content the app plays, not data it
accumulates.

> **Scope narrowed 11 Aug 2026 (coach ruling, board answer, archived as
> `Stretching-Skip-State-Ruling-2026-08-11.md` in the validator's spec
> archive):** on **training days only**, the app may store a
> post-workout-stretching fact with three states — completed / skipped /
> unresolved — for historical accuracy. Stretching never gates day
> completion, and the fact carries no guilt, penalty, readiness,
> progression, or compliance meaning. This file's no-tracking rule
> continues to hold in full for recovery-day guided routines.

## Content — settled 28 Jul

The routine's content is
[programs/recovery-stretch-v1-coach-spec.md](./programs/recovery-stretch-v1-coach-spec.md):
eight static holds, six of them per-side, standing → kneeling → floor.
That spec is authoritative for stretch selection, hold durations,
order, per-side flags and cues; this document remains authoritative
for what must be true of the vehicle that plays it.

Three things worth carrying forward, because each one is a place where
the spec and the code disagree or where a reader would guess wrong:

- **The spec's total duration is wrong and the routine is right.**
  Ruling C computes one lead-in per *stretch* (8 × 8 s = 64 s). The
  player issues one per *play*, and `routinePlaylist` expands the six
  per-side steps into two plays each — 14 plays, 112 s of lead-in,
  547 s total (9:07), not the stated 8:20. Per-play is the behaviour
  we want: switching sides genuinely needs the repositioning time. The
  user-visible "8–10 min" card copy holds at 9:07, so the ruling's
  conclusion survives its arithmetic. Do not "correct" the routine to
  match the spec's number; `routines.ts` says so at the point of use.
- **Step ids follow the Library's spelling convention, not the coach's
  prose** — no digits, no apostrophes, hence `figure-four-glute-stretch`
  and `childs-pose`. Ids are the one part of the content this repo
  rules on; everything else is the coach's.
- **Per-side stretches reuse one pair of frames for both sides.** The
  player names the side in its heading rather than mirroring the art,
  so the illustration shows the left side — the side played first —
  and diverges only on the repeat. Mirroring is a render decision, not
  an asset one, and could be revisited without regenerating anything.
