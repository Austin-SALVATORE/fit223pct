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

## Voice

Encouraging, plain, brief. "Nice work." not "CRUSHED IT 💪🔥".
Never guilt. A missed day is acknowledged quietly, never punished.
