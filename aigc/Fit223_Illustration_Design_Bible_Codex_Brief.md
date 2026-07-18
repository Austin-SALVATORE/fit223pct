# Fit223 Illustration Design Bible — Codex Implementation Brief

## Objective

Create and implement a complete, production-ready illustration design system for the Fit223 fitness application.

This is not a loose prompt guide.

It must function as a durable internal design bible that can guide:

- ChatGPT image generation
- Codex implementation
- Claude integration
- future human designers
- SVG production
- Lottie animation
- future 3D assets

The result should define one coherent visual language for an exercise library that may eventually contain 200+ movements.

The system must prioritize:

1. exercise correctness
2. visual consistency
3. scalability
4. maintainability
5. dark-mode compatibility
6. SVG readiness
7. future animation readiness

---

# Deliverables

Create the following documentation files inside the project:

```text
docs/
  design/
    IllustrationDesignBible.md
    ExerciseCameraSystem.md
    CharacterSystem.md
    EquipmentSystem.md
    CompositionSystem.md
    ColorAndLightingSystem.md
    SVGSpecification.md
    MotionReadiness.md
    PromptSystem.md
    AssetPipeline.md
    IllustrationQAChecklist.md
```

Also create:

```text
assets/
  exercises/
    README.md
    _templates/
      metadata.template.json
      prompt.template.md
      qa.template.md
```

If a design or docs directory already exists, integrate cleanly into the current structure rather than duplicating concepts.

---

# Core Design Philosophy

The documentation must establish the following principles.

## Correctness over beauty

An anatomically and biomechanically correct illustration is always preferable to a visually impressive but incorrect one.

## Consistency over creativity

Every asset should look as though it was created by the same illustrator, for the same product, under the same art direction.

## Recognition over realism

A user should recognize the exercise quickly.

The illustration should simplify details that do not improve recognition or instruction.

## Simplicity over decoration

Avoid visual complexity that harms scalability, conversion to SVG, animation, or consistency.

## Product asset over artwork

These illustrations belong inside a product interface.

They must support interaction, education, and navigation rather than behave like standalone poster art.

---

# Visual Direction

Define three candidate visual directions and document them clearly:

## Direction A — Minimal Human Diagram

Characteristics:

- highly simplified human figure
- minimal facial detail
- limited identity-specific features
- clean geometry
- instructional clarity
- easy SVG conversion
- highly scalable
- close to Apple Health / Apple Fitness diagram language

This should be treated as the leading candidate.

## Direction B — Premium Editorial Character

Characteristics:

- more expressive and human
- soft editorial styling
- moderate anatomy detail
- premium mobile product aesthetic
- inspiration from Nike Training Club, Freeletics, Headspace-style illustration systems

## Direction C — Semi-Technical Fitness Illustration

Characteristics:

- more anatomical clarity
- more explicit joint and movement readability
- balance between product illustration and technical coaching diagram
- suitable for advanced education surfaces

The bible must explain:

- advantages
- disadvantages
- scalability
- SVG suitability
- animation suitability
- risk of inconsistency
- recommended use cases

Do not silently choose one without explanation.

However, mark Direction A as the recommended default unless future testing shows otherwise.

---

# Character System

Define one default character system.

The character should function as an exercise carrier, not a celebrity or mascot.

Document:

- body proportions
- approximate height impression
- athletic level
- body-fat appearance
- muscle definition level
- facial-detail rules
- hair rules
- clothing rules
- footwear rules
- skin-tone strategy
- gender strategy
- future diversity strategy

Recommended baseline:

```text
Build: athletic, natural, not bodybuilder
Body fat appearance: approximately 15–18%
Proportions: realistic and neutral
Expression: neutral
Facial detail: minimal
Hair: simplified
Top: dark fitted athletic shirt
Bottom: dark neutral shorts
Shoes: light neutral training shoes
```

The bible must explicitly avoid overcommitting to a narrowly identifiable male character if that would make future expansion difficult.

Document how the system can later support:

- female characters
- different body types
- different skin tones
- accessibility representation
- user-selectable avatars

without forcing a full redesign.

---

# Camera System

Create a camera-angle decision system.

Every exercise must use one approved viewpoint.

Define at least:

- front
- side
- three-quarter front
- three-quarter rear
- top-down
- seated side
- bench side
- machine three-quarter

For each viewpoint, document:

- purpose
- when to use it
- when not to use it
- common examples
- visibility requirements
- equipment constraints
- joint-readability requirements

Create a decision table that maps movement families to default camera angles.

Include at least:

```text
Squat patterns
Hip hinges
Horizontal presses
Vertical presses
Horizontal pulls
Vertical pulls
Lunges
Carries
Core exercises
Isolation exercises
Machine exercises
Mobility drills
Static holds
```

Examples:

- Goblet squat → three-quarter front or front
- Romanian deadlift → side
- Dumbbell bench press → side or three-quarter side
- Lat pulldown → front or three-quarter front
- Bulgarian split squat → three-quarter side

Do not treat camera angle as an artistic choice per image.

It is a system rule.

---

# Composition System

Define a consistent composition framework.

Document:

- square canvas as default
- body occupancy range
- margin rules
- visual center
- equipment visibility
- cropping prohibition
- baseline alignment
- interaction-safe whitespace
- thumbnail readability
- mobile readability

Recommended starting framework:

```text
Canvas: 1:1
Character height: roughly 68–76% of canvas
Outer safe margin: at least 8%
Equipment: fully visible
No body-part cropping
No perspective distortion
No background environment
```

Document exceptions for:

- bench exercises
- machines
- long barbells
- floor exercises
- carries
- unilateral movements

---

# Equipment System

Create a standardized equipment language.

Document approved visual forms for:

- dumbbells
- barbells
- weight plates
- kettlebells
- benches
- racks
- cable machines
- selectorized machines
- resistance bands
- pull-up bars
- mats
- boxes
- medicine balls

Rules should prevent visual drift.

Examples:

- dumbbells should not randomly alternate between round, adjustable, chrome, and hex designs
- barbells should use one consistent shaft and plate style
- benches should use one consistent visual family
- cable machines should be simplified rather than brand-specific

Document:

- scale rules
- color rules
- level of detail
- when equipment may be simplified
- when equipment detail is essential for exercise recognition

---

# Color and Lighting System

Define a restrained palette.

Do not hard-code final brand colors if the product branding is still undecided.

Instead define semantic roles:

```text
Character primary
Character secondary
Skin range
Equipment dark
Equipment light
Accent
Instruction highlight
Warning
Background compatibility
```

Document:

- dark-mode compatibility
- light-mode fallback
- contrast expectations
- no dramatic lighting
- no cinematic effects
- no gradients unless explicitly approved
- very limited shadow usage
- consistent shadow direction if shadows exist

Include sample token names rather than only raw hex values.

For example:

```text
--illustration-character-primary
--illustration-character-secondary
--illustration-equipment-primary
--illustration-skin-1
--illustration-accent
```

The system should integrate with the application's existing design tokens where possible.

---

# SVG Specification

Create a production-oriented SVG standard.

Define required structure for future structured assets.

Recommended layer model:

```xml
<g id="character">
  <g id="head" />
  <g id="torso" />
  <g id="left-arm" />
  <g id="right-arm" />
  <g id="left-leg" />
  <g id="right-leg" />
</g>

<g id="equipment" />

<g id="motion-guides" />

<g id="muscle-highlights" />
```

Document:

- semantic group naming
- kebab-case naming
- viewBox requirements
- no embedded raster images
- no external fonts
- no external references
- no unnecessary filters
- path-count guidance
- accessibility title and description
- currentColor usage where appropriate
- stable IDs for animation
- consistent pivot and origin strategy
- preservation of meaningful groups during optimization

Explain that semantic structure is more important than extreme file-size minimization.

---

# Motion Readiness

Define how static illustrations should be prepared for future Lottie or Rive animation.

Document:

- joint pivots
- anchor points
- limb separation
- equipment separation
- reusable motion groups
- start and end pose expectations
- looping rules
- easing principles
- movement speed
- instructional timing
- avoiding decorative motion
- preserving biomechanical correctness

Define future motion categories:

```text
Static reference
Two-pose transition
Looped repetition
Range-of-motion guide
Error comparison
Muscle activation overlay
Breathing cue
Hold timer illustration
```

---

# Prompt System

Create a reusable prompt architecture for ChatGPT image generation.

The prompt system must include:

## Global style block

A stable style description used for every exercise.

## Character block

A stable character definition.

## Exercise block

Exercise-specific biomechanics and pose instructions.

## Composition block

Camera, framing, whitespace, and equipment rules.

## Technical block

Transparent background, full body, SVG-friendly, no text, no watermark.

## Negative block

Common failure exclusions.

Create templates for:

- standard standing exercise
- bench exercise
- seated exercise
- floor exercise
- machine exercise
- unilateral exercise
- static hold
- mobility drill
- technical coaching diagram

The prompt system must explicitly instruct the generator not to invent unsupported equipment or change character styling.

---

# Asset Folder Specification

Use kebab-case domain IDs.

Example:

```text
assets/exercises/goblet-squat/
  reference.png
  illustration.svg
  animation.lottie
  thumbnail.webp
  metadata.json
  prompt.md
  qa.md
```

Not every asset must exist initially.

The system must support progressive enhancement.

Define required and optional files.

Recommended:

```text
Required initially:
- metadata.json
- prompt.md

Optional:
- reference.png
- illustration.svg
- animation.lottie
- thumbnail.webp
- qa.md
```

---

# Metadata Schema

Create a documented metadata template.

Include at least:

```json
{
  "id": "goblet-squat",
  "displayName": "Goblet Squat",
  "movementPattern": "squat",
  "cameraAngle": "three-quarter-front",
  "equipment": ["dumbbell"],
  "primaryMuscles": ["quadriceps", "glutes"],
  "secondaryMuscles": ["adductors", "core"],
  "assetVersion": "1.0.0",
  "visualDirection": "minimal-human-diagram",
  "status": "planned",
  "license": {
    "type": "original-ai-assisted",
    "credits": []
  }
}
```

Document allowed statuses:

```text
planned
generated
reviewed
approved
svg-ready
motion-ready
deprecated
```

---

# Asset Pipeline

Document the complete workflow:

```text
Exercise definition
→ camera selection
→ prompt generation
→ ChatGPT image generation
→ visual review
→ biomechanics review
→ iteration
→ approved raster reference
→ SVG conversion
→ SVG cleanup
→ semantic grouping
→ optimization
→ application integration
→ future motion conversion
```

Define review gates.

No asset should move forward automatically after generation.

---

# QA Checklist

Create a rigorous human-review checklist.

Include:

## Biomechanics

- correct stance
- correct grip
- correct joint alignment
- neutral spine where appropriate
- correct range of motion
- correct equipment orientation
- no impossible anatomy
- no limb intersections
- no floating equipment
- no duplicated fingers or limbs
- no unstable balance

## Visual consistency

- same character system
- same clothing system
- same equipment language
- same palette
- same camera logic
- same composition rules
- same level of detail
- same shadow behavior

## Technical readiness

- transparent background
- full body visible
- equipment fully visible
- no text
- no watermark
- no embedded raster inside SVG
- correct viewBox
- semantic groups preserved
- file naming correct
- metadata complete

## Product usability

- readable at mobile size
- recognizable quickly
- not visually noisy
- dark-mode compatible
- no misleading technique

---

# Initial Validation Set

Before scaling, define a mandatory pilot set.

Use:

1. Goblet Squat
2. Dumbbell Bench Press
3. Romanian Deadlift
4. Lat Pulldown
5. Overhead Press
6. Bulgarian Split Squat
7. Plank
8. Cable Row

This set should test:

- front and side views
- standing and bench positions
- bilateral and unilateral movement
- free weights and machines
- dynamic and static exercise
- upper and lower body
- simple and complex equipment

The bible must state that no full-library generation should begin until this pilot set passes review.

---

# Implementation Requirements

Codex should:

1. inspect the current repository structure;
2. reuse existing naming conventions;
3. avoid duplicating current asset documentation;
4. create the deliverables listed above;
5. cross-link the documents;
6. create the folder and template structure;
7. keep the documentation practical and implementation-oriented;
8. avoid unnecessary marketing language;
9. keep terminology consistent;
10. add a short index page if needed.

Do not generate actual exercise artwork in this task.

Do not add third-party assets.

Do not invent licenses.

Do not modify application behavior unless a small integration seam or documentation link is necessary.

---

# Acceptance Criteria

The task is complete when:

- all design documents exist;
- they form one coherent system;
- they do not contradict each other;
- camera rules are explicit;
- character rules are explicit;
- equipment rules are explicit;
- SVG requirements are implementation-ready;
- prompt templates are reusable;
- metadata templates exist;
- QA templates exist;
- the pilot exercise set is defined;
- the asset pipeline is documented end to end;
- the repository remains clean;
- lint, tests, and build remain unaffected;
- no unnecessary runtime dependency is introduced.

At completion, report:

1. files created;
2. key design decisions;
3. assumptions made;
4. unresolved choices;
5. recommended next step for testing the three visual directions.
