/**
 * Published constants for the energy baseline, with their citation, units,
 * population and **the strength of the provenance** beside each value.
 *
 * They live in one module because CLAUDE.md forbids fabricated scientific
 * claims, and a misremembered citation is worse than an invented number: it
 * arrives wearing a source. Keeping the numbers and their provenance in the
 * same place means a future reader changing a constant sees what they are
 * changing it away from.
 *
 * The verification pass that produced this file corrected three of the four
 * things it examined. That is recorded here rather than in a commit message,
 * because each correction is the kind a reader would otherwise "fix" back.
 */

/**
 * Mifflin–St Jeor (1990) — **resting energy expenditure**, not basal
 * metabolic rate. The paper measured REE by indirect calorimetry; calling
 * the output "BMR" is a consumer imprecision repeated widely enough to read
 * as correct. Use the accurate term in code; in copy, say "the energy your
 * body uses at rest" and skip the acronym entirely.
 *
 *   male:   10·kg + 6.25·cm − 5·age + 5
 *   female: 10·kg + 6.25·cm − 5·age − 161
 *
 * Units are **kilograms, centimetres, years** — not imperial, not metres.
 *
 * Population: n=498, ages 19–78, **including 234 obese subjects**, so it is
 * validated beyond lean adults. Frankenfield 2005 (JADA 105(5):775–789)
 * flags older adults and US ethnic minorities as underrepresented — noted
 * because this app's current user is neither and a future one might be.
 *
 * Provenance: **AJCN full text is paywalled.** Equation verified from the
 * PubMed abstract plus two independent implementations, DOI confirmed to
 * resolve. Stronger than triangulation, weaker than having read the paper.
 */
export const MIFFLIN = {
  weightCoefficient: 10,
  heightCoefficient: 6.25,
  ageCoefficient: -5,
  maleConstant: 5,
  femaleConstant: -161,
} as const

/**
 * Cunningham (1991) — REE from lean body mass.
 *
 *   370 + 21.6 × leanBodyMassKg
 *
 * **Cited as Cunningham, not Katch–McArdle.** The popular name comes from a
 * textbook restatement rather than a derivation by those authors; it is
 * mentioned here only because it is what a reader will search for.
 *
 * Cunningham JJ, *Am J Clin Nutr* 1991;54(6):963–969,
 * doi:10.1093/ajcn/54.6.963.
 *
 * Weaker provenance than Mifflin in a way worth stating: the 1991 paper is
 * itself a research synthesis, not a fresh empirical derivation, and its
 * full text is likewise paywalled.
 *
 * The "within 10% for 82% of nonobese, 70% of obese" accuracy figure that
 * circulates with this equation belongs to **Frankenfield 2005**, an
 * independent validation, and is near-universally miscredited to the
 * original. It is not asserted anywhere in this codebase; this note exists
 * so it is not added wrongly later.
 */
export const CUNNINGHAM = {
  constant: 370,
  leanMassCoefficient: 21.6,
} as const

/**
 * Physical activity level (PAL) bands — FAO/WHO/UNU (2001), derived from
 * doubly-labelled-water studies. Figures taken from the report's own text.
 *
 * **The familiar 1.2 / 1.375 / 1.55 / 1.725 / 1.9 scale is not used, because
 * it has no source.** It appears in no textbook table, agency guideline or
 * paper; every occurrence traces to a fitness calculator repeating it
 * uncited. It is the number every competing app uses, and it is a convention
 * propagated by repetition.
 *
 * The disagreement is material, not cosmetic: FAO puts a sedentary Western
 * lifestyle at a modal PAL of ~1.60 where the convention says 1.2. At a
 * ~1,650 kcal REE that is a gap of roughly **660 kcal/day** — larger than
 * every other uncertainty in this milestone combined, including the choice
 * between Mifflin and Cunningham.
 *
 * **The caveat travels with the bands.** PAL is derived from *total* daily
 * expenditure including all non-exercise movement; the fitness convention's
 * "sedentary" is defined more narrowly. The two play the same arithmetic
 * role but may not measure the same construct, and the published material
 * does not settle it.
 *
 * Bands are ranges, which is why maintenanceKcal returns a range: collapsing
 * one into a point would manufacture precision the source does not have.
 */
export const PAL_BANDS = {
  sedentary: { min: 1.4, max: 1.69 },
  active: { min: 1.7, max: 1.99 },
  vigorous: { min: 2.0, max: 2.4 },
} as const

export type PhysicalActivityLevel = keyof typeof PAL_BANDS

/** Stable order for presentation — lightest first. */
export const PAL_ORDER: readonly PhysicalActivityLevel[] = ['sedentary', 'active', 'vigorous']
