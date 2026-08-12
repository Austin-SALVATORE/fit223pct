import type { EquipmentProfile } from './types'

/**
 * Equipment profile fixtures, shared between `equipment.test.ts` (whose
 * own assertions they exist to support) and
 * `mesocycle2Build.conformance.test.ts` (whose buildability guard reuses
 * them rather than re-transcribing `docs/EquipmentProfile.md` a second
 * time). Extracted into this non-test module so that no test file ever
 * imports another test file — `mesocycle2Build.conformance.test.ts`
 * previously imported straight from `equipment.test.ts`, which caused
 * Vitest to execute equipment.test.ts's entire describe/it tree a
 * second time as a side effect of that import, silently doubling every
 * count in that file (found during Phase 1 claim-verification, 12 Aug
 * 2026 — the true baseline was 99 files / 1269 tests, not 1270, and
 * this file's own historical "16 refs" grep count was actually 19
 * occurrences on 17 lines).
 */

/**
 * `docs/EquipmentProfile.md`, measurement-complete 7 Aug 2026, **retired
 * 12 Aug 2026** by the equipment upgrade (see `NEW_PROFILE` below for the
 * current hardware). Kept, not deleted: this is the only two-bore
 * profile in the suite, and `equipment.ts`'s cross-set matching branch
 * (`:153-157`) has no other fixture that exercises it — the
 * "cross-set matching is a distinct code path" describe block in
 * `equipment.test.ts` exists to prove that branch is load-bearing (D6).
 */
export const RETIRED_PROFILE_2026_08_07: EquipmentProfile = {
  handleKg: 1.2,
  plateSets: [
    {
      plates: [
        { weightKg: 1.0, count: 4 },
        { weightKg: 1.25, count: 4 },
        { weightKg: 2.5, count: 4 },
      ],
      handleCount: 2,
      // Sleeve weight rating, owner-measured 7 Aug ~19:00 — supersedes an
      // earlier 4-plate count-cap placeholder. 15kg/side sits above Set
      // A's own physical max (9.5kg/side, one handle drawing everything),
      // so it is non-binding for this set — see the "sleeve cap" describe
      // block in equipment.test.ts, which proves that rather than
      // assuming it.
      maxSideKg: 15,
    },
    {
      plates: [
        { weightKg: 1.0, count: 8 },
        { weightKg: 2.0, count: 4 },
      ],
      handleCount: 2,
      // Set B's own physical max is exactly 8.0kg/side — this rating is
      // non-binding too, for the same reason.
      maxSideKg: 8,
    },
  ],
  confirmedAt: '2026-08-07',
}

/**
 * The current hardware (12 Aug 2026 equipment upgrade) — two 2 kg
 * adjustable handles sharing one plate pool (8×1 kg, 4×2 kg, 4×5 kg)
 * plus a 7.75 kg barbell drawing the same pool (`.claude/rules/program-content.md`).
 * One bore, unlike `RETIRED_PROFILE_2026_08_07` above.
 */
export const NEW_PROFILE: EquipmentProfile = {
  handleKg: 2,
  barKg: 7.75,
  plateSets: [
    {
      plates: [
        { weightKg: 1, count: 8 },
        { weightKg: 2, count: 4 },
        { weightKg: 5, count: 4 },
      ],
      handleCount: 2,
    },
  ],
}
