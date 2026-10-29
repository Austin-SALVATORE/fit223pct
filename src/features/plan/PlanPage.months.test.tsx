import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import i18n from '@/i18n/i18next'
import { PlanPage } from './PlanPage'

/**
 * Collapsible months on the Program page (athlete feedback, 24 Oct,
 * section 3; owner ruling 29 Oct: "this month open, the others closed,
 * each header shows the month and how many training days it has").
 *
 * Fake today is Mon 27 Jul 2026, as in PlanPage.test.tsx. Phase 1 runs
 * 20 Jul to 9 Aug (Mon/Wed/Sat), so it spans July and August;
 * Mesocycle 2 runs 10 Aug to 31 Dec.
 *
 * "Visible" below always means a role query: testing-library skips
 * `hidden` subtrees there, while a text query (`findByText`) still finds
 * rows inside a collapsed panel. Every assertion about a row being shown
 * or not shown therefore uses `*ByRole('link', …)`.
 *
 * Negative controls, 29 Oct. Each mutation was applied to PlanPage.tsx (or
 * en/plan.json for T9), this file run, the tests below went red, and the
 * file was restored. Tests are named, not line-numbered, so this survives
 * edits. "Also" marks tests that went red as a side effect.
 *   T1  defaultExpanded={true}                      -> T1 (August open)
 *                                                      also T2 T3 T4 T5 T6
 *       delete hidden={!expanded}                   -> T1 (Sat 1 Aug link found)
 *                                                      also T2 T3
 *   T2  onClick -> setExpanded(true)                -> T2, T3
 *       lift state to one openMonth in PlanPage     -> T2 only (July closes
 *                                                      when August opens)
 *   T3  drop id={panelId}                           -> T3 (panel lookup null)
 *       <div role="button" tabIndex={0}> for button -> T3 (Enter does nothing)
 *       <div> for the <h3>                          -> T3 (no level-3 heading)
 *   T4  find(m => m.month === todayMonth)           -> T4, T6, and
 *       (falls through to the last month)              PlanDayPage.test.tsx
 *                                                      "Plan (Mesocycle 2) -> day
 *                                                      -> back" (no Mon 10 Aug link)
 *   T5  drop `?? months.at(-1)`                     -> T5 only
 *   T6  key={group.month} (no program id)           -> T6, and
 *                                                      PlanDayPage.test.tsx "Plan
 *                                                      (Mesocycle 2) -> day -> back
 *                                                      returns to Mesocycle 2, not
 *                                                      the default phase"
 *   T7  hard-code 'en-GB'                           -> T7 fr, T7 zh-CN, T9 fr
 *       drop the first-letter capitalisation        -> T7 fr, T9 fr
 *   T8  days.length                                 -> T8 (12 and 9, not 5 and 4)
 *       d.session !== null                          -> T8 (2 and 4, not 5 and 4)
 *       drop the {' '} before the count            -> T8 and four more
 *                                                      (name reads "July 2026· 5 …")
 *   T9  swap the _one and _other English strings    -> T9 en only
 * T7 and T9 tests also fail under the T8 count mutations because they
 * assert a full header name, count included.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  // T5 moves the clock; every other test starts on Mon 27 Jul.
  vi.setSystemTime(new Date(2026, 6, 27, 9, 0, 0))
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

function renderPlan(path = '/plan') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/" element={<p>TODAY PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** The month header button — matched on the month label alone, whatever count follows. */
function monthButton(label: RegExp): HTMLElement {
  return screen.getByRole('button', { name: label })
}

describe('PlanPage months — which month is open', () => {
  it('T1: opens the current month, closes the others, and hides a closed month\'s rows', async () => {
    renderPlan()
    const july = await screen.findByRole('button', { name: /^July 2026/ })
    const august = monthButton(/^August 2026/)

    expect(july).toHaveAttribute('aria-expanded', 'true')
    expect(august).toHaveAttribute('aria-expanded', 'false')
    // Today (Mon 27 Jul) is in the open month ...
    expect(screen.getByRole('link', { name: /Mon 27 Jul/ })).toBeInTheDocument()
    // ... and Sat 1 Aug is in the closed one. The attribute and the hiding
    // are separate bindings, so the row has to be checked as well.
    expect(screen.queryByRole('link', { name: /Sat 1 Aug/ })).toBeNull()
  })

  it('T4: before the phase starts, opens its first month only (Mesocycle 2 on 27 Jul)', async () => {
    renderPlan('/plan?program=mesocycle-2-build')
    await screen.findByRole('heading', { name: 'Mesocycle 2 — Build' })

    expect(monthButton(/^August 2026/)).toHaveAttribute('aria-expanded', 'true')
    for (const closed of [/^September 2026/, /^October 2026/, /^November 2026/, /^December 2026/]) {
      expect(monthButton(closed)).toHaveAttribute('aria-expanded', 'false')
    }
    expect(screen.getByRole('link', { name: /Mon 10 Aug/ })).toBeInTheDocument()
  })

  it('T5: after the phase ends, opens its last month only (Phase 1 on 15 Sep)', async () => {
    vi.setSystemTime(new Date(2026, 8, 15, 9, 0, 0))
    renderPlan('/plan?program=phase-1-home')
    await screen.findByRole('heading', { name: 'Phase 1 — Home' })

    expect(monthButton(/^August 2026/)).toHaveAttribute('aria-expanded', 'true')
    expect(monthButton(/^July 2026/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('T6: switching phase through PhaseNav applies the new phase\'s default, not the old phase\'s state', async () => {
    renderPlan()
    await screen.findByRole('heading', { name: 'Phase 1 — Home' })
    // Precondition the control depends on: Phase 1's August is collapsed.
    expect(monthButton(/^August 2026/)).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(screen.getByRole('button', { name: /Mesocycle 2 — Build/ }))
    await screen.findByRole('heading', { name: 'Mesocycle 2 — Build' })

    // Mesocycle 2 has not started, so August is its first month and opens.
    expect(monthButton(/^August 2026/)).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('PlanPage months — opening and closing', () => {
  it('T2: months open and close independently', async () => {
    renderPlan()
    const july = await screen.findByRole('button', { name: /^July 2026/ })
    const august = monthButton(/^August 2026/)

    await userEvent.click(august)
    expect(august).toHaveAttribute('aria-expanded', 'true')
    expect(july).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /Sat 1 Aug/ })).toBeInTheDocument()

    await userEvent.click(july)
    expect(july).toHaveAttribute('aria-expanded', 'false')
    expect(august).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('link', { name: /Mon 27 Jul/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Sat 1 Aug/ })).toBeInTheDocument()
  })

  it('T3: the header is a real button inside a level-3 heading, wired to a panel that always exists', async () => {
    renderPlan()
    const july = await screen.findByRole('button', { name: /^July 2026/ })
    const august = monthButton(/^August 2026/)

    expect(screen.getByRole('heading', { level: 3, name: /^July 2026/ })).toBeInTheDocument()

    // aria-controls resolves in both states — the collapsed panel is
    // hidden, not unmounted.
    const julyPanel = document.getElementById(july.getAttribute('aria-controls') ?? '')
    const augustPanel = document.getElementById(august.getAttribute('aria-controls') ?? '')
    expect(julyPanel).not.toBeNull()
    expect(augustPanel).not.toBeNull()
    expect(julyPanel).not.toHaveAttribute('hidden')
    expect(augustPanel).toHaveAttribute('hidden')

    // Keyboard: Enter and Space both toggle a focused header.
    act(() => august.focus())
    await userEvent.keyboard('{Enter}')
    expect(august).toHaveAttribute('aria-expanded', 'true')
    expect(augustPanel).not.toHaveAttribute('hidden')
    await userEvent.keyboard(' ')
    expect(august).toHaveAttribute('aria-expanded', 'false')
    expect(augustPanel).toHaveAttribute('hidden')
  })
})

describe('PlanPage months — the header text', () => {
  it('T8: each header counts the month\'s training days — not every row, not only rows with a session', async () => {
    renderPlan()
    // Mon/Wed/Sat. July from the 20th: Mon 20, Wed 22, Sat 25, Mon 27, Wed 29.
    // August to the 9th: Sat 1, Mon 3, Wed 5, Sat 8. Exact names, so the
    // space between the month and the count is checked too.
    expect(await screen.findByRole('button', { name: 'July 2026 · 5 training days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'August 2026 · 4 training days' })).toBeInTheDocument()
  })

  describe('T9: singular and zero counts', () => {
    // 31 Jul is a Friday (not a training day, but it carries a recovery
    // activity, so it has a row); 1 Aug is a Saturday (training).
    // July therefore has 0 training days and August has 1.
    beforeAll(async () => {
      await programRepo.put({
        ...seedProgram,
        id: 'one-day-month',
        name: 'One day',
        origin: 'imported',
        startDate: '2026-07-31',
        endDate: '2026-08-01',
      })
    })

    afterAll(async () => {
      await db.programs.delete('one-day-month')
    })

    it('says "1 training day", not "1 training days"', async () => {
      renderPlan('/plan?program=one-day-month')
      expect(await screen.findByRole('button', { name: 'August 2026 · 1 training day' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'July 2026 · 0 training days' })).toBeInTheDocument()
    })

    it('French uses the singular for one', async () => {
      await i18n.changeLanguage('fr')
      renderPlan('/plan?program=one-day-month')
      expect(
        await screen.findByRole('button', { name: "Août 2026 · 1 jour d'entraînement" }),
      ).toBeInTheDocument()
    })
  })

  it('T7: the month is written by Intl in the active language, and capitalised as a heading', async () => {
    await i18n.changeLanguage('fr')
    renderPlan()
    // Intl returns "juillet 2026"; a heading starts with a capital.
    expect(
      await screen.findByRole('button', { name: "Juillet 2026 · 5 jours d'entraînement" }),
    ).toBeInTheDocument()
    expect(monthButton(/^Août 2026/)).toBeInTheDocument()
  })

  it('T7: zh-CN gets its own month format and count wording', async () => {
    await i18n.changeLanguage('zh-CN')
    renderPlan()
    expect(await screen.findByRole('button', { name: '2026年7月 · 5 个训练日' })).toBeInTheDocument()
    expect(monthButton(/^2026年8月/)).toBeInTheDocument()
  })
})
