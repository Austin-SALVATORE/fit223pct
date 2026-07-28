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

## Out of scope (deliberate)

Logging or tracking of any kind; progression across sessions; user-
authored routines; the other three recovery activities; anything on
training days. Routines are content the app plays, not data it
accumulates.

## Open — needs the coach

The routine's actual content: which stretches, hold duration, order,
which are per-side, and what cue each one needs. The Library's
existing vocabulary does not cover stretches, so this is new content
and each item will need art.
