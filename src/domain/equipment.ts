import type { EquipmentProfile, PlateSet } from './types'

/**
 * Ordered (ascending), duplicate-free achievable loads — one list per
 * exercise shape (coach ruling ⑥, `docs/EquipmentProfile.md`). **List
 * position is the coach's step unit; never treat the numeric gap between
 * entries as a step size** — the "standing rules" section of that doc
 * forbids it explicitly, and the real profile's gaps are irregular
 * (0.5–2.5 kg) precisely because the hardware is irregular.
 */
export interface AchievableLoads {
  /** Loads buildable as two handles matched in total weight — composition may differ across the pair (ruling ②/⑦, a flagged-permitted edge). */
  readonly bilateral: readonly number[]
  /** Loads buildable on one handle alone, unconstrained by needing a matching partner (ruling ⑥). */
  readonly singleImplement: readonly number[]
  /**
   * Total bar weight buildable on `EquipmentProfile.barKg`, drawing the
   * same plate pool `singleImplement` draws — symmetric loading reuses
   * `singleHandleWeightsQ` rather than a second enumeration (12 Aug 2026
   * hardware upgrade). Empty when the profile has no `barKg`.
   */
  readonly barbell: readonly number[]
}

// Plate weights in this app are always multiples of 0.25kg. Quantizing to
// quarter-kg integers keeps the subset-sum enumeration exact — the
// alternative, summing kg floats across thousands of additions, drifts.
const Q = 4

type CountVector = readonly number[]

/** Every count vector 0..count per plate type — the full space of ways to draw from one inventory. */
function countVectors(plates: PlateSet['plates']): CountVector[] {
  return plates.reduce<CountVector[]>(
    (acc, plate) => acc.flatMap((prefix) => Array.from({ length: plate.count + 1 }, (_, count) => [...prefix, count])),
    [[]],
  )
}

function totalWeightQ(plates: PlateSet['plates'], cv: CountVector): number {
  return cv.reduce((sum, count, i) => sum + count * Math.round(plates[i].weightKg * Q), 0)
}

/**
 * `PlateSet.maxSideKg` converted to the quarter-kg units the enumeration
 * works in — `null` when the set has no sleeve rating on record, meaning
 * unconstrained.
 */
function maxSideWeightQ(plateSet: PlateSet): number | null {
  return plateSet.maxSideKg != null ? Math.round(plateSet.maxSideKg * Q) : null
}

/**
 * The boundary validator (plan Phase 2, R3). Enumeration is a subset-sum
 * over every plate type's count, and an unconstrained inventory blows
 * that space up combinatorially — the architect's own prototype measured
 * 415,233 subsets at 1163ms for a much larger inventory than any real
 * profile. Real profiles are tiny (the owner's Set A is 5×5×5=125
 * vectors, Set B 9×5=45); this cap sits well below the point where
 * enumeration becomes slow, so it throws on a pathological profile
 * instead of silently hanging on one.
 */
const MAX_SUBSET_SPACE = 50_000

function validatePlateSetSize(plateSet: PlateSet): void {
  const space = plateSet.plates.reduce((product, plate) => product * (plate.count + 1), 1)
  if (space > MAX_SUBSET_SPACE) {
    throw new RangeError(
      `Plate set has ${space} possible count vectors, over the ${MAX_SUBSET_SPACE} enumeration cap — refusing to enumerate.`,
    )
  }
}

/**
 * Every weight one handle can reach drawing this set's *full* inventory
 * alone. Composition-symmetric (both sides of a handle load identically
 * — the L2 model, plan §1.1), so only count vectors splittable evenly
 * across the two sides are valid. `maxSideQ` is the set's sleeve rating
 * in quarter-kg (a single handle's one side is half its total usage
 * here, since `cv` covers both sides combined); `null` leaves it
 * unconstrained.
 */
function singleHandleWeightsQ(plates: PlateSet['plates'], maxSideQ: number | null): Set<number> {
  const out = new Set<number>()
  for (const cv of countVectors(plates)) {
    if (!cv.every((count) => count % 2 === 0)) continue
    if (maxSideQ !== null && totalWeightQ(plates, cv) / 2 > maxSideQ) continue
    out.add(totalWeightQ(plates, cv))
  }
  return out
}

/**
 * Every per-handle weight achievable as a *matched bilateral pair* drawn
 * from this one set — ruling ②/⑦: the two handles need only match in
 * total weight, composition may differ across the pair. Enumerates every
 * valid one-side composition (already the true weight of one side here,
 * unlike `singleHandleWeightsQ`'s full-handle `cv` — `maxSideQ` applies
 * directly), pairs any two (including a composition with itself) whose
 * per-side weight matches, and keeps the pair only if both handles'
 * combined plate usage still fits the set's own inventory — the two
 * handles draw from the same physical pool at once.
 */
function bilateralPairWeightsQ(plates: PlateSet['plates'], maxSideQ: number | null): Set<number> {
  const sides: { cv: CountVector; weightQ: number }[] = []
  for (const cv of countVectors(plates)) {
    if (!cv.every((count, i) => count * 2 <= plates[i].count)) continue
    const weightQ = totalWeightQ(plates, cv)
    if (maxSideQ !== null && weightQ > maxSideQ) continue
    sides.push({ cv, weightQ })
  }

  const pairs = new Set<number>()
  for (let i = 0; i < sides.length; i++) {
    for (let j = i; j < sides.length; j++) {
      if (sides[i].weightQ !== sides[j].weightQ) continue
      const combinedUsage = sides[i].cv.map((count, k) => count * 2 + sides[j].cv[k] * 2)
      if (combinedUsage.every((count, k) => count <= plates[k].count)) pairs.add(sides[i].weightQ * 2)
    }
  }
  return pairs
}

function toKg(weightQ: number, handleKg: number): number {
  return Math.round((handleKg + weightQ / Q) * 100) / 100
}

function computeAchievableLoads(profile: EquipmentProfile): AchievableLoads {
  // A set with no handle assigned to it contributes nothing physical —
  // exclude it before enumerating rather than enumerating and discarding.
  const usableSets = (profile.plateSets ?? []).filter((set) => set.handleCount >= 1)
  for (const set of usableSets) validatePlateSetSize(set)

  // Each set carries its own sleeve rating (maxSideKg) — there is no
  // profile-wide cap, since different bores can have different hardware.
  const perSetSingle = usableSets.map((set) => singleHandleWeightsQ(set.plates, maxSideWeightQ(set)))
  // A set with only one handle assigned physically cannot supply a
  // same-set matched pair — only one handle exists for that bore.
  const perSetBilateral = usableSets.map((set) =>
    set.handleCount >= 2 ? bilateralPairWeightsQ(set.plates, maxSideWeightQ(set)) : new Set<number>(),
  )

  const singleQ = new Set<number>()
  for (const setWeights of perSetSingle) for (const weightQ of setWeights) singleQ.add(weightQ)

  const bilateralQ = new Set<number>()
  for (const setWeights of perSetBilateral) for (const weightQ of setWeights) bilateralQ.add(weightQ)

  // Cross-set matched pairs: one handle from each of two distinct sets,
  // each drawing its own set's full inventory, matched by weight. No
  // combined-inventory check — the two sets never share a plate bore, so
  // there is nothing to fit into a shared pool.
  for (let i = 0; i < usableSets.length; i++) {
    for (let j = i + 1; j < usableSets.length; j++) {
      for (const weightQ of perSetSingle[i]) if (perSetSingle[j].has(weightQ)) bilateralQ.add(weightQ)
    }
  }

  // T4: an implement weight this module invents is worse than no list at
  // all — the same defect class `EquipmentProfile`'s own doc warns about
  // (a handle off by a quarter kg makes every prescribed integer
  // unreachable). Never default either `handleKg` or `barKg`; each
  // implement's list is zeroed independently so a bar-only profile still
  // yields a barbell list, and a handle-only profile still yields
  // dumbbell lists.
  const { handleKg, barKg } = profile
  const bilateral = handleKg != null ? [...bilateralQ].map((q) => toKg(q, handleKg)).sort((a, b) => a - b) : []
  const singleImplement = handleKg != null ? [...singleQ].map((q) => toKg(q, handleKg)).sort((a, b) => a - b) : []
  // The bar draws the same `singleQ` set a lone dumbbell handle draws —
  // symmetric loading is symmetric loading, whichever implement carries
  // it (D1, plan §0.2/§1).
  const barbell = barKg != null ? [...singleQ].map((q) => toKg(q, barKg)).sort((a, b) => a - b) : []

  return { bilateral, singleImplement, barbell }
}

// Memoised by profile object identity. This codebase's immutability rule
// means any edit to a profile produces a new object, which naturally
// misses this cache — no manual invalidation, and nothing here persists
// the derived list to storage (architecture.md: derived lists are never
// stored).
const cache = new WeakMap<EquipmentProfile, AchievableLoads>()

/**
 * The achievable-load enumerator (`~/.claude/plans/equipment-aware-progression.md`
 * Phase 2). Pure domain function — no UI, no call-site wiring; nothing
 * downstream reads this yet.
 *
 * **Plate sets never mix** — each `PlateSet` is one physically distinct
 * bore (see that type's own doc). `bilateral` unions three sources:
 * same-set matched pairs from every set, plus cross-set pairs where one
 * handle draws each set's full inventory and the two happen to match in
 * weight. `singleImplement` is the union of every set's own
 * single-handle list, which is always the larger list — a lone implement
 * is never constrained by needing a matching partner.
 */
export function achievableLoads(profile: EquipmentProfile): AchievableLoads {
  const cached = cache.get(profile)
  if (cached) return cached

  const result = computeAchievableLoads(profile)
  cache.set(profile, result)
  return result
}

/**
 * The strict round-down floor (ruling ③: "Global tie-break: always round
 * down... applies everywhere, not just the Deload"). Returns the largest
 * achievable value at or below `target`, or `null` when nothing in
 * `loads` reaches that low — never "nearest with ties rounding up".
 */
export function nearestAchievableLower(target: number, loads: readonly number[]): number | null {
  let best: number | null = null
  for (const load of loads) {
    if (load <= target && (best === null || load > best)) best = load
  }
  return best
}
