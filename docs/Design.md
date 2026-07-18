# Design

Personality: calm, premium, confident, encouraging, minimal. Editorial warmth —
a beautifully crafted training journal, not a SaaS dashboard. Never military.

## Color

Warm dark foundation. Tokens live in `src/ui/tokens.css` (source of truth).

- Background: deep warm charcoal (hue ~30°, not blue-black).
- Surfaces: slightly lifted warm grays; borders are subtle, not lines everywhere.
- Text: warm off-white, high contrast (AA+ on all surfaces).
- Accent: restrained amber/gold — used sparingly (primary action, today marker).
- Success: muted sage — subtle, never confetti-green.
- No neon. No gradients-for-decoration.

## Typography

- Display: large, confident headings (fluid clamp sizes), tight tracking.
- Body: system font stack v1 (fast, no FOUT); revisit a serif/display pairing
  for editorial moments in the polish milestone.
- Numbers (load, reps, timer): tabular numerals always.

## Layout

- Mobile-first, single column, generous whitespace, max-width ~28rem centered
  on desktop (a phone product that respects the laptop).
- Bottom navigation, thumb-reachable. Large touch targets (min 44px).
- Today is home. Workout mode is full-screen, chrome-free.

## Motion

- Purpose only: set completion confirmation, rest timer, screen transitions,
  progress reveals. Nothing decorative.
- Durations 150–350 ms, ease-out bias. Springs for completion moments.
- `prefers-reduced-motion` honored globally — animations collapse to fades/none.

## Navigation

There is no tab bar. Today is the app; everything else supports it.
The library is reached from exercise rows and a quiet header link — it
supports the workout, it doesn't compete with it. Workout mode is a
full-screen takeover with no chrome. Navigation is reintroduced only if a
future surface genuinely earns top-level status.

## Workout mode

Organizing idea: **one decision at a time**. The screen always shows exactly
one thing — the current set. Everything else is quiet context.

- **Set screen**: exercise name, set position, last time's numbers, and the
  progression suggestion as a one-line coaching voice. Weight/reps steppers
  (hold to repeat, huge tabular numerals) and an RIR control, all pre-filled
  from the progression engine — logging a normal set is one tap.
- **Rest screen**: countdown ring, +30s / skip, what's next — and this is
  where coaching lives: technique cues and the exercise's teaching concept
  appear during rest, when there is time to read. Education never interrupts.
- **Position is derived from logged data**, never held in UI state: every set
  writes through immediately, so killing the app mid-session and reopening
  resumes at the exact set.
- **Swap** opens a bottom sheet of substitutions; provenance is recorded.
- **Completion**: duration, sets, volume, per-exercise progression one-liners.
  Sage, not confetti. "Nice work." — then Today shows the day as done.

## Voice

Encouraging, plain, brief. "Nice work." not "CRUSHED IT 💪🔥".
Never guilt. A missed day is acknowledged quietly, never punished.
