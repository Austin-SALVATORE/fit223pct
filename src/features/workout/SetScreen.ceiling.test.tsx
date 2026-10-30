import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, RepRangePrescription } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * The weight is never capped; above the program's equipment ceiling the set
 * screen warns and logs what was entered (athlete feedback, 24 Oct, relayed
 * and approved 29 Oct; Track A Phase 1).
 *
 * **This supersedes the 21 Oct owner ruling** that "+" is inert at the
 * ceiling by design, and the tests that encoded it ("shows at the ceiling,
 * and '+' leaves the weight unchanged"). Those went red when the Stepper's
 * `max` prop was removed from SetScreen — evidence the change reaches its
 * subject — and are replaced, not patched. What the defect did: a typed
 * 27.75 kg barbell bench (swapped in for a dumbbell bench whose per-dumbbell
 * ceiling is 20) was stored as 20. T4 and T9's substitute case now use a
 * dumbbell row swapped to the barbell bent-over row (41.75 over a 38 ceiling),
 * because the bench left every recommended list on 29 Oct (coach Q2); the
 * bench case itself runs in `WorkoutPage.swapOther.test.tsx`.
 *
 * The rules pinned here:
 *   - nothing clamps the weight: typed entry, "+" and "−" pass it through
 *     and `LoggedSet.weightKg` stores it (T1, T2)
 *   - the warning is strictly above the ceiling, never at it (T3)
 *   - it is never shown on a substitute, whose ceiling belongs to the
 *     exercise that was swapped out (T4)
 *   - its `{{max}}` is formatted for the locale (T6)
 *   - the heading is described by it only while it renders (T7)
 *   - it takes the target caption's place, in room that is already there: it
 *     adds no height, and showing or hiding it moves nothing (T9; structure
 *     only, the pixels are the browser record below)
 * The carry-forward half (a logged load above the ceiling carries
 * verbatim, and the ceiling stays as authored) is T5, in
 * `domain/carryForward.test.ts`.
 *
 * Negative controls, all run 29 Oct (mutation applied to SetScreen.tsx or a
 * workout.json, this file run, restored byte-for-byte). Named, not
 * line-numbered, so the record survives edits.
 *   re-add `max={prescription.maxWeightKg ?? undefined}` to the weight
 *     Stepper             -> T1 (45 shows 38kg), T2 ("+" gives 38kg, i.e.
 *                            it LOWERS the weight), T3, T4 (41.75 shows
 *                            38kg — the 24 Oct defect, on the row), T7
 *                            stepping, T9 slot
 *   `weightKg > ceilingKg` becomes `>=`
 *                         -> T3 (a warning at exactly the ceiling), and
 *                            T7 stepping and T9 slot, which also start on
 *                            the boundary
 *   delete the warning's JSX (id still in aria-describedby)
 *                         -> T1, T2, T3, T6 fr, T6 zh-CN, T7 above, T7
 *                            stepping, T9 slot
 *   drop the `substitutedForId === undefined` clause (since 2b.3 it is
 *     `!isSubstitute(workoutExercise)` in `showAboveCeiling`)
 *                         -> T4 (warns against the dumbbell's 20). Recorded here
 *                            on 29 Oct as "T4 and T9 substitute", which was true
 *                            only while a slot existed that a substitute would also
 *                            have reserved; from 2.3 on it was T4 alone in this
 *                            file. Re-run 30 Oct against the whole suite it is five
 *                            red, because later phases added tests that assert the
 *                            same thing: T4, SetScreen.substitute's T20 and T24,
 *                            SetScreen.swapBack's "a genuine substitute still shows
 *                            none of the four", and the 24 Oct end to end in
 *                            WorkoutPage.swapOther. No T9 test is red: nothing is
 *                            reserved any more.
 *   remove `{{max}}` from the fr value
 *                         -> T6 fr only
 *   remove `{{max}}` from the zh-CN value
 *                         -> T6 zh-CN only
 *   pass String(ceilingKg) instead of formatNumber(...)
 *                         -> T6 fr only ("43.75" where fr writes "43,75")
 *   leave the warning id out of aria-describedby
 *                         -> T7 above, T7 stepping
 *   put the warning id in aria-describedby unconditionally
 *                         -> T7 below (a dangling id), T7 stepping
 * localeParity.test.ts does catch the key being absent from one locale
 * (fr: `fr has the same key families as en`), and does NOT catch `{{max}}`
 * being dropped from a value — it passed 60/60 under the fr mutation above.
 * T6 is the only guard for that.
 *
 * **T9 is a structural proxy, not a measurement.** jsdom has no layout, so it
 * cannot see a pixel. It pins what produces the layout: the warning and the
 * target caption share one box, directly above Log set; the warning is out of flow
 * (`absolute`); the caption keeps its height (`invisible`, not removed, and still
 * the heading's description, T7); the box owns the 32px gap above Log set (`pb-8`)
 * and reserves no height (`min-h-`); Log set carries no margin of its own; and all
 * of that is identical for an exercise that can warn, one that never can (a
 * substitute) and one with no ceiling.
 *
 * The pixels, measured 30 Oct in headless Chromium and WebKit (`isMobile`, touch,
 * 375/390px wide, DPR 2; the harness is in the batch's scratchpad). Before this
 * change a slot (8px margin, `min-h-10`, then Log set's own 8px) took 56px on every
 * exercise with a ceiling where a plain exercise has a 32px gap: 24px more:
 *
 *   viewport   exercise          "+" y   Log set y   page height
 *   375x667    ceiling, before   225      481         681 (scrolls)
 *              ceiling, after    225      457         667
 *              no ceiling        225      457         667
 *   375x812    ceiling, before   356      612         812
 *              ceiling, after    380      612         812
 *              no ceiling        380      612         812
 *   390x844    ceiling, before   388      644         844
 *              ceiling, after    412      644         844
 *              no ceiling        412      644         844
 *
 * Under 700px there is no illustration band to absorb the slot, so it pushed Log
 * set down 24px and made the page scroll; above it the band shrank and "+" sat 24px
 * higher on every ceiling exercise than on any other. Both are gone: a ceiling
 * exercise now lays out exactly like one with none, at every size. Same numbers in
 * en and fr. With the warning showing against not showing, "+", "-", Log set and
 * the reps "+" are at 0.0px displacement at 375x667, 375x812, 390x844 and 320x568
 * in en and fr, across ten values that include the boundary (38 no warning,
 * 38.25 warning, 99, 100.5): one distinct position set each (the F1 invariant of
 * eb14b08 holds). The warning is two lines at every width in en and zh-CN, and in fr
 * from 360px; fr takes three lines at 320 and 340px (48px, 4px clear of Log set).
 *
 * Controls for T9, run 30 Oct (mutation applied to SetScreen.tsx, the whole suite
 * run, restored and `cmp`ed):
 *   the warning rendered in flow (`absolute inset-x-0 top-3` removed)
 *                         -> T9 box
 *   the caption not hidden while the warning shows (`replaced={false}`)
 *                         -> T9 box
 *   a margin back on Log set (`mt-8`)
 *                         -> T9 uniform x3
 *   the box without its `pb-8` gap
 *                         -> T9 uniform x3
 *   a reserved height back on the box (`min-h-14`)
 *                         -> T9 uniform x3
 *   the whole earlier structure (the file as of 02761fe: a separate `min-h-10`
 *     slot, `logGapClass`)  -> all four T9 tests, and the nine in
 *                            SetScreen.lastTime.test (13 red in all)
 * Not seen by any jsdom control, and measured instead: that the warning does not
 * overlap Log set (the browser's 4px clearance at three French lines), and that the
 * hidden caption keeps the box's height (a `display: none` caption would collapse
 * it and shift Log set by the caption's height: visible only with layout).
 */

const WARNING_STEM = "Above this program's"

function warningEn(max: string): string {
  return `${WARNING_STEM} ${max} kg equipment limit. It will be logged as entered.`
}

function plannedEn(max: string, planned: string): string {
  return `${WARNING_STEM} ${max} kg equipment limit (planned ${planned} kg). It will be logged as entered.`
}

function goblet(weights: number[], maxWeightKg: number): LadderPrescription {
  return {
    exerciseId: 'goblet-squat',
    sets: weights.length,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: weights.map((weightKg) => ({ weightKg, reps: 6 })),
    maxWeightKg,
    weightStepKg: 2,
  }
}

/**
 * The Full Body B row slot: per-dumbbell weights and a 38 ceiling. Its barbell
 * bent-over row substitute is the cross-implement swap these tests use — the
 * barbell bench press of the original 24 Oct report left every recommended
 * list on 29 Oct (coach Q2), so it is reached through "Other exercises"
 * (`WorkoutPage.swapOther.test.tsx` drives that exact case end to end).
 */
function dumbbellRow(): LadderPrescription {
  return {
    exerciseId: 'single-arm-db-row',
    sets: 3,
    mode: 'reps',
    restSeconds: 90,
    perSide: true,
    setPlan: [
      { weightKg: 10, reps: 12 },
      { weightKg: 12, reps: 10 },
      { weightKg: 14, reps: 8 },
    ],
    maxWeightKg: 38,
    weightStepKg: 2,
  }
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

async function start(item: LadderPrescription | RepRangePrescription, heading = 'Goblet squat') {
  await db.workouts.put(
    createWorkout({
      id: 'ceiling',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [item] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
    }),
  )
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: heading })
}

async function typeWeight(value: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Edit Weight' }))
  const input = screen.getByRole('textbox', { name: 'Weight' })
  await userEvent.clear(input)
  await userEvent.type(input, `${value}{Enter}`)
}

const weightText = () => screen.getByLabelText('Weight', { selector: 'output' }).textContent

async function logSet() {
  await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
  await waitFor(async () => expect((await db.workouts.get('ceiling'))?.exercises[0].sets).toHaveLength(1))
  return (await db.workouts.get('ceiling'))!.exercises[0]
}

/** What a screen reader announces when focus lands on the heading. */
function headingDescription() {
  const heading = screen.getByRole('heading', { level: 1 })
  const ids = (heading.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
  const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
  return { ids, text, resolved: ids.every((id) => document.getElementById(id) !== null) }
}

describe('no weight cap', () => {
  it('T1: a typed weight above the ceiling is shown and stored as entered, and the ceiling itself is not raised', async () => {
    await start(goblet([36, 36], 38))

    await typeWeight('45')
    expect(weightText()).toBe('45kg')
    expect(screen.getByText(plannedEn('38', '36'))).toBeInTheDocument()

    const stored = await logSet()
    expect(stored.sets[0].weightKg).toBe(45)
    // Logging above the ceiling does not confirm heavier equipment: the
    // snapshot still carries the program's own number.
    expect((stored.prescription as LadderPrescription).maxWeightKg).toBe(38)
  })

  it('T2: from a carried rung already above the ceiling, "+" goes up and "−" comes back; the warning is there on landing', async () => {
    await start(goblet([40, 40], 38))

    expect(screen.getByText(plannedEn('38', '40'))).toBeInTheDocument()
    expect(weightText()).toBe('40kg')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('42kg')
    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(weightText()).toBe('40kg')
  })
})

describe('the warning', () => {
  it('T3: appears strictly above the ceiling — not below it, not at it', async () => {
    await start(goblet([36, 36], 38))

    expect(screen.queryByText(new RegExp(WARNING_STEM))).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('38kg')
    expect(screen.queryByText(new RegExp(WARNING_STEM))).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('40kg')
    expect(screen.getByText(plannedEn('38', '36'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(screen.queryByText(new RegExp(WARNING_STEM))).toBeNull()
  })

  it('T4: a cross-implement swap logs the typed barbell load as entered, with no warning against the swapped-out exercise\'s ceiling', async () => {
    await start(dumbbellRow(), 'Single-arm dumbbell row')
    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /Barbell bent-over row/ }),
    )
    await screen.findByRole('heading', { name: 'Barbell bent-over row' })

    // 41.75 kg is a barbell load (the 7.75 kg bar plus symmetric plates), above
    // the dumbbell slot's per-hand ceiling of 38 — which is not this exercise's.
    await typeWeight('41.75')
    expect(weightText()).toBe('41.75kg')
    expect(screen.queryByText(new RegExp(WARNING_STEM))).toBeNull()

    const stored = await logSet()
    expect(stored.exerciseId).toBe('bent-over-row')
    expect(stored.sets[0].weightKg).toBe(41.75)
  })

  it('T6: the ceiling reads in the active language and number format (fr 43,75 · zh-CN 43.75)', async () => {
    await i18n.changeLanguage('fr')
    await start(goblet([44, 44], 43.75))
    expect(
      screen.getByText(
        'Au-dessus de la limite de matériel du programme (43,75 kg ; prévu : 44 kg). La charge sera enregistrée telle quelle.',
      ),
    ).toBeInTheDocument()
  })

  it('T6: zh-CN', async () => {
    await i18n.changeLanguage('zh-CN')
    await start(goblet([44, 44], 43.75), '高脚杯深蹲')
    expect(
      screen.getByText('超出本计划的器材上限（43.75 公斤，计划 44 公斤），会按你输入的重量记录。'),
    ).toBeInTheDocument()
  })
})

describe('what a screen reader hears on landing', () => {
  it('T7: the heading is described by the warning when the carried rung is above the ceiling', async () => {
    await start(goblet([40, 40], 38))

    const description = headingDescription()
    expect(description.ids).toHaveLength(3)
    expect(description.resolved).toBe(true)
    expect(description.text).toContain(plannedEn('38', '40'))
  })

  it('T7: below the ceiling the warning is not announced, and no id dangles', async () => {
    await start(goblet([36, 36], 38))

    const description = headingDescription()
    expect(description.ids).toHaveLength(2)
    expect(description.resolved).toBe(true)
    expect(description.text).not.toContain(WARNING_STEM)
  })

  it('T7: stepping across the ceiling adds and removes it', async () => {
    await start(goblet([38, 38], 38))
    expect(headingDescription().text).not.toContain(WARNING_STEM)

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(headingDescription().text).toContain(plannedEn('38', '38'))

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(headingDescription().ids).toHaveLength(2)
    expect(headingDescription().resolved).toBe(true)
  })
})

describe('the warning takes the caption\'s place and moves nothing (QA F-A, then F-B/F-D)', () => {
  /** The box the target caption and the warning share, and Log set under it. */
  function slot() {
    // The visible caption ("Rung 1 of 4 · 14 kg × 12"), not its spoken twin ("Rung 1 of 4, 12 reps at
    // 14 kg", batch A2): both start "Rung 1 of", so the middot is what tells them apart.
    const caption = screen.getByText(/^Rung 1 of \d+ ·/).closest('p') as HTMLElement
    const box = caption.parentElement as HTMLElement
    const logSet = screen.getByRole('button', { name: 'Log set' })
    return { caption, box, logSet }
  }

  /**
   * What decides where Log set sits, as classes: the box owns the 32px gap
   * above it (`pb-8`) and holds no reserved height of its own; Log set carries no
   * margin. The same for every exercise, so nothing about the stack depends on
   * whether a warning can appear.
   */
  function expectLayoutIndependentOfWarning() {
    const { box, logSet } = slot()
    expect(logSet.previousElementSibling).toBe(box)
    expect(box.className).toMatch(/\bpb-8\b/)
    expect(box.className).not.toMatch(/\bmin-h-/)
    expect(logSet.className).not.toMatch(/\bmt-\d/)
  }

  it('T9 box: the warning is laid over the caption\'s box, out of flow, and the box does not change', async () => {
    await start(goblet([36, 36], 38))
    const { caption, box, logSet } = slot()

    // Below the ceiling: the box holds the caption and nothing else.
    expect(logSet.previousElementSibling).toBe(box)
    expect(box.children).toHaveLength(1)
    expect(caption).not.toHaveClass('invisible')
    const boxClass = box.className
    const logClass = logSet.className

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('40kg')

    // Above it: the same node now also holds the warning. The warning is out of
    // flow (`absolute`), so it adds no height; the caption keeps its own height
    // (`invisible`, not removed) and is still in the DOM as the heading's
    // description (T7); neither the box nor Log set changed a class.
    expect(slot().box).toBe(box)
    expect(box.children).toHaveLength(2)
    const warning = screen.getByText(plannedEn('38', '36'))
    expect(box).toContainElement(warning)
    expect(warning).toHaveClass('absolute')
    expect(caption).toHaveClass('invisible')
    expect(caption).toBeInTheDocument()
    expect(box.className).toBe(boxClass)
    expect(logSet.className).toBe(logClass)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(box.children).toHaveLength(1)
    expect(caption).not.toHaveClass('invisible')
    expect(box.className).toBe(boxClass)
  })

  it('T9 uniform, ceiling: an exercise that can warn has no reserved slot', async () => {
    await start(goblet([36, 36], 38))
    expectLayoutIndependentOfWarning()
  })

  it('T9 uniform, substitute: nor does one that can never warn', async () => {
    await start(dumbbellRow(), 'Single-arm dumbbell row')
    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /Barbell bent-over row/ }),
    )
    await screen.findByRole('heading', { name: 'Barbell bent-over row' })
    expectLayoutIndependentOfWarning()
  })

  it('T9 uniform, no ceiling: nor does an exercise with no ceiling', async () => {
    await start({ ...goblet([36, 36], 38), maxWeightKg: null })
    expectLayoutIndependentOfWarning()
  })
})

/**
 * The warning names the planned weight (owner ruling, board, 30 Oct 13:55). It takes
 * the target caption's place while it is up, so a typo (140 for 14) would hide the one
 * number that exposes it; the warning therefore carries it: "Above this program's 38 kg
 * equipment limit (planned 14 kg). It will be logged as entered."
 *
 * The number is the one the caption shows, from the same function (`plannedWeightKg`),
 * formatted for the locale (fr 41,75). When the caption shows no weight (a rep-range
 * prescription: "8-12 reps"; a custom set: "Custom set") the clause is omitted, and the
 * warning reads as before. A substitute never shows the warning (T4).
 *
 * Negative controls, run 30 Oct (mutation applied to SetScreen.tsx, the whole suite
 * run, restored and `cmp`ed):
 *   the plain warning key always used (the clause dropped)
 *                         -> 15 red: the four planned tests, eight existing assertions
 *                            in this file that now expect the planned wording (T1, T2,
 *                            T3, both T6, both T7, T9 box), and three in
 *                            SetScreen.swapBack.test
 *   the TYPED weight offered as "planned" instead of the rung's
 *                         -> 7 red: "names the rung's planned weight, not the typed
 *                            one", T1, T3, T7 stepping, T9 box, and the rep-range and
 *                            custom-set cases (where the typed number fills a clause
 *                            that should be absent)
 *   `plannedWeightKg` returns the prescribed weight for a rep range too
 *                         -> "a rep-range prescription" (1 red)
 *   `plannedWeightKg` returns it for a custom set too (`isCustomSlot` dropped)
 *                         -> "a custom set" (1 red)
 *   the planned number not formatted for the language (`String(plannedKg)`)
 *                         -> the fr row, "41.75" where fr writes "41,75" (1 red; the
 *                            fixture's number is 44,75)
 * Layout, measured in headless Chromium and WebKit with the longer text (the three
 * lines of the worst case, a 43.75 kg limit and a 41.75 kg rung, in fr at 320, 340,
 * 360 and 375px, and en at 320 and 340): no line count above three, 4px clear of Log
 * set, "+" and Log set at 0.00px displacement with the warning showing against not,
 * en, fr and zh-CN, 320x568 to 390x844. Nothing in the layout changed.
 */
describe('the warning names the planned weight', () => {
  it("names the rung's planned weight, not the typed one", async () => {
    await start(goblet([36, 36], 38))
    await typeWeight('45')
    expect(weightText()).toBe('45kg')
    expect(screen.getByText(plannedEn('38', '36'))).toBeInTheDocument()
    // The number is the one the hidden caption would have shown.
    expect(screen.getByText('Rung 1 of 2 · 36 kg × 6')).toBeInTheDocument()
  })

  it('on landing, from a carried rung already above the limit: the planned weight is that rung', async () => {
    await start(goblet([40, 40], 38))
    expect(screen.getByText(plannedEn('38', '40'))).toBeInTheDocument()
    expect(headingDescription().text).toContain(plannedEn('38', '40'))
  })

  it('a rep-range prescription: the caption shows a range, so the warning omits the clause', async () => {
    const rangeSlot: RepRangePrescription = {
      exerciseId: 'goblet-squat',
      sets: 2,
      mode: 'reps',
      range: { min: 8, max: 12 },
      restSeconds: 90,
      perSide: false,
      startWeightKg: 20,
      maxWeightKg: 38,
      weightStepKg: 2,
    }
    await start(rangeSlot)
    await typeWeight('45')
    expect(screen.getByText(warningEn('38'))).toBeInTheDocument()
    expect(screen.queryByText(/planned/)).toBeNull()
  })

  it('a custom set: its caption says "Custom set", so the warning omits the clause', async () => {
    const item = goblet([36], 38)
    let w = createWorkout({
      id: 'ceiling',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [item] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
    })
    w = {
      ...w,
      exercises: [
        {
          ...w.exercises[0],
          customSlots: 1,
          sets: [{ setIndex: 0, weightKg: 36, reps: 6, seconds: null, completedAt: '2026-10-24T09:05:00.000Z' }],
        },
      ],
    }
    await db.workouts.put(w)
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Routes>
          <Route path="/" element={<p>TODAY PROBE</p>} />
          <Route path="/workout" element={<WorkoutPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByText('Custom set')
    await typeWeight('45')
    expect(screen.getByText(warningEn('38'))).toBeInTheDocument()
    expect(screen.queryByText(/planned/)).toBeNull()
  })

  it.each([
    ['fr', 'Au-dessus de la limite de matériel du programme (43,75 kg ; prévu : 44,75 kg). La charge sera enregistrée telle quelle.'],
    ['zh-CN', '超出本计划的器材上限（43.75 公斤，计划 44.75 公斤），会按你输入的重量记录。'],
  ])('%s: the planned weight is formatted for the language and the meaning is kept', async (lng, expected) => {
    await i18n.changeLanguage(lng)
    // A carried rung above the limit: the warning is up on landing, no typing needed.
    await start(goblet([44.75, 44.75], 43.75), lng === 'zh-CN' ? '高脚杯深蹲' : 'Goblet squat')
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
