import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderHook } from '@testing-library/react'
import i18n from '@/i18n/i18next'
import type { ActivityTemplate } from '@/domain/types'
import type { Routine } from '@/domain/routine'
import { useLocalizedActivity } from '@/i18n/seedProgram'
import { ActivityItemList } from './ActivityItemList'

/**
 * The entry point: a recovery item that names a routine becomes tappable,
 * and one that doesn't keeps exactly the markup it always had.
 */

const ROUTINE: Routine = { id: 'stretching', steps: [{ id: 'test-hamstring', holdSeconds: 30 }] }

vi.mock('@/data/seed/routines', async () => {
  const actual = await vi.importActual<typeof import('@/data/seed/routines')>(
    '@/data/seed/routines',
  )
  return {
    ...actual,
    routineById: (id: string) => (id === 'stretching' ? ROUTINE : undefined),
  }
})

beforeAll(() => {
  i18n.addResourceBundle(
    'en',
    'seed',
    { program: { 'test-program': { activity: { 2: { title: 'Recovery day' } } } } },
    true,
    true,
  )
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function renderList(items: { label: string; detail?: string; routineId?: string }[]) {
  return render(
    <MemoryRouter>
      <ActivityItemList items={items} />
    </MemoryRouter>,
  )
}

describe('activity items as entry points', () => {
  it('links an item that names a routine', () => {
    renderList([{ label: 'Stretch', detail: '10–15 minutes', routineId: 'stretching' }])

    const link = screen.getByRole('link', { name: /Stretch/ })
    expect(link).toHaveAttribute('href', '/routine/stretching')
    expect(link).toHaveTextContent('Stretch')
    expect(link).toHaveTextContent('10–15 minutes')
  })

  it('leaves an ordinary item as plain text', () => {
    renderList([{ label: 'Complete rest is a fine choice too' }])

    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Complete rest is a fine choice too')).toBeInTheDocument()
  })

  it('degrades an unknown routine to plain text, never a dead link', () => {
    // An imported program may name a routine this build doesn't have.
    renderList([{ label: 'Stretch', routineId: 'no-such-routine' }])

    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Stretch')).toBeInTheDocument()
  })

  it('renders a mixed list without making the plain items look degraded', () => {
    renderList([
      { label: 'Stretch', routineId: 'stretching' },
      { label: 'Complete rest is a fine choice too' },
    ])

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('Complete rest is a fine choice too')).toBeInTheDocument()
  })
})

describe('useLocalizedActivity carries routineId through localization', () => {
  const activity: ActivityTemplate = {
    kind: 'recovery',
    title: 'Recovery day',
    items: [
      { label: 'Stretch', detail: '10–15 minutes', routineId: 'stretching' },
      { label: 'Walk' },
    ],
  }

  /**
   * The silent one. useLocalizedActivity rebuilds each item as a fresh
   * object literal, so a field it doesn't name is dropped with no error —
   * and the symptom is only that the affordance never appears.
   *
   * Tested in a non-English locale on purpose: English is the fallback, so a
   * regression that drops the field could hide behind it.
   */
  it('preserves routineId in fr', async () => {
    await i18n.changeLanguage('fr')

    const { result } = renderHook(() =>
      useLocalizedActivity('test-program', 2, activity, 'seed'),
    )

    expect(result.current.items[0].routineId).toBe('stretching')
    expect(result.current.items[1].routineId).toBeUndefined()
  })

  it('preserves routineId in zh-CN', async () => {
    await i18n.changeLanguage('zh-CN')

    const { result } = renderHook(() =>
      useLocalizedActivity('test-program', 2, activity, 'seed'),
    )

    expect(result.current.items[0].routineId).toBe('stretching')
  })

  it('preserves routineId for an imported program, which returns the stored object', async () => {
    await i18n.changeLanguage('fr')

    const { result } = renderHook(() =>
      useLocalizedActivity('test-program', 2, activity, 'imported'),
    )

    // Imported content renders verbatim, so this path returns the activity
    // untouched — the field survives by a different route, and both need
    // covering or one can regress silently.
    expect(result.current.items[0].routineId).toBe('stretching')
    expect(result.current.items[0].label).toBe('Stretch')
  })
})
