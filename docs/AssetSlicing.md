# Asset slicing — the defect, the mechanism, and the rule

**Found 29 Jul** by the owner, on a phone, looking at one exercise.
Fixed in `fb896a7` and `74bca95`. This document exists because the
mechanism is not obvious from the code and the rule that follows from
it is not obvious from the mechanism.

## What was wrong

A reference strip holds several poses side by side;
`scripts/convert-assets.mjs` slices it into frames. Both slicing paths
were broken, in different ways.

- **Gutter mode** selected the `frames-1` **widest** interior gaps
  rather than the ones nearest the expected boundaries. When a strip
  had a wide gap *inside* a pose — a cable machine standing apart from
  the athlete — that gap outranked a real boundary. This is what broke
  `cable-rear-delt-fly`: its frames were `[181, 468, 752, 462]`, where
  the 181px frame was the machine with no athlete in it and the 752px
  frame held two. Corrected to `[477, 453, 484, 462]`.
- **The `min-ink` fallback** picked whichever column was locally
  thinnest **with no threshold at all**, so it would cut straight
  through a figure. On `single-leg-hip-thrust` four of five cuts landed
  on columns carrying 15–16 opaque pixels — through the ankle, which is
  the thinnest part of an extended leg. The shoe ended up flush against
  the next frame's edge, which is what the owner saw.

`slice()` then trims each frame to its opaque content and pads
`FRAME_PAD` 40px per side; when content sits at the cut, the pad
collapses to zero and the orphan lands hard against the frame edge.

## What could not be fixed in code

**43 of 120 assets cannot be sliced correctly at all**, because the
poses physically touch in the source render. Measured, not assumed:
widening the search window fixes 0 of 43 — no column anywhere within a
full frame-width window has ink below tolerance. Union-find over the
alpha mask collapses `pull-up`, `bird-dog`, `front-squat` and
`bench-dip` to a **single cluster** where they need six. There is
nothing to separate on.

Those 43 are enumerated in `UNSAFE_SLICE_ALLOWLIST` with the count in a
comment, and the list is **self-clearing**: an id that starts slicing
cleanly fails the build until it is removed. The check covers both the
gutter and fallback paths — an earlier version guarded only the
fallback, which would have silently failed to clear exactly the assets
that got fixed, since re-rendered art with proper gaps lands in gutter
mode.

## The rule, and why the obvious rule was already there

`_templates/prompt.template.md` **already** required "clear background
gaps between them. No figure overlaps, touches, or is cropped by
another." That line entered in `d0b4fbb` (22 Jul) — the same commit
that generated all 112 strips — and **every one of the 43 carries it
verbatim**, identical to the eight clean recovery-stretch prompts.

So the rule was stated in every prompt and not honoured. Re-running the
same prompt would likely reproduce the defect. **Wording is not the
lever.**

**Crowding is.** Failure rate by poses per strip:

| poses | ≈ px per pose | broken | rate |
|---|---|---|---|
| 2 | 930 | 0 / 10 | 0% |
| 3 | 638 | 2 / 2 | 100% *(n=2, ignore)* |
| 4 | 474 | 9 / 47 | 19% |
| 6 | 319 | 32 / 61 | 52% |

The eight clean stretch assets are 2-pose at ~930px each. At ~319px the
model crowds poses regardless of instruction.

### The re-render requirement is horizontal separation, not "no overlap"

**Discovered on the pilot, 30 Jul, and it is stricter than the template
says.** `bench-dip` came back with four poses that genuinely do not
touch — verified by zoomed crop, a shoe beside a bench at different
heights — and it still could not be sliced.

Its four objects sit at x 23-476, 476-928, 921-1374, 1372-1825.
**Consecutive pairs overlap in x by 1, 8 and 3 px.** At every boundary
the number of clean background columns is **zero**; the thinnest carry
10, 26 and 21 opaque pixels.

Two measurements, both correct, answering different questions:

- *Do the figures touch?* No — they are vertically separated.
- *Is there a background column to cut on?* No.

**A vertical cut cannot separate objects whose x-ranges overlap, however
far apart they are vertically.** Only the second question is the one
slicing has to answer.

So the brief for a re-render must demand **no shared x between poses**,
not merely that figures do not overlap. A 1px x-overlap is invisible to
the eye and invisible to a touch test, and it is precisely what a
generator aiming for "no overlap" produces at the edges.

`bench-dip` remains allowlisted. Its current frames are an improvement
on what they replace — 4-pose art in 4 frames rather than 4-pose art in
6 — but they are **not correct**, and the record should not soften that.

### Owner ruling, 29 Jul: **four poses per strip, maximum.**

This is a ~2/3 reduction in failure rate, **not a guarantee** — expect
roughly one regeneration in five to still crowd and need a retry. That
is acceptable now and would not have been last week, because the guard
refuses a crowded strip instead of shipping it: failures are visible
and retryable rather than silent.

Fewer poses per exercise is a product consequence, not a side effect —
a movement shown in four steps instead of six. Accepted knowingly.

## A third defect class, which the fix does not cover

`cable-row` was first read as containing four poses against a declared
six, and the owner ruled the count corrected to 4. **That ruling was
withdrawn — the first measurement was wrong.**

The art contains **six** poses. Connected components on the alpha
channel, independently confirmed at two thresholds:

```
308x486 at x=31     area 59140
317x489 at x=348    area 58485
298x491 at x=665    area 57914
296x489 at x=980    area 58063
303x489 at x=1272   area 58135
307x487 at x=1588   area 58618
```

Six objects at near-identical scale — one athlete rendered six times.
`Number of frames: 6` is correct. The earlier count came from merging
components by x-overlap, which collapses any two figures that touch;
the merged output was 309, 616, 596, 308 px, and **two clusters being
double the others was visible in that output and read past**.

**Poses 2 and 3 touch at x=665; poses 4 and 5 overlap** (pose 4 ends at
1276, pose 5 begins at 1272). So two of the five true boundaries have
no background column at all.

Gutter mode still finds five qualifying gutters — 343, 840, 971, 1161,
1581 — but **840 and 1161 sit inside poses**, in the gaps between one
figure's own limbs. Every cut lands on genuine background; none of
those two is a frame boundary. One athlete is split across two frames
while another frame holds two.

### The class this exposes

**Gutter mode can select a background column that is not a frame
boundary.** The thresholded fallback never fires here, because nothing
is being cut through ink. Nearest-to-expected selection helps but
cannot conjure a gutter where none exists.

Correcting the count to 4 would have cut at 343, 971, 1581 — all clean
background — leaving frames 2 and 3 holding two athletes each. The
original complaint, made worse and permanent.

**The detectable signature is lopsided frame widths**: sliced widths
deviating materially from `stripWidth / frames`. cable-row came out
`[343, 628, 610, 333]` against an expected ~478. A width-evenness check
would have caught it, and may catch siblings among the other 62
gutter-mode assets.

cable-row therefore belongs **with the 43** — touching poses needing a
re-render with real gaps — not with a metadata correction.

## What this cost, and the cheapest thing that would have caught it

The fallback had been guessing since it was written. Nothing failed,
nothing warned, and the frames looked plausible. It surfaced only
because the owner looked at one exercise on a phone and noticed a shoe
detached from a leg.

The general lesson is in `.claude/rules/verification.md`: a silent
fallback is worse than a loud failure, because a wrong answer that
looks ordinary stops anyone else from checking. The fix that mattered
most was not the selection change — it was making an unslicable asset
refuse rather than guess.
