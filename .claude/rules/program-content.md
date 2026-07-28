---
paths:
  - "src/data/seed/**"
  - "src/locales/**"
  - "docs/programs/**"
---

# Program and seed content

**The coach owns the training.** Exercise selection, loads, reps,
ladders, and progression philosophy are the owner's coach's domain —
never revised, second-guessed, or "improved" from this repo. What is
in scope is *structural* validation: ids that exist, schemas that fit,
equipment claims that hold, round-trips that survive.

- **Library ids are canonical.** A program may only reference an
  exercise that exists in `src/data/seed/exercises.ts`. Art existing
  for an id is not the same as the id being in the Library — art-only
  exercises must be promoted first (seed entry + en/fr/zh content).
- **Routine-step art is a distinct category and must NOT be promoted.**
  Stretches and other recovery-routine steps live in
  `src/data/seed/routines.ts` and carry art in the same asset tree,
  so the manifest contains entries with no Library entry *by design*.
  Promoting one into the Library would make it browsable, swappable,
  and prescribable into a training session — which is precisely what
  keeping routines out of the Library prevents. A manifest entry
  without a Library entry is a defect only for exercises.
- **Equipment tier is a hard constraint.** Phase 1 Home is adjustable
  dumbbells + bench, 15 kg per hand. A prescription exceeding the
  declared tier is a defect, not a preference.
- **Weights are per dumbbell**, for both single- and double-dumbbell
  lifts.
- **User content is never translated or shadowed.** Seeded content is
  locale-keyed; imported content (`origin: 'imported'`) renders
  verbatim. The seed-clobber guard exists because reseeding once
  reverted imported programs — do not weaken it.
- **Locale parity is enforced**: every new key lands in `en`, `fr`,
  and `zh-CN` together, in the register the glossaries fixed
  (`docs/I18n-glossary-fr.md`, `docs/I18n-glossary-zh.md`) — French
  `tu`, plain spoken Chinese, mobility is 活动度.
- Storage stays locale-free. Domain functions return message
  descriptors, never prose.
