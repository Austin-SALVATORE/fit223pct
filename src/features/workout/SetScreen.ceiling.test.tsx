import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription } from '@/domain/types'
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
 * ceiling is 20) was stored as 20.
 *
 * The rules pinned here:
 *   - nothing clamps the weight: typed entry, "+" and "−" pass it through
 *     and `LoggedSet.weightKg` stores it (T1, T2)
 *   - the warning is strictly above the ceiling, never at it (T3)
 *   - it is never shown on a substitute, whose ceiling belongs to the
 *     exercise that was swapped out (T4)
 *   - its `{{max}}` is formatted for the locale (T6)
 *   - the heading is described by it only while it renders (T7)
 * The carry-forward half (a logged load above the ceiling carries
 * verbatim, and the ceiling stays as authored) is T5, in
 * `domain/carryForward.test.ts`.
 *
 * Negative controls, all run 29 Oct (mutation applied to SetScreen.tsx or a
 * workout.json, this file run, restored byte-for-byte). Named, not
 * line-numbered, so the record survives edits.
 *   re-add `max={prescription.maxWeightKg ?? undefined}` to the weight
 *     Stepper             -> T1 (45 shows 38kg), T2 ("+" gives 38kg, i.e.
 *                            it LOWERS the weight), T3, T4 (27.75 shows
 *                            20kg — the 24 Oct defect), T7 stepping
 *   `weightKg > ceilingKg` becomes `>=`
 *                         -> T3 (a warning at exactly the ceiling), and
 *                            T7 stepping, which also starts on the boundary
 *   delete the warning's JSX (id still in aria-describedby)
 *                         -> T1, T2, T3, T6 fr, T6 zh-CN, T7 above, T7 stepping
 *   drop the `substitutedForId === undefined` clause
 *                         -> T4 only (warns against the dumbbell's 20)
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
 */

const WARNING_STEM = "Above this program's"

function warningEn(max: string): string {
  return `${WARNING_STEM} ${max} kg equipment limit. It will be logged as entered.`
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

/** The authored slot of the 24 Oct report: a per-dumbbell ceiling of 20 kg. */
function dumbbellBench(): LadderPrescription {
  return {
    exerciseId: 'dumbbell-bench-press',
    sets: 4,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: [10, 12, 14, 16].map((weightKg) => ({ weightKg, reps: 10 })),
    maxWeightKg: 20,
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

async function start(item: LadderPrescription, heading = 'Goblet squat') {
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
    expect(screen.getByText(warningEn('38'))).toBeInTheDocument()

    const stored = await logSet()
    expect(stored.sets[0].weightKg).toBe(45)
    // Logging above the ceiling does not confirm heavier equipment: the
    // snapshot still carries the program's own number.
    expect((stored.prescription as LadderPrescription).maxWeightKg).toBe(38)
  })

  it('T2: from a carried rung already above the ceiling, "+" goes up and "−" comes back; the warning is there on landing', async () => {
    await start(goblet([40, 40], 38))

    expect(screen.getByText(warningEn('38'))).toBeInTheDocument()
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
    expect(screen.getByText(warningEn('38'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(screen.queryByText(new RegExp(WARNING_STEM))).toBeNull()
  })

  it('T4: a cross-implement swap logs the typed barbell load as entered, with no warning against the swapped-out exercise\'s ceiling', async () => {
    await start(dumbbellBench(), 'Dumbbell bench press')
    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /Barbell bench press/ }),
    )
    await screen.findByRole('heading', { name: 'Barbell bench press' })

    // 27.75 kg is the barbell on its own plus symmetric plates — well over
    // the dumbbell slot's per-hand 20.
    await typeWeight('27.75')
    expect(weightText()).toBe('27.75kg')
    expect(screen.queryByText(new RegExp(WARNING_STEM))).toBeNull()

    const stored = await logSet()
    expect(stored.exerciseId).toBe('bench-press')
    expect(stored.sets[0].weightKg).toBe(27.75)
  })

  it('T6: the ceiling reads in the active language and number format (fr 43,75 · zh-CN 43.75)', async () => {
    await i18n.changeLanguage('fr')
    await start(goblet([44, 44], 43.75))
    expect(
      screen.getByText(
        'Au-dessus de la limite de matériel du programme (43,75 kg). La charge sera enregistrée telle quelle.',
      ),
    ).toBeInTheDocument()
  })

  it('T6: zh-CN', async () => {
    await i18n.changeLanguage('zh-CN')
    await start(goblet([44, 44], 43.75), '高脚杯深蹲')
    expect(
      screen.getByText('超出本计划的器材上限（43.75 公斤），会按你输入的重量记录。'),
    ).toBeInTheDocument()
  })
})

describe('what a screen reader hears on landing', () => {
  it('T7: the heading is described by the warning when the carried rung is above the ceiling', async () => {
    await start(goblet([40, 40], 38))

    const description = headingDescription()
    expect(description.ids).toHaveLength(3)
    expect(description.resolved).toBe(true)
    expect(description.text).toContain(warningEn('38'))
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
    expect(headingDescription().text).toContain(warningEn('38'))

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(headingDescription().ids).toHaveLength(2)
    expect(headingDescription().resolved).toBe(true)
  })
})
