import { describe, expect, it } from 'vitest'
import { achievableLoads, nearestAchievableLower } from './equipment'
import { NEW_PROFILE, RETIRED_PROFILE_2026_08_07 } from './equipment.fixtures'
import type { EquipmentProfile } from './types'

describe('achievableLoads — retired two-bore profile (docs/EquipmentProfile.md, retired 12 Aug 2026)', () => {
  it('computes the exact bilateral list', () => {
    expect(achievableLoads(RETIRED_PROFILE_2026_08_07).bilateral).toEqual([
      1.2, 3.2, 3.7, 5.2, 5.7, 6.2, 7.2, 8.2, 8.7, 9.2, 10.7, 11.2, 13.2, 15.2,
    ])
  })

  it('computes the exact single-implement list', () => {
    expect(achievableLoads(RETIRED_PROFILE_2026_08_07).singleImplement).toEqual([
      1.2, 3.2, 3.7, 5.2, 5.7, 6.2, 7.2, 7.7, 8.2, 8.7, 9.2, 10.2, 10.7, 11.2, 12.7, 13.2, 13.7, 15.2, 15.7, 16.2,
      17.2, 17.7, 18.2, 20.2,
    ])
  })

  it('reaches the bilateral ceiling at 15.2 kg and the single-implement ceiling at 20.2 kg (sleeve-weight amendment, 7 Aug ~19:00)', () => {
    const { bilateral, singleImplement } = achievableLoads(RETIRED_PROFILE_2026_08_07)
    expect(bilateral.at(-1)).toBe(15.2)
    expect(singleImplement.at(-1)).toBe(20.2)
  })

  it('is memoised by profile object identity — same object returns the same array reference', () => {
    const first = achievableLoads(RETIRED_PROFILE_2026_08_07)
    const second = achievableLoads(RETIRED_PROFILE_2026_08_07)
    expect(second).toBe(first)
  })

  it('does not reuse the cache for a structurally-identical but distinct profile object', () => {
    const clone: EquipmentProfile = { ...RETIRED_PROFILE_2026_08_07, plateSets: RETIRED_PROFILE_2026_08_07.plateSets!.map((s) => ({ ...s })) }
    const original = achievableLoads(RETIRED_PROFILE_2026_08_07)
    const clonedResult = achievableLoads(clone)
    expect(clonedResult).not.toBe(original)
    expect(clonedResult).toEqual(original)
  })
})

describe('achievableLoads — cross-set matching is a distinct code path (retired two-bore profile)', () => {
  /**
   * Verified against the shipped algorithm (scratchpad
   * `cross-check-weightcap.mjs`, 7 Aug 2026): 11.2, 13.2, and — since the
   * sleeve-weight amendment retired the old count cap — 15.2 kg only
   * appear in the real profile's bilateral list because Set A and Set
   * B's single-handle lists happen to intersect at those weights (15.2 is
   * a 7.0kg/side match: Set A reaches it with 4 plates, Set B with 5 —
   * verified against `check-152-composition.mjs`). Neither set alone can
   * build a same-set matched pair at any of the three. Removing the
   * second set removes them, proving the cross-set branch is
   * load-bearing rather than redundant with same-set pairing.
   */
  it('produces 11.2, 13.2, and 15.2 kg only when both sets are present', () => {
    const bothSets = achievableLoads(RETIRED_PROFILE_2026_08_07).bilateral
    expect(bothSets).toContain(11.2)
    expect(bothSets).toContain(13.2)
    expect(bothSets).toContain(15.2)

    const setAOnly: EquipmentProfile = { ...RETIRED_PROFILE_2026_08_07, plateSets: [RETIRED_PROFILE_2026_08_07.plateSets![0]] }
    const oneSetBilateral = achievableLoads(setAOnly).bilateral
    expect(oneSetBilateral).not.toContain(11.2)
    expect(oneSetBilateral).not.toContain(13.2)
    expect(oneSetBilateral).not.toContain(15.2)
  })
})

describe('achievableLoads — per-set sleeve weight cap (maxSideKg, retired two-bore profile)', () => {
  /**
   * The owner's actual measurement: sleeve rating is a *weight* per side,
   * not a plate count, and it differs per set (15kg/side A, 8kg/side B).
   * Both ratings sit at or above each set's own physical plate supply
   * (A maxes at 9.5kg/side, B at exactly 8.0), so for the real profile
   * the cap is non-binding — proved here by showing it changes nothing
   * versus no cap at all, rather than assumed from the doc.
   */
  it('is non-binding for the real profile — identical lists with the caps removed', () => {
    const uncapped: EquipmentProfile = {
      ...RETIRED_PROFILE_2026_08_07,
      plateSets: RETIRED_PROFILE_2026_08_07.plateSets!.map((set) => ({ ...set, maxSideKg: null })),
    }
    expect(achievableLoads(uncapped)).toEqual(achievableLoads(RETIRED_PROFILE_2026_08_07))
  })

  /**
   * A genuine, low `maxSideKg` on a synthetic fixture, to prove the bound
   * is actually enforced rather than a field nothing reads (the real
   * profile alone can't show this, since its own ratings never bind).
   * 16×1.0kg plates, handleCount 2, no cap vs. maxSideKg=2 — verified in
   * scratchpad `synthetic-cap-check.mjs`: uncapped bilateral reaches
   * [0,2,4,6,8], uncapped single reaches [0,2,4,6,8,10,12,14,16]; capped
   * at 2kg/side both collapse to [0,2,4].
   *
   * Red-first, run 7 Aug 2026: bypassed the cap in `equipment.ts` by
   * hardcoding both `maxSideWeightQ` call sites to `null` in
   * `computeAchievableLoads`, re-ran this suite — the two assertions
   * below failed (bilateral/singleImplement both grew past [0,2,4] to
   * include 6 and 8), confirming the cap is load-bearing. Reverted.
   */
  it('a synthetic low maxSideKg genuinely excludes loads a bare cap-free enumeration would include', () => {
    const cappedProfile: EquipmentProfile = {
      handleKg: 0,
      plateSets: [{ plates: [{ weightKg: 1.0, count: 16 }], handleCount: 2, maxSideKg: 2 }],
    }
    const { bilateral, singleImplement } = achievableLoads(cappedProfile)
    expect(bilateral).toEqual([0, 2, 4])
    expect(singleImplement).toEqual([0, 2, 4])

    const uncappedProfile: EquipmentProfile = {
      ...cappedProfile,
      plateSets: [{ ...cappedProfile.plateSets![0], maxSideKg: null }],
    }
    const uncapped = achievableLoads(uncappedProfile)
    expect(uncapped.bilateral).toEqual([0, 2, 4, 6, 8])
    expect(uncapped.singleImplement).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16])
  })
})

describe('achievableLoads — current hardware (NEW_PROFILE, 12 Aug 2026 equipment upgrade)', () => {
  it('computes the exact bilateral list — 2..20 kg in 2 kg steps', () => {
    expect(achievableLoads(NEW_PROFILE).bilateral).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
  })

  it('computes the exact single-implement list — 2..38 kg in 2 kg steps', () => {
    expect(achievableLoads(NEW_PROFILE).singleImplement).toEqual([
      2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38,
    ])
  })

  it('computes the exact 19-rung barbell list — 7.75 (bare bar) to 43.75 (whole pool) in 2 kg steps', () => {
    expect(achievableLoads(NEW_PROFILE).barbell).toEqual([
      7.75, 9.75, 11.75, 13.75, 15.75, 17.75, 19.75, 21.75, 23.75, 25.75, 27.75, 29.75, 31.75, 33.75, 35.75, 37.75,
      39.75, 41.75, 43.75,
    ])
  })

  /**
   * NEG-A (mandatory, plan §2 Phase 1): the correct bilateral answer is a
   * suspiciously clean 2,4,...,20 — indistinguishable from a hardcoded
   * list without this control. Red-first, run 12 Aug 2026: replaced
   * `computeAchievableLoads`'s bilateral branch with the literal
   * `[2,4,6,8,10,12,14,16,18,20]`, re-ran this suite against the profile
   * below (5 kg plates removed) — the assertion failed, reporting the
   * hardcoded 20 kg ceiling instead of the true 10 kg one. Reverted;
   * failure quoted in the phase report.
   */
  it('NEG-A: dropping the 5 kg plates collapses bilateral to [2,4,6,8,10]', () => {
    const noFivePlates: EquipmentProfile = {
      ...NEW_PROFILE,
      plateSets: [
        { ...NEW_PROFILE.plateSets![0], plates: NEW_PROFILE.plateSets![0].plates.filter((p) => p.weightKg !== 5) },
      ],
    }
    expect(achievableLoads(noFivePlates).bilateral).toEqual([2, 4, 6, 8, 10])
  })

  /**
   * NEG-bar (mandatory, plan §2 Phase 1) — T4's "never default an
   * implement weight" contract, extended to the bar. Red-first, run
   * 12 Aug 2026: dropped the `barKg != null` guard so `barbell` mapped
   * `singleQ` unconditionally, re-ran with `barKg: null` — the barbell
   * assertion failed, returning the 19-rung list instead of `[]`.
   * Reverted; failure quoted in the phase report.
   */
  it('NEG-bar: barKg null empties barbell while bilateral/singleImplement are unaffected', () => {
    const noBar: EquipmentProfile = { ...NEW_PROFILE, barKg: null }
    const result = achievableLoads(noBar)
    expect(result.barbell).toEqual([])
    expect(result.bilateral).toEqual(achievableLoads(NEW_PROFILE).bilateral)
    expect(result.singleImplement).toEqual(achievableLoads(NEW_PROFILE).singleImplement)
  })

  /**
   * NEG-bar-weight (mandatory, plan §2 Phase 1). Red-first, run
   * 12 Aug 2026: hardcoded the barbell mapping's `toKg` call to the
   * literal `7.75` regardless of `profile.barKg`, re-ran with
   * `barKg: 20` — the assertion failed, still returning the 7.75-based
   * ladder. Reverted; failure quoted in the phase report.
   */
  it('NEG-bar-weight: barKg 20 shifts every rung to 20,22,24,... — barKg is read, not a constant', () => {
    const heavierBar: EquipmentProfile = { ...NEW_PROFILE, barKg: 20 }
    expect(achievableLoads(heavierBar).barbell).toEqual([
      20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56,
    ])
  })
})

describe('T1 — enumerator reads the inventory (own guard, synthetic fixture)', () => {
  /**
   * Plan §1.1's own worked example: a single mixable pool (Set A + Set B
   * merged, since T1's spec was written before the no-mix ruling existed)
   * with a 2.0kg placeholder handle. The real 1.2kg-handle profile does
   * NOT reproduce this exact fixture's numbers (verified in scratchpad
   * `t1-check.mjs` — the side-sum needed for 5kg differs), so this test
   * uses its own clean fixture matching the plan's literal wording,
   * deliberately separate from the real-profile tests above.
   *
   * Red-first, run 7 Aug 2026: with the 1.5kg plate absent, this test
   * passed (5 correctly absent). Adding it and re-running is the
   * negative control below — confirmed to fail if the enumerator ever
   * stops reading `plates` (e.g. a hardcoded weight list).
   */
  const baseMixedSet: EquipmentProfile['plateSets'] = [
    {
      plates: [
        { weightKg: 1.0, count: 12 },
        { weightKg: 1.25, count: 4 },
        { weightKg: 2.0, count: 4 },
        { weightKg: 2.5, count: 4 },
      ],
      handleCount: 2,
    },
  ]

  it('does not reach 5kg with the base inventory', () => {
    const profile: EquipmentProfile = { handleKg: 2.0, plateSets: baseMixedSet }
    expect(achievableLoads(profile).bilateral).not.toContain(5)
  })

  it('negative control: adding a 1.5kg x4 plate makes 5kg achievable', () => {
    const withExtraPlate: EquipmentProfile = {
      handleKg: 2.0,
      plateSets: [{ plates: [...baseMixedSet![0].plates, { weightKg: 1.5, count: 4 }], handleCount: 2 }],
    }
    expect(achievableLoads(withExtraPlate).bilateral).toContain(5)
  })
})

describe('T2 — bilateral symmetry constraint (own guard, isolated fixture)', () => {
  /**
   * Plan §5's own spec: `{2.5kg×4}` bilateral → `[handle, handle+5]`;
   * negative control `{2.5kg×3}` collapses to bare handle only, because
   * a matched pair needs 4 plates total (2 per handle, 1 per side each)
   * and 3 cannot supply that. handleKg=0 isolates the plate arithmetic
   * from the handle-weight addition tested separately by T4.
   */
  it('a 4-plate inventory of 2.5kg produces [0, 5] as a matched bilateral pair', () => {
    const profile: EquipmentProfile = {
      handleKg: 0,
      plateSets: [{ plates: [{ weightKg: 2.5, count: 4 }], handleCount: 2 }],
    }
    expect(achievableLoads(profile).bilateral).toEqual([0, 5])
  })

  it('negative control: a 3-plate inventory cannot supply a matched pair beyond bare handles', () => {
    const profile: EquipmentProfile = {
      handleKg: 0,
      plateSets: [{ plates: [{ weightKg: 2.5, count: 3 }], handleCount: 2 }],
    }
    expect(achievableLoads(profile).bilateral).toEqual([0])
  })
})

describe('T4 — handle weight is never defaulted (assigned by name, plan post-execution note)', () => {
  /**
   * Deferred from Phase 1 to Phase 2 by agreement (plan post-execution
   * note) and assigned to this implementer explicitly by the current
   * brief, overriding the plan's general "someone other than the
   * implementer" authorship principle for this one guard. Red-first
   * evidence: `computeAchievableLoads` in `equipment.ts` was temporarily
   * edited from `if (profile.handleKg == null) return { bilateral: [],
   * singleImplement: [] }` to `const handleKg = profile.handleKg ?? 2.0`
   * (dropping the early return), this suite re-run, and both assertions
   * below failed exactly as expected — quoted in the shipping commit's
   * report — before the edit was reverted.
   */
  it('a profile missing handleKg yields empty lists rather than a defaulted one', () => {
    const profile: EquipmentProfile = {
      plateSets: [{ plates: [{ weightKg: 2.5, count: 4 }], handleCount: 2 }],
    }
    const { bilateral, singleImplement } = achievableLoads(profile)
    expect(bilateral).toEqual([])
    expect(singleImplement).toEqual([])
  })

  it('null handleKg is treated the same as absent', () => {
    const profile: EquipmentProfile = {
      handleKg: null,
      plateSets: [{ plates: [{ weightKg: 2.5, count: 4 }], handleCount: 2 }],
    }
    expect(achievableLoads(profile).bilateral).toEqual([])
  })
})

describe('achievableLoads — handle-count gating', () => {
  it('a set with fewer than 2 handles contributes to singleImplement but never a bilateral pair — only one handle physically exists', () => {
    const profile: EquipmentProfile = {
      handleKg: 1.0,
      plateSets: [{ plates: [{ weightKg: 2.5, count: 4 }], handleCount: 1 }],
    }
    const { bilateral, singleImplement } = achievableLoads(profile)
    expect(singleImplement).toContain(6) // 1.0 handle + 2 plates/side x 2.5kg = 6kg, one handle alone
    // Not even the bare-handle weight qualifies as "bilateral" here — a
    // matched pair needs two handles to exist at all, and this profile's
    // only plateSet has one. With no second set to cross-match against,
    // the bilateral list is empty, not [1].
    expect(bilateral).toEqual([])
  })

  it('a set with zero handles contributes to neither list', () => {
    const profile: EquipmentProfile = {
      handleKg: 1.0,
      plateSets: [{ plates: [{ weightKg: 2.5, count: 4 }], handleCount: 0 }],
    }
    expect(achievableLoads(profile)).toEqual({ bilateral: [], singleImplement: [], barbell: [] })
  })
})

describe('achievableLoads — boundary validator (R3)', () => {
  it('throws rather than enumerating a pathologically large plate set', () => {
    const oversized: EquipmentProfile = {
      handleKg: 1.0,
      plateSets: [
        {
          plates: Array.from({ length: 6 }, (_, i) => ({ weightKg: i + 1, count: 10 })),
          handleCount: 2,
        },
      ],
    }
    // 11^6 ≈ 1.77M count vectors, well over the 50,000 cap.
    expect(() => achievableLoads(oversized)).toThrow(RangeError)
  })

  it('the real profile is well within the cap and never throws', () => {
    expect(() => achievableLoads(RETIRED_PROFILE_2026_08_07)).not.toThrow()
  })
})

describe('nearestAchievableLower', () => {
  const loads = [1.2, 3.2, 5.2]

  it('returns the largest achievable value at or below the target', () => {
    expect(nearestAchievableLower(4, loads)).toBe(3.2)
    expect(nearestAchievableLower(5.2, loads)).toBe(5.2)
  })

  it('returns null when nothing is achievable that low', () => {
    expect(nearestAchievableLower(1, loads)).toBeNull()
  })
})
