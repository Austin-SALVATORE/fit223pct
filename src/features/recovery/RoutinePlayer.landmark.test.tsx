import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { RoutinePlayer } from './RoutinePlayer'

/**
 * The routine player has exactly one `<main>` landmark, like Workout Mode
 * (`WorkoutPage.landmark.test.tsx`). It mounts outside `AppShell` ("a routine is the
 * same kind of thing: minutes long, one decision at a time", `App.tsx`), and the
 * shell holds the app's only other `<main>`, so the player had none. `Main` gives it
 * one when it is alone and none extra when it is nested in the shell, in every state
 * it can be in: not found, ready, playing.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `RoutinePlayer` renders its screen with no `Main` around it
 *                         -> the three alone-cases
 *   `Main` always renders `<main>` even when nested
 *                         -> "nested inside the shell's own main"
 */

const ROUTINE = 'recovery-stretch-v1'

function renderAlone(routineId: string) {
  return render(
    <MemoryRouter initialEntries={[`/routine/${routineId}`]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/routine/:routineId" element={<RoutinePlayer />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('the routine player has one main landmark', () => {
  it('alone, on its ready screen', async () => {
    renderAlone(ROUTINE)
    await screen.findByRole('button', { name: 'Start' })
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('button', { name: 'Start' }))
  })

  it('alone, while playing', async () => {
    renderAlone(ROUTINE)
    await userEvent.click(await screen.findByRole('button', { name: 'Start' }))
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('alone, for a routine that does not exist', async () => {
    renderAlone('no-such-routine')
    await screen.findByRole('link', { name: /Today/ })
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it("nested inside the shell's own main, it adds none", async () => {
    render(
      <MemoryRouter initialEntries={[`/routine/${ROUTINE}`]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="routine/:routineId" element={<RoutinePlayer />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByRole('button', { name: 'Start' })
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
