import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import { createWorkout, logSet } from '@/domain/workout'
import type { LadderPrescription } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * The swap sheet's "Other exercises" (Track A Phase 2.5), shipped together with
 * the barbell bench press leaving every recommended list (Phase 2.1; coach Q2;
 * owner, 29 Oct: "ship it together with the removal so there is never a gap").
 *
 * What the athlete must still be able to do: swap the dumbbell bench press for
 * the barbell bench press and log it truthfully, with the 24 Oct clamp gone and
 * the start taken from the bench's own history (Phase 2.3) — without the app
 * ever suggesting that exercise as a substitute.
 *
 * Negative controls, run 29 Oct (mutation applied, this file plus
 * `exerciseGroups.test.ts`, `exercises.substitutions.test.ts`,
 * `WorkoutPage.swap.test.tsx`, `SetScreen.ceiling.test.tsx` and
 * `localeParity.test.ts` run, restored byte-for-byte). Test names are shortened.
 * "Other" is the disclosure's list; "the 24 Oct case" is the end-to-end test.
 *   'bench-press' re-added to the dumbbell bench press's list
 *                           -> the Library test, "lists the recommendations
 *                              without the barbell bench press", "starts
 *                              collapsed", "reaches ... through Other" and the
 *                              24 Oct case (the row is asserted *inside the
 *                              panel*, and leaves it once recommended)
 *   'bench-press' re-added to the floor press's list
 *                           -> the Library test only, naming `db-floor-press`
 *   Other returns another group's exercises (`=== group` -> `!== group`)
 *                           -> three exerciseGroups tests, and here: "reaches",
 *                              "lists only this exercise's group", "is there when
 *                              the list is empty", the 24 Oct case, the confirm
 *                              case, fr and zh-CN
 *   Other returns nothing   -> 14 tests across both files
 *   Other drops barbell exercises (an equipment-suitability filter)
 *                           -> "reaches", "lists only this exercise's group"
 *                              (it expects the barbell overhead press), "is there
 *                              when the list is empty", the 24 Oct case, the
 *                              confirm case, fr, zh-CN, and two exerciseGroups
 *   the current exercise, or the recommended ones, not excluded
 *                           -> "never lists the current exercise or a
 *                              recommended one" in both files
 *   chest moved out of the push group
 *                           -> 16 tests, the first being "every Library exercise
 *                              belongs to a group"
 *   `aria-expanded` bound to a constant `true`
 *                           -> "starts collapsed", "toggles", "closes again",
 *                              and fr
 *   `hidden={!otherOpen}` removed
 *                           -> "starts collapsed", "lists the recommendations
 *                              without the barbell bench press", and
 *                              WorkoutPage.swap.test.tsx's "lists program-defined
 *                              substitutions first ..."
 *   `setOtherOpen(false)` removed from the open effect
 *                           -> "closes again when the sheet is reopened"
 *   the display sort removed
 *                           -> "lists them in alphabetical order" only
 *   the section rendered only when there are no recommendations
 *                           -> ten tests; rendered only when there are some, the
 *                              empty-list test only
 *   Other's rows calling `onSelect` directly instead of `chooseOption`
 *                           -> "a swap that would clear logged sets still asks
 *                              first" only
 *   the fr note removed     -> localeParity ("fr has the same key families as
 *                              en") and the fr test
 */

const NOTE_EN = "These aren't suggested substitutes. They're here so you can log what you actually did."
const NOTE_FR =
  'Ces exercices ne sont pas des substitutions suggérées. Ils sont là pour que tu enregistres ce que tu as vraiment fait.'
const NOTE_ZH = '这些不是推荐的替代动作，只是方便你记录实际做了什么。'

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

/** The slot of the 24 Oct report: Full Body B's dumbbell bench press, 20 kg per hand at most. */
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

/** A bodyweight slot with no recommendations: the "no substitutions" case. */
function deficitPushUp(): LadderPrescription {
  return {
    exerciseId: 'deficit-push-up',
    sets: 2,
    mode: 'reps',
    restSeconds: 60,
    perSide: false,
    setPlan: [
      { weightKg: null, reps: 8 },
      { weightKg: null, reps: 8 },
    ],
    maxWeightKg: null,
    weightStepKg: null,
  }
}

async function start(item: LadderPrescription, setsLogged = 0) {
  let workout = createWorkout({
    id: 'other',
    programId: mesocycle2Build.id,
    session: { id: 's', name: 'S', focus: 'F', items: [item] },
    date: '2026-10-24',
    startedAt: '2026-10-24T09:00:00.000Z',
  })
  for (let index = 0; index < setsLogged; index += 1) {
    workout = logSet(
      workout,
      0,
      { weightKg: 14, reps: 10, seconds: null, completedAt: `2026-10-24T09:0${index}:00.000Z` },
      index,
    )
  }
  await db.workouts.put(workout)
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function openSheet(heading: string | RegExp) {
  await screen.findByRole('heading', { name: heading })
  await userEvent.click(screen.getByRole('button', { name: /^(Swap exercise|Remplacer|更换)/ }))
  return screen.findByRole('dialog')
}

/** The disclosure that opens "Other exercises", in any language. */
const otherToggle = (sheet: HTMLElement, name: string | RegExp = 'Other exercises') =>
  within(sheet).getByRole('button', { name })

/** The panel the disclosure controls — so a row is shown to be *in* Other, not merely somewhere in the sheet. */
const otherPanel = (toggle: HTMLElement): HTMLElement => {
  const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
  if (!panel) throw new Error('the disclosure controls nothing')
  return panel
}

const names = (list: HTMLElement) =>
  within(list)
    .getAllByRole('button')
    .map((button) => button.querySelector('span')?.textContent ?? button.textContent ?? '')

describe('the swap sheet: recommendations stay as the coach set them', () => {
  it('lists the recommendations without the barbell bench press', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')

    // Collapsed, the only visible list is the recommended one.
    expect(names(within(sheet).getByRole('list'))).toEqual(['Dumbbell floor press', 'Incline dumbbell press'])
    expect(within(sheet).queryByRole('button', { name: /Barbell bench press/ })).toBeNull()
  })
})

describe('Other exercises', () => {
  it('starts collapsed: the disclosure is closed and the rows are not exposed', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    const toggle = otherToggle(sheet)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(sheet).getByRole('heading', { level: 3, name: 'Other exercises' })).toBeInTheDocument()
    // The panel is hidden, not unmounted: aria-controls resolves.
    const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('hidden')
    // A text query still finds hidden text, so the note is checked as not shown.
    expect(within(sheet).getByText(NOTE_EN)).not.toBeVisible()
    expect(within(sheet).queryByRole('button', { name: /Barbell bench press/ })).toBeNull()
  })

  it('toggles, by click and by keyboard, and says plainly that these are not suggestions', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    const toggle = otherToggle(sheet)

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(sheet).getByText(NOTE_EN)).toBeVisible()

    act(() => toggle.focus())
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('reaches the barbell bench press through Other, from the dumbbell bench press', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    const toggle = otherToggle(sheet)
    await userEvent.click(toggle)

    expect(within(otherPanel(toggle)).getByRole('button', { name: /Barbell bench press/ })).toBeInTheDocument()
  })

  it("lists only this exercise's group, never the exercise itself or a recommendation", async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    await userEvent.click(otherToggle(sheet))

    const lists = within(sheet).getAllByRole('list')
    const other = names(lists[lists.length - 1])
    // Push-group exercises of other kinds are there ...
    expect(other).toContain('Barbell overhead press')
    expect(other).toContain('Dumbbell lateral raise')
    // ... another group's are not ...
    for (const elsewhere of ['Goblet squat', 'Single-arm dumbbell row', 'Plank']) {
      expect(other).not.toContain(elsewhere)
    }
    // ... and neither is the exercise on screen or the two already recommended.
    for (const excluded of ['Dumbbell bench press', 'Dumbbell floor press', 'Incline dumbbell press']) {
      expect(other).not.toContain(excluded)
    }
  })

  it('lists them in alphabetical order for the language, as the Library does', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    await userEvent.click(otherToggle(sheet))

    const lists = within(sheet).getAllByRole('list')
    const other = names(lists[lists.length - 1])
    const sorted = [...other].sort(new Intl.Collator('en').compare)
    expect(other).toEqual(sorted)
  })

  it('closes again when the sheet is reopened', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    await userEvent.click(otherToggle(sheet))
    expect(otherToggle(sheet)).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(within(sheet).getByRole('button', { name: 'Keep Dumbbell bench press' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const reopened = await openSheet('Dumbbell bench press')
    expect(otherToggle(reopened)).toHaveAttribute('aria-expanded', 'false')
  })

  it('is there when the list of recommendations is empty — the "no substitutions" line and the section together', async () => {
    await start(deficitPushUp())
    const sheet = await openSheet('Deficit push-up')

    expect(within(sheet).getByText(/No substitutions for this one/)).toBeInTheDocument()
    const toggle = otherToggle(sheet)
    await userEvent.click(toggle)
    expect(within(otherPanel(toggle)).getByRole('button', { name: /Barbell bench press/ })).toBeInTheDocument()
  })
})

describe('picking from Other goes through the same swap', () => {
  it('the 24 Oct case end to end: the barbell bench press is recorded as itself, at the weight typed, with no ceiling warning and no weight borrowed from the dumbbell', async () => {
    await start(dumbbellBench())
    const sheet = await openSheet('Dumbbell bench press')
    const toggle = otherToggle(sheet)
    await userEvent.click(toggle)
    await userEvent.click(within(otherPanel(toggle)).getByRole('button', { name: /Barbell bench press/ }))
    await screen.findByRole('heading', { name: 'Barbell bench press' })

    // A different implement: no history yet, so nothing is offered (not the dumbbell's 10).
    expect(screen.getByLabelText('Weight', { selector: 'output' })).toHaveTextContent('—')

    await userEvent.click(screen.getByRole('button', { name: 'Edit Weight' }))
    const input = screen.getByRole('textbox', { name: 'Weight' })
    await userEvent.clear(input)
    await userEvent.type(input, '27.75{Enter}')
    // 27.75 is above the dumbbell slot's 20, which is not this exercise's ceiling.
    expect(screen.getByLabelText('Weight', { selector: 'output' })).toHaveTextContent('27.75')
    expect(screen.queryByText(/equipment limit/)).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
    await waitFor(async () => expect((await db.workouts.get('other'))?.exercises[0].sets).toHaveLength(1))
    const stored = (await db.workouts.get('other'))!.exercises[0]
    expect(stored.exerciseId).toBe('bench-press')
    expect(stored.substitutedForId).toBe('dumbbell-bench-press')
    expect(stored.sets[0].weightKg).toBe(27.75)
    // No bench history to suggest from, so there is no basis either.
    expect(stored.substituteLoad).toEqual({ loaded: true, startWeightsKg: [], stepKg: 2 })
  })

  it('a swap that would clear logged sets still asks first', async () => {
    await start(dumbbellBench(), 1)
    const sheet = await openSheet('Dumbbell bench press')
    await userEvent.click(otherToggle(sheet))
    await userEvent.click(within(sheet).getByRole('button', { name: /Barbell bench press/ }))

    expect(
      await screen.findByRole('heading', { name: 'Swap Dumbbell bench press for Barbell bench press?' }),
    ).toBeInTheDocument()
    expect(screen.getByText("1 logged set is kept as a record. It won't count toward the new exercise.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Swap anyway' }))
    expect(await screen.findByRole('heading', { name: 'Barbell bench press' })).toBeInTheDocument()
  })
})

/**
 * The note under "Other exercises" is balanced (`text-balance`): at 375px the
 * Chinese note broke 23 + 3 characters, a two-character line and its full stop
 * on their own (QA, 30 Oct backlog; copy unchanged, CSS only). Measured in
 * headless Chromium and WebKit, per line: zh-CN 23 + 3 before, 13 + 13 after at
 * 375, 360 and 320px, and one line at 414px; en 49 + 37 before, 44 + 42 after;
 * fr 44 + 50 + 24 before, 44 + 35 + 39 after. No language gained a line. jsdom
 * has no layout, so this pins the class that does it.
 *
 * Negative control, run 30 Oct: `text-balance` removed -> all three rows.
 */
describe('the note under Other exercises is balanced', () => {
  it.each([
    ['en', 'Other exercises', NOTE_EN, 'Dumbbell bench press'],
    ['fr', 'Autres exercices', NOTE_FR, 'Développé couché aux haltères'],
    ['zh-CN', '其他动作', NOTE_ZH, '哑铃卧推'],
  ])('%s', async (lng, toggleName, note, heading) => {
    await i18n.changeLanguage(lng)
    await start(dumbbellBench())
    const sheet = await openSheet(heading)
    await userEvent.click(otherToggle(sheet, toggleName))

    expect(within(sheet).getByText(note)).toHaveClass('text-balance')
  })
})

describe('cancelling the confirm leaves Other exercises where it was', () => {
  it('the list stays open and focus returns to the row that was tapped (QA, 30 Oct)', async () => {
    await start(dumbbellBench(), 1)
    const sheet = await openSheet('Dumbbell bench press')
    const toggle = otherToggle(sheet)
    await userEvent.click(toggle)
    const panel = otherPanel(toggle)
    await userEvent.click(within(panel).getByRole('button', { name: /Barbell bench press/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }))

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel).not.toHaveAttribute('hidden')
    await waitFor(() =>
      expect(within(panel).getByRole('button', { name: /Barbell bench press/ })).toHaveFocus(),
    )
  })
})

describe('in French and Chinese', () => {
  it('fr: "Autres exercices", the note in the tu register, and the disclosure works', async () => {
    await i18n.changeLanguage('fr')
    await start(dumbbellBench())
    const sheet = await openSheet('Développé couché aux haltères')
    const toggle = otherToggle(sheet, 'Autres exercices')

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(sheet).getByText(NOTE_FR)).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /Développé couché à la barre/ })).toBeInTheDocument()
  })

  it('zh-CN: "其他动作", the note, and the disclosure works', async () => {
    await i18n.changeLanguage('zh-CN')
    await start(dumbbellBench())
    const sheet = await openSheet('哑铃卧推')
    const toggle = otherToggle(sheet, '其他动作')

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(sheet).getByText(NOTE_ZH)).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /杠铃卧推/ })).toBeInTheDocument()
  })
})
