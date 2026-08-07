import { describe, expect, it } from 'vitest'
import { achievableLoads, nearestAchievableLower } from './equipment'
import type { EquipmentProfile } from './types'

/**
 * `docs/EquipmentProfile.md`, measurement-complete 7 Aug 2026. Every
 * value here is owner-measured or coach-confirmed — the enumerator's
 * consumer-facing correctness rests on this fixture matching that
 * document exactly, not on any synthetic case below it.
 */
const REAL_PROFILE: EquipmentProfile = {
  handleKg: 1.2,
  maxPlatesPerSide: 4,
  plateSets: [
    {
      plates: [
        { weightKg: 1.0, count: 4 },
        { weightKg: 1.25, count: 4 },
        { weightKg: 2.5, count: 4 },
      ],
      handleCount: 2,
    },
    {
      plates: [
        { weightKg: 1.0, count: 8 },
        { weightKg: 2.0, count: 4 },
      ],
      handleCount: 2,
    },
  ],
  confirmedAt: '2026-08-07',
}

describe('achievableLoads — real profile (docs/EquipmentProfile.md)', () => {
  it('computes the exact bilateral list', () => {
    expect(achievableLoads(REAL_PROFILE).bilateral).toEqual([
      1.2, 3.2, 3.7, 5.2, 5.7, 6.2, 7.2, 8.2, 8.7, 9.2, 10.7, 11.2, 13.2,
    ])
  })

  it('computes the exact single-implement list', () => {
    expect(achievableLoads(REAL_PROFILE).singleImplement).toEqual([
      1.2, 3.2, 3.7, 5.2, 5.7, 6.2, 7.2, 7.7, 8.2, 8.7, 9.2, 10.2, 10.7, 11.2, 12.7, 13.2, 13.7, 15.2, 15.7, 16.2,
    ])
  })

  it('caps the bilateral ceiling at 13.2 kg and the single-implement ceiling at 16.2 kg', () => {
    const { bilateral, singleImplement } = achievableLoads(REAL_PROFILE)
    expect(bilateral.at(-1)).toBe(13.2)
    expect(singleImplement.at(-1)).toBe(16.2)
  })

  it('reaches none of the prescribed 5/6/8/10/12/14/15 kg exactly as a matched bilateral pair', () => {
    const { bilateral } = achievableLoads(REAL_PROFILE)
    for (const prescribed of [5, 6, 8, 10, 12, 14, 15]) {
      expect(bilateral).not.toContain(prescribed)
    }
  })

  it('maps every prescribed load to its nearest-lower achievable neighbour (ruling ③)', () => {
    const { bilateral } = achievableLoads(REAL_PROFILE)
    expect(nearestAchievableLower(5, bilateral)).toBe(3.7)
    expect(nearestAchievableLower(6, bilateral)).toBe(5.7)
    expect(nearestAchievableLower(8, bilateral)).toBe(7.2)
    expect(nearestAchievableLower(10, bilateral)).toBe(9.2)
    expect(nearestAchievableLower(12, bilateral)).toBe(11.2)
    expect(nearestAchievableLower(14, bilateral)).toBe(13.2)
    expect(nearestAchievableLower(15, bilateral)).toBe(13.2)
  })

  it('is memoised by profile object identity — same object returns the same array reference', () => {
    const first = achievableLoads(REAL_PROFILE)
    const second = achievableLoads(REAL_PROFILE)
    expect(second).toBe(first)
  })

  it('does not reuse the cache for a structurally-identical but distinct profile object', () => {
    const clone: EquipmentProfile = { ...REAL_PROFILE, plateSets: REAL_PROFILE.plateSets!.map((s) => ({ ...s })) }
    const original = achievableLoads(REAL_PROFILE)
    const clonedResult = achievableLoads(clone)
    expect(clonedResult).not.toBe(original)
    expect(clonedResult).toEqual(original)
  })
})

describe('achievableLoads — cross-set matching is a distinct code path (real profile)', () => {
  /**
   * Verified against the shipped algorithm (scratchpad `cross-check.mjs`,
   * 7 Aug 2026): 11.2 and 13.2 kg only appear in the real profile's
   * bilateral list because Set A and Set B's single-handle lists happen
   * to intersect at those weights — neither set alone can build a
   * same-set matched pair there. Removing the second set removes them,
   * proving the cross-set branch is load-bearing rather than redundant
   * with same-set pairing.
   */
  it('produces 11.2 and 13.2 kg only when both sets are present', () => {
    const bothSets = achievableLoads(REAL_PROFILE).bilateral
    expect(bothSets).toContain(11.2)
    expect(bothSets).toContain(13.2)

    const setAOnly: EquipmentProfile = { ...REAL_PROFILE, plateSets: [REAL_PROFILE.plateSets![0]] }
    const oneSetBilateral = achievableLoads(setAOnly).bilateral
    expect(oneSetBilateral).not.toContain(11.2)
    expect(oneSetBilateral).not.toContain(13.2)
  })
})

describe('achievableLoads — max-plates-per-side (R3) excludes exactly what a 5th plate would unlock', () => {
  /**
   * Verified against the shipped algorithm (scratchpad
   * `real-equipment-nocap.mjs`, 7 Aug 2026). Removing the cap raises
   * both ceilings — proof the cap is doing real filtering, not a no-op.
   */
  it('raises the bilateral ceiling from 13.2 to 15.2 kg and the single-implement ceiling from 16.2 to 20.2 kg when uncapped', () => {
    const uncapped: EquipmentProfile = { ...REAL_PROFILE, maxPlatesPerSide: null }
    const { bilateral, singleImplement } = achievableLoads(uncapped)
    expect(bilateral.at(-1)).toBe(15.2)
    expect(singleImplement.at(-1)).toBe(20.2)
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
    expect(achievableLoads(profile)).toEqual({ bilateral: [], singleImplement: [] })
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
    expect(() => achievableLoads(REAL_PROFILE)).not.toThrow()
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
