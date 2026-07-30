import { describe, expect, it } from 'vitest'
import { PAL_BANDS } from './energyReference'
import {
  ageOn,
  leanBodyMassKg,
  maintenanceByBand,
  maintenanceKcal,
  resolveProfile,
  restingEnergyExpenditure,
  restingEnergyExpenditureFromLeanMass,
  type ProfileCheckIn,
  type ResolvedProfile,
} from './profile'

function profile(overrides: Partial<ResolvedProfile> = {}): ResolvedProfile {
  return {
    heightCm: 178,
    age: 30,
    sex: 'male',
    // Default null, matching a real install confirmed before the field
    // existed: the resting figure must survive it.
    activityLevel: null,
    currentWeightKg: 80,
    currentBodyFatPercent: null,
    targetWeightKg: null,
    targetBodyFatPercent: null,
    confirmed: true,
    ...overrides,
  }
}

function checkIn(date: string, weightKg: number | null, bodyFatPercent?: number | null): ProfileCheckIn {
  return { date, weightKg, bodyFatPercent }
}

/**
 * The golden cases are the acceptance test for this module, not a report.
 *
 * Every expected value below was cross-checked by hand against the published
 * equations. They are asserted **unrounded**: the plan's table shows them to
 * one decimal (1370.3, 2133.8, 2173.8), and two of those land exactly on
 * toBeCloseTo's boundary, so the rounded form is both weaker and flakier
 * than the real number.
 *
 * **Third-party calculators were not used and must not be**:
 * verification found a widely used public one silently inserting a
 * nonstandard 1.465 activity tier while its own prose claimed the standard
 * five-band scale. These numbers are the reference; a calculator is not.
 */
describe('Mifflin–St Jeor golden cases', () => {
  it.each([
    ['M 30y 178cm 80kg', { sex: 'male' as const, age: 30, heightCm: 178, currentWeightKg: 80 }, 1767.5],
    ['F 30y 165cm 65kg', { sex: 'female' as const, age: 30, heightCm: 165, currentWeightKg: 65 }, 1370.25],
    ['F 19y 150cm 45kg', { sex: 'female' as const, age: 19, heightCm: 150, currentWeightKg: 45 }, 1131.5],
    ['M 78y 195cm 130kg', { sex: 'male' as const, age: 78, heightCm: 195, currentWeightKg: 130 }, 2133.75],
  ])('%s', (_label, inputs, expected) => {
    expect(restingEnergyExpenditure(profile(inputs))).toBeCloseTo(expected, 2)
  })
})

describe('Cunningham golden case', () => {
  it('M 80kg at 15% body fat', () => {
    const p = profile({ currentWeightKg: 80, currentBodyFatPercent: 15 })
    expect(leanBodyMassKg(p)).toBeCloseTo(68, 6)
    expect(restingEnergyExpenditureFromLeanMass(p)).toBeCloseTo(1838.8, 2)
  })
})

/**
 * The two cases that justify carrying both equations at all: they disagree
 * in *opposite* directions depending on body composition. Asserted rather
 * than described, because a future reader deleting one of the two would
 * otherwise see no reason not to.
 */
describe('the equations diverge in opposite directions with body composition', () => {
  it('Cunningham reads LOWER than Mifflin at high body fat', () => {
    const p = profile({ sex: 'male', age: 45, heightCm: 175, currentWeightKg: 130, currentBodyFatPercent: 45 })
    const mifflin = restingEnergyExpenditure(p)!
    const cunningham = restingEnergyExpenditureFromLeanMass(p)!

    expect(mifflin).toBeCloseTo(2173.75, 2)
    expect(cunningham).toBeCloseTo(1914.4, 2)
    expect(cunningham - mifflin).toBeCloseTo(-259.35, 2)
    expect(Math.abs(cunningham - mifflin) / mifflin).toBeCloseTo(0.12, 2)
  })

  it('Cunningham reads HIGHER than Mifflin at low body fat', () => {
    const p = profile({ sex: 'male', age: 35, heightCm: 180, currentWeightKg: 90, currentBodyFatPercent: 8 })
    const mifflin = restingEnergyExpenditure(p)!
    const cunningham = restingEnergyExpenditureFromLeanMass(p)!

    expect(mifflin).toBeCloseTo(1855.0, 2)
    expect(cunningham).toBeCloseTo(2158.48, 2)
    expect(cunningham - mifflin).toBeCloseTo(303.48, 2)
    expect(Math.abs(cunningham - mifflin) / mifflin).toBeCloseTo(0.16, 2)
  })
})

describe('a missing input yields no figure, never a default', () => {
  it.each(['currentWeightKg', 'heightCm', 'age', 'sex'] as const)(
    'returns null when %s is missing',
    (field) => {
      expect(restingEnergyExpenditure(profile({ [field]: null }))).toBeNull()
    },
  )

  it('returns a number only when every input is present', () => {
    expect(restingEnergyExpenditure(profile())).not.toBeNull()
  })

  it('has no lean mass, and so no Cunningham figure, without a body-fat reading', () => {
    expect(leanBodyMassKg(profile({ currentBodyFatPercent: null }))).toBeNull()
    expect(restingEnergyExpenditureFromLeanMass(profile({ currentBodyFatPercent: null }))).toBeNull()
  })
})

describe('age is derived from a birth date, never stored', () => {
  it('counts a birthday that has not arrived this year as not yet reached', () => {
    expect(ageOn('1990-07-30', new Date(2026, 6, 29))).toBe(35)
    expect(ageOn('1990-07-29', new Date(2026, 6, 29))).toBe(36)
  })

  it('handles a 29 February birth date in a non-leap year', () => {
    // The day before the would-be birthday, and the day 1 March provides.
    expect(ageOn('2000-02-29', new Date(2025, 1, 28))).toBe(24)
    expect(ageOn('2000-02-29', new Date(2025, 2, 1))).toBe(25)
  })

  it('is null for an absent or unparseable date', () => {
    expect(ageOn(null, new Date())).toBeNull()
    expect(ageOn(undefined, new Date())).toBeNull()
    expect(ageOn('not-a-date', new Date())).toBeNull()
  })
})

describe('resolveProfile reads the series rather than shadowing it', () => {
  it('takes the most recent check-in that actually carries a weight', () => {
    const resolved = resolveProfile({}, [
      checkIn('2026-07-01', 82),
      checkIn('2026-07-20', null), // more recent, but no weight logged
      checkIn('2026-07-10', 80.5),
    ])

    expect(resolved.currentWeightKg).toBe(80.5)
  })

  it('resolves weight and body fat independently', () => {
    // The newest weight and the newest body-fat reading are on different days,
    // which is the normal case — body fat is measured far less often.
    const resolved = resolveProfile({}, [
      checkIn('2026-07-20', 80, null),
      checkIn('2026-07-01', 82, 18),
    ])

    expect(resolved.currentWeightKg).toBe(80)
    expect(resolved.currentBodyFatPercent).toBe(18)
  })

  it('yields all-null for an empty check-in list, and does not throw', () => {
    const resolved = resolveProfile({}, [])

    expect(resolved).toEqual({
      heightCm: null,
      age: null,
      sex: null,
      activityLevel: null,
      currentWeightKg: null,
      currentBodyFatPercent: null,
      targetWeightKg: null,
      targetBodyFatPercent: null,
      confirmed: false,
    })
  })

  it('treats a settings record without the new fields as missing, not defaulted', () => {
    // A v3 record predates birthDate/sex/targets entirely, and predates the
    // confirmation marker too — so even its stored height is untrusted.
    const resolved = resolveProfile({ heightCm: 180 }, [])

    expect(resolved.confirmed).toBe(false)
    expect(resolved.heightCm).toBeNull()
    expect(resolved.age).toBeNull()
    expect(resolved.sex).toBeNull()
    expect(resolved.targetWeightKg).toBeNull()
  })

  it('trusts stored settings once the profile has been confirmed', () => {
    const resolved = resolveProfile(
      { heightCm: 178, birthDate: '1990-01-01', sex: 'male', profileConfirmedAt: '2026-07-30' },
      [],
      new Date(2026, 6, 30),
    )

    expect(resolved.confirmed).toBe(true)
    expect(resolved.heightCm).toBe(178)
    expect(resolved.age).toBe(36)
    expect(resolved.sex).toBe('male')
  })

  it('never trusts the seeded height until it is confirmed, however complete the rest looks', () => {
    // The defect the marker exists for: this record has everything a
    // baseline needs, but nobody ever asked the owner whether 180 is his
    // height. No marker, no baseline — and deliberately not inferred from
    // the other fields being populated.
    const unconfirmed = resolveProfile(
      { heightCm: 180, birthDate: '1990-01-01', sex: 'male' },
      [{ date: '2026-07-01', weightKg: 82 }],
      new Date(2026, 6, 30),
    )

    expect(unconfirmed.heightCm).toBeNull()
    expect(restingEnergyExpenditure(unconfirmed)).toBeNull()
    // The measurement is still the user's own — they entered it themselves.
    expect(unconfirmed.currentWeightKg).toBe(82)
  })

  it('does not mutate the check-in list it was given', () => {
    const checkins = [checkIn('2026-07-01', 82), checkIn('2026-07-20', 80)]
    const snapshot = structuredClone(checkins)

    resolveProfile({}, checkins)

    expect(checkins).toEqual(snapshot)
  })
})

describe('maintenance energy is a range, not a point', () => {
  it('multiplies REE by both ends of the selected PAL band', () => {
    const range = maintenanceKcal(1767.5, 'sedentary')

    expect(range.min).toBeCloseTo(1767.5 * PAL_BANDS.sedentary.min, 6)
    expect(range.max).toBeCloseTo(1767.5 * PAL_BANDS.sedentary.max, 6)
    expect(range.max).toBeGreaterThan(range.min)
  })

  it('never collapses a band to a single figure', () => {
    // The bands are ranges in the source; a point estimate here would be
    // precision this milestone's own citations do not have.
    for (const pal of ['sedentary', 'active', 'vigorous'] as const) {
      const range = maintenanceKcal(1650, pal)
      expect(range.max).toBeGreaterThan(range.min)
    }
  })

  it('uses the FAO bands, which put sedentary well above the unsourced 1.2 convention', () => {
    // Guards the ruling itself: someone "correcting" these to the familiar
    // fitness-calculator scale would change every downstream figure by
    // hundreds of kcal, and that scale has no traceable source.
    expect(PAL_BANDS.sedentary.min).toBeGreaterThan(1.2)
    expect(maintenanceKcal(1650, 'sedentary').min).toBeGreaterThan(1650 * 1.2)
  })
})

describe('with no band stated, every band is offered and none is chosen', () => {
  it('returns all three bands, lightest first', () => {
    const bands = maintenanceByBand(1650)

    expect(bands.map((band) => band.level)).toEqual(['sedentary', 'active', 'vigorous'])
    for (const band of bands) {
      expect(band.range).toEqual(maintenanceKcal(1650, band.level))
      expect(band.range.max).toBeGreaterThan(band.range.min)
    }
  })

  it('marks nothing as recommended and carries no extra field to hide one in', () => {
    // Which band a trainee belongs in is a training-content judgement and
    // belongs to the owner's coach. A `recommended` or `default` flag here is
    // how that judgement would arrive without anyone deciding to make it.
    for (const band of maintenanceByBand(1650)) {
      expect(Object.keys(band).sort()).toEqual(['level', 'range'])
    }
  })

  it('ascends without overlapping, so the three rows read as a ladder', () => {
    const bands = maintenanceByBand(1650)

    for (let i = 1; i < bands.length; i += 1) {
      expect(bands[i].range.min).toBeGreaterThan(bands[i - 1].range.max)
    }
  })
})

describe('an unstated activity level is a normal state of a confirmed profile', () => {
  it('resolves to null without touching confirmed', () => {
    // The migration case: the owner's install has profileConfirmedAt set and
    // no activityLevel, and must keep its baseline.
    const resolved = resolveProfile(
      { heightCm: 178, birthDate: '1990-01-01', sex: 'male', profileConfirmedAt: '2026-07-30' },
      [checkIn('2026-07-01', 84)],
      new Date('2026-07-30T12:00:00'),
    )

    expect(resolved.activityLevel).toBeNull()
    expect(resolved.confirmed).toBe(true)
  })

  it('does not suppress the resting figure', () => {
    // This is the whole point of keeping the band out of the REE inputs: a
    // field added after the fact must not retroactively blank a baseline.
    expect(restingEnergyExpenditure(profile({ activityLevel: null }))).not.toBeNull()
    expect(restingEnergyExpenditure(profile({ activityLevel: null }))).toBe(
      restingEnergyExpenditure(profile({ activityLevel: 'active' })),
    )
  })

  it('reads a stated band back, and stays null on an unconfirmed profile', () => {
    const settings = { activityLevel: 'vigorous' as const, profileConfirmedAt: '2026-07-30' }

    expect(resolveProfile(settings, []).activityLevel).toBe('vigorous')
    // Unconfirmed: every settings-sourced fact reads as missing, this one too.
    expect(resolveProfile({ activityLevel: 'vigorous' }, []).activityLevel).toBeNull()
  })
})
