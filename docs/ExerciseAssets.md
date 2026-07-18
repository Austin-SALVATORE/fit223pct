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
