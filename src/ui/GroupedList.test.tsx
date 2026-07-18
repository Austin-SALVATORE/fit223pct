import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GroupedList, GroupedRow } from './GroupedList'

/**
 * Regression tests for the grouped-list geometry contract (see component
 * docblock): interaction backgrounds must never bleed past the rounded
 * group boundary, for first/middle/last/single rows alike.
 *
 * The geometry is enforced by construction — the container clips
 * (`overflow-hidden` + radius) and rows use an inset focus ring — so these
 * tests pin exactly those classes. Removing either breaks the contract.
 */

function renderGroup(rowCount: number) {
  return render(
    <MemoryRouter>
      <GroupedList label="Test group">
        {Array.from({ length: rowCount }, (_, i) => (
          <GroupedRow key={i} to={`/item-${i}`}>
            <span>Row {i}</span>
          </GroupedRow>
        ))}
      </GroupedList>
    </MemoryRouter>,
  )
}

describe('GroupedList geometry contract', () => {
  it('clips children to the rounded boundary so no row state can bleed', () => {
    renderGroup(3)
    const list = screen.getByRole('list', { name: 'Test group' })
    expect(list.className).toContain('overflow-hidden')
    expect(list.className).toContain('rounded-card')
    expect(list.className).toContain('divide-y')
  })

  it('gives every row (first, middle, last) identical full-bleed interaction geometry', () => {
    renderGroup(3)
    const rows = screen.getAllByRole('link')
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row.className).toContain('hover:bg-raised')
      expect(row.className).toContain('active:bg-raised')
      expect(row.className).toContain('w-full')
    }
  })

  it('uses an inset focus ring on rows — the clipped container must never swallow keyboard focus', () => {
    renderGroup(3)
    for (const row of screen.getAllByRole('link')) {
      expect(row.className).toContain('focus-inset')
    }
  })

  it('handles a single-item group with the same clipped container', () => {
    renderGroup(1)
    const list = screen.getByRole('list', { name: 'Test group' })
    expect(list.className).toContain('overflow-hidden')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('renders non-interactive rows without a link', () => {
    render(
      <GroupedList label="Static group">
        <GroupedRow>
          <span>Static row</span>
        </GroupedRow>
      </GroupedList>,
    )
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Static row')).toBeInTheDocument()
  })
})
