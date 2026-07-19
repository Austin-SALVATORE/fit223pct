# UI Acceptance Checklist

Run this exploratory pass before closing any milestone. Logic bugs get caught
by tests; these are the UX bugs that are only visible by *using* the app.
Automated coverage is not a substitute for this pass.

## Interaction states (desktop, mouse)

- [ ] Hover every interactive element on every changed screen — backgrounds
      must respect their container's geometry (first/last rows of grouped
      lists are the classic failure).
- [ ] Active/pressed states respect the same geometry.
- [ ] Hover target and click target are identical.

## Keyboard

- [ ] Tab through every changed screen: focus-visible ring on every
      interactive element, never clipped by containers.
- [ ] Enter/Space activates buttons and rows.
- [ ] Focus order follows visual order.

## Navigation

- [ ] Enter every screen from **every** possible origin; Back returns to the
      actual origin.
- [ ] Direct-URL every route: safe fallback, no crash, sensible back target.
- [ ] Browser back/forward behaves at every step.
- [ ] Refresh mid-flow (especially mid-workout): state is preserved.

## Layout

- [ ] Mobile (~390px) and desktop widths.
- [ ] No horizontal overflow at 390px on any changed screen — check every
      row that pairs a fixed-width label with a fixed-width control
      (`document.documentElement.scrollWidth > clientWidth` catches it fast).
      A DOM/unit test cannot see this; only a rendered screenshot or live
      measurement can. (Regression class: CheckInCard's RatingPicker row
      overflowed the card at 390px — fixed by stacking label above picker,
      the same pattern SetScreen's RirPicker already used correctly.)
- [ ] First and last items of every list/group.
- [ ] Longest seeded content (names, notes) — no truncation that destroys meaning.

## Console

- [ ] Zero errors and zero warnings across the whole pass.

## Reduced motion

- [ ] OS reduced-motion on: no movement-based animation remains, flows still work.
