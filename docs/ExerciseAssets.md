# Exercise Asset Strategy

Exercise assets are first-class project resources — governed like the design
system and the domain model, not downloaded ad hoc. **Consistency beats
quantity**: one coherent visual voice across every exercise, or the asset
doesn't ship.

## Philosophy

- Assets exist to improve understanding of movement — never decoration.
- One illustration style across the whole library. A single mismatched asset
  is worse than a missing one.
- Provider-agnostic: the app never depends on where an asset came from.
  Assets may be replaced, upgraded, or regenerated wholesale without touching
  UI or business logic.
- Never download random illustrations or animations during implementation.
  Assets enter the repo only through this pipeline, reviewed like code.
- Missing assets are a designed state, not an error: the UI renders cleanly
  with zero assets (as it does today) and upgrades progressively as assets land.

## Folder structure

One folder per exercise, keyed by the exercise's **domain id** (kebab-case —
the same id used in `src/domain` and Dexie; a second naming convention would
invite drift):

```
public/assets/exercises/
  bench-press/
    illustration.svg    # primary movement illustration
    muscles.svg         # highlighted muscle map
    animation.lottie    # optional movement loop
    thumbnail.webp      # small list/card preview
    metadata.json       # asset-level metadata (see below)
```

## Formats

| Asset        | Format        | Notes |
|--------------|---------------|-------|
| illustration | SVG           | flat, stroke-based, uses design tokens' palette |
| muscles      | SVG           | same base body template for every exercise |
| animation    | Lottie (.lottie) | optional; must respect `prefers-reduced-motion` |
| thumbnail    | WebP, 320px   | derived from illustration, never a photo |
| metadata     | JSON          | schema below |

No PNG illustrations, no photos, no mixed styles, no CDN-hosted assets
(offline-first — everything ships in the bundle or is precached).

## Naming

- Folder = exercise id, exactly (`romanian-deadlift/`, not `RDL/`).
- File names are fixed and lowercase as shown above — no variants, no suffixes.
- New asset kinds require updating this document first.

## metadata.json schema

Asset metadata complements (never duplicates conflicting) domain data. The
domain model in `src/domain` stays the source of truth for training logic;
metadata.json describes the *visual/coaching asset layer*:

```json
{
  "exerciseId": "bench-press",
  "version": 1,
  "primaryMuscles": ["chest"],
  "secondaryMuscles": ["triceps", "shoulders"],
  "equipment": ["barbell", "bench"],
  "difficulty": "beginner | intermediate | advanced",
  "alternatives": ["deficit-push-up", "db-floor-press"],
  "coachCues": ["…"],
  "commonMistakes": ["…"],
  "credits": { "source": "…", "license": "…" }
}
```

`credits` is mandatory — every asset must have a traceable origin and license.

## Quality bar

- SVGs: optimized (SVGO), no embedded rasters, no inline styles that fight
  the theme; must read clearly at 64 px and at full width on a phone.
- Consistent stroke weight, proportions, and body template across the library.
- Animations: ≤ 6 s loop, purposeful, legible at rest (first frame = a valid
  illustration).
- Every asset reviewed against these rules before merge — partial asset sets
  are fine, off-style assets are not.

## Code seam

UI accesses assets only through a single resolver (to be added with the first
real asset — no placeholder code before then):

```ts
exerciseAsset(exerciseId, kind) // → URL or null when absent
```

Components handle `null` by rendering the current asset-free layout. Because
every access goes through the resolver, swapping the entire asset library —
different provider, different format generation — is a content change.

## Evolution

1. **Now** — pipeline defined, zero assets, UI is asset-free by design.
2. **SVG era** — illustrations + muscle maps for the ~20 seeded exercises.
3. **Motion era** — Lottie/Rive loops for the workout screen (reduced-motion aware).
4. **Beyond** — 3D/volumetric models remain folder-per-exercise + metadata;
   the resolver contract absorbs new kinds without UI rewrites.

## Art backlog — parallel-bar redraw on the owner's station (23 Oct 2026): done

Athlete/coach ruling `docs/programs/parallel-bars-station-ruling-2026-10-23.md`
(and its photo follow-up): all three parallel-bar strips are redrawn to match
the athlete's **Decathlon Domyos TS 100**, two independent freestanding
height-adjustable bars, using the athlete's own photo as a second reference
image (`scripts/generate-images.mjs --ref`). The 21 Oct strips below drew a
generic station, a rectangular frame for the dip and the row and an arch for
the knee raise. The ruling rules out both: "not a connected rectangular frame
or an arch-shaped station". Mechanics and
a consistent structure across the three come first; branding is not drawn.
No cue or prescription changes to suit the art. Brief:
`docs/art/parallel-bar-station-redraw-brief-2026-10-23.md`.

Landed 23 Oct. The lead reviewed every candidate on a contact sheet and each pick at full size. Each
unit is an inverted-U grip on two adjustable uprights with pop-pins, and it
stands on two foot blocks laid end to end along the bar. The footing was read
from the photo crop enlarged 4×. Picks: `parallel-bar-dip` c1 and
`supported-knee-raise` c3 from round 1 (4 candidates each, 77 s for all 12).
`inverted-row` c2 comes from a second round of 6, because every first-round
row put the hands about 2× shoulder width apart. The coach rules hands at
about shoulder width; the pick measures about 1.3×, with near-parallel arms.
Reference image: the owner's photo, cropped from a screenshot of the coach
chat (246 × 310). The full-size original was requested and has not arrived.
The photo follow-up asks for the base geometry to match, so if the original
arrives, re-check the drawn feet against it. The
`credits` line in each `metadata.json` is still the converter's hard-coded
value; the true route is recorded in each `prompt.md`.

## Art backlog — parallel-bar movements (21 Oct 2026): done

Owner ruling `docs/programs/parallel-bars-product-ruling-2026-10-21.md` §3.
Landed 21 Oct, owner-approved, as **two-frame strips** drawn by
**`gpt-image-2.5-sunburst`** (quality `max`) through the Images edits
endpoint called directly, with the goblet-squat anchor as reference and
all candidates requested concurrently:

1. **`parallel-bar-dip`**: two-parallel-bar station, supported top and a
   controlled bottom. (`dip` remains the straight-bar dip.)
2. **`inverted-row`**: replaces the provisional machine-bar art; lying
   between the two bars of the freestanding station, one hand on each bar
   (grip confirmed by the coach, 23 Oct).
3. **`supported-knee-raise`**: straight-arm support, knees to hip height.
   At 64 px frame 1 can read as standing; frame 2 is unambiguous.

The same run closed the two oldest gaps, **`bicycle-crunch`** and
**`mountain-climber`**, by asking for one side only in two frames instead
of an alternating sequence.

**Why the route changed** (measured 21 Oct): the pinned route
(`gpt-5.6-sol` at high reasoning, renderer unset, one call at a time)
produced 0 passes in 11 generations over about 30 minutes, cutting the
first figure at the image edge and drawing supported poses as standing.
The direct sunburst route drew 15 candidates in 76 s of wall time and
passed all five movements. `chatgpt-image-latest` was twice as fast per
image but passed three of five and left a red cast-shadow smear that
survives chroma keying and that the converter's QA does not detect; it is
not used. Known gap: the converter still writes a hard-coded `credits`
line (`gpt-5.6-sol`, `2026-07-22`) into every `metadata.json`; the true
model is recorded in each `prompt.md`.
