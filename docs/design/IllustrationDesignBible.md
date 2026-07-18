# Illustration Design Bible

This is the governing standard for Fit223 exercise illustrations. It defines
how every exercise asset is specified, generated, reviewed, converted,
optimized, and prepared for future motion or 3D work.

Use this document as the entry point. The detailed subsystem rules live in:

| System | Owns |
|---|---|
| [Exercise Camera System](ExerciseCameraSystem.md) | Approved viewpoints and camera selection |
| [Character System](CharacterSystem.md) | Body model, identity, clothing, diversity strategy |
| [Equipment System](EquipmentSystem.md) | Equipment forms, scale, taxonomy, simplification |
| [Composition System](CompositionSystem.md) | Canvas, framing, margins, readability |
| [Color and Lighting System](ColorAndLightingSystem.md) | Semantic color roles, lighting, contrast |
| [SVG Specification](SVGSpecification.md) | Structured SVG requirements and naming |
| [Motion Readiness](MotionReadiness.md) | Static asset requirements for later animation |
| [Prompt System](PromptSystem.md) | Reusable prompt architecture and templates |
| [Asset Pipeline](AssetPipeline.md) | Workflow, gates, status transitions, review ownership |
| [Illustration QA Checklist](IllustrationQAChecklist.md) | Human review checklist and sign-off rubric |

The existing [Exercise Asset Strategy](../ExerciseAssets.md) remains the
high-level product strategy. This bible is the implementation standard.

## Decision Priority

When rules conflict, resolve them in this order:

1. Correct exercise technique.
2. Consistency across the asset library.
3. Product usability in the mobile workout flow.
4. SVG readiness.
5. Motion readiness.
6. Image-generation compatibility.
7. Future scalability.

Do not optimize for a single beautiful image. Optimize for a coherent library
of hundreds of assets that can be reviewed, revised, animated, and shipped.

## Scope

The system covers:

- Primary exercise illustrations.
- Muscle highlight overlays.
- Source raster references used for SVG production.
- Prompt files used to generate or revise references.
- Metadata for review, status, taxonomy, and asset provenance.
- Future Lottie, Rive, and 3D handoff requirements.

The system does not cover:

- Random downloaded exercise artwork.
- Photographic exercise content.
- Marketing illustration.
- Decorative app backgrounds.
- Runtime implementation of the asset resolver.

No generated artwork should be committed as part of this bible.

## Repository Path

Exercise assets use the existing app convention:

```text
public/assets/exercises/
  README.md
  _templates/
    metadata.template.json
    prompt.template.md
    qa.template.md
```

The implementation brief described `assets/exercises/`. This project already
documents `public/assets/exercises/` in `docs/ExerciseAssets.md`, and the app is
an offline-capable static PWA. Public assets can be bundled and precached
without adding a second path convention. If the team later needs editable source
files that should not ship, create a separate `design-sources/` area only after
documenting that source-to-public build step.

## Core Principles

### Correctness Over Beauty

An illustration with correct joint positions, stance, grip, range of motion,
and equipment orientation is preferable to a more polished image that teaches
the wrong movement. Incorrect technique is a product defect.

### Consistency Over Creativity

The user should feel that every asset came from the same system. Variation is
allowed only when it serves exercise recognition or accessibility. Character
features, equipment forms, lighting, camera angle, stroke behavior, and
composition must not drift exercise by exercise.

### Recognition Over Realism

The asset should make the movement recognizable quickly at mobile size.
Muscle striations, garment folds, surface texture, and gym environments are
removed unless they directly support instruction.

### Simplicity Over Decoration

Every extra visual detail increases generation variance, SVG cleanup, QA time,
and animation cost. Simplify until the exercise remains clear and no further.

### Product Asset Over Artwork

These illustrations belong inside a workout interface. They must support
learning, scanning, accessibility, theming, and offline delivery.

## Visual Directions

Fit223 should validate three visual directions before scaling the library.
Direction A is the recommended default unless testing shows a better fit.

| Direction | Description | Advantages | Disadvantages | SVG fit | Motion fit | Inconsistency risk | Recommended use |
|---|---|---|---|---|---|---|---|
| A: Minimal Human Diagram | Simplified figure, clean geometry, minimal face, neutral identity, product-diagram feel | Highest consistency, fastest review, easiest SVG conversion, least identity lock-in, strongest thumbnail readability | Can feel less premium if proportions or lines are too plain | Excellent | Excellent | Low | Default for the library, workout mode, muscle overlays |
| B: Premium Editorial Character | Softer character, warmer personality, moderate detail, closer to premium wellness illustration | More emotionally appealing, stronger brand distinctiveness | Harder to keep consistent, more cleanup, identity and clothing drift risk | Medium | Medium | High | Select onboarding or education surfaces after core library stabilizes |
| C: Semi-Technical Fitness Illustration | More anatomical clarity, explicit joint readability, technical coaching posture | Better for advanced coaching and error comparison | Can become clinical, busier at thumbnail size, higher anatomy review burden | Good if controlled | Good for overlays and error states | Medium | Technique lessons, range-of-motion guides, advanced education |

Default decision: start with Direction A for the pilot set. It best satisfies
correctness, consistency, SVG readiness, and motion readiness. Direction B and C
should be tested as controlled alternatives, not mixed into the production
library without a documented product decision.

## Canonical Asset Types

| Asset | Required for first review | Ships in app | Notes |
|---|---:|---:|---|
| `metadata.json` | Yes | Yes | Source of truth for asset status and visual taxonomy |
| `prompt.md` | Yes | No decision yet | Required for repeatable generation and revision |
| `reference.png` | No | No | Approved raster reference for SVG production |
| `illustration.svg` | No | Yes | Primary production illustration |
| `muscles.svg` | No | Yes | Optional muscle highlight layer using the same body structure |
| `animation.lottie` | No | Yes | Optional motion asset; first frame must be valid as a static reference |
| `thumbnail.webp` | No | Yes | Derived from approved illustration, never independently styled |
| `qa.md` | Before approval | No decision yet | Review record copied from template |

The minimum useful exercise folder starts with `metadata.json` and `prompt.md`.
Visual assets are added only after review gates are passed.

## Status Model

Asset status is stored in `metadata.json`.

| Status | Meaning | Allowed next statuses |
|---|---|---|
| `planned` | Exercise asset has metadata and prompt intent only | `generated`, `deprecated` |
| `generated` | Raster candidate exists but has not passed review | `reviewed`, `planned`, `deprecated` |
| `reviewed` | Human review is complete; revisions may remain | `approved`, `generated`, `deprecated` |
| `approved` | Static raster reference is accepted for SVG production | `svg-ready`, `generated`, `deprecated` |
| `svg-ready` | SVG passes structure, naming, and visual QA | `motion-ready`, `deprecated` |
| `motion-ready` | Asset groups and pivots support animation | `deprecated` |
| `deprecated` | Asset should not be used for new UI surfaces | `planned` only with documented reason |

No asset moves forward automatically because an image generator produced an
attractive result. Each status requires the review evidence defined in
[Asset Pipeline](AssetPipeline.md).

## Pilot Validation Set

No full-library generation should begin until this set passes review:

| Exercise | Why it is in the pilot | Default camera candidate |
|---|---|---|
| Goblet Squat | Squat pattern, front-loaded free weight, stance readability | `three-quarter-front` |
| Dumbbell Bench Press | Bench setup, horizontal pressing, bilateral dumbbells | `bench-side` |
| Romanian Deadlift | Hip hinge, bar path, spine position | `side` |
| Lat Pulldown | Machine exercise, vertical pull, front torso visibility | `machine-three-quarter` |
| Overhead Press | Vertical press, overhead lockout, rib position | `three-quarter-front` |
| Bulgarian Split Squat | Unilateral lower-body, bench relationship, balance | `three-quarter-side` |
| Plank | Static hold, floor alignment, core bracing | `side` |
| Cable Row | Cable path, seated machine/cable setup, scapular retraction | `machine-three-quarter` |

The pilot must validate:

- All three visual directions against the same exercises.
- Front, side, three-quarter, bench, machine, unilateral, floor, and static-hold cases.
- Raster generation reliability.
- SVG conversion effort.
- Mobile thumbnail readability.
- Biomechanics review process.
- Metadata and QA templates.

## Approval Standard

An asset is production-ready only when:

- The pose passes biomechanics review.
- Camera angle follows the decision table.
- Character, clothing, equipment, color, and composition match this system.
- SVG structure preserves semantic groups needed for highlighting and motion.
- Metadata is complete and uses approved taxonomy values.
- The asset is readable at 64 px and on the workout screen.
- Provenance and rights are documented without inventing a license.

## Change Control

Changes to this system should be made before generating or revising assets at
scale. Update the owning subsystem document rather than scattering exceptions in
individual exercise folders.

Use this rule:

| Change type | Where to document |
|---|---|
| New camera value | `ExerciseCameraSystem.md` and metadata spec |
| New equipment form | `EquipmentSystem.md` |
| New character variant | `CharacterSystem.md` |
| New color role | `ColorAndLightingSystem.md` |
| New SVG group or ID pattern | `SVGSpecification.md` |
| New animation category | `MotionReadiness.md` |
| New asset workflow state | `AssetPipeline.md` and metadata spec |

Exercise-level exceptions belong in that exercise's `metadata.json` only after
the system-level rule exists.
