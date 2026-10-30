import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Main } from './Main'

/**
 * `Main` renders the page's one `<main>` landmark: the outermost caller gets the
 * element, a caller nested inside it gets a `<div>`, so two screens that each ask
 * for a main can never leave a page with two (QA A13: Workout Mode mounts outside
 * `AppShell` and had none; the fix must not make a nested mount double it).
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `Main` always renders `<main>` (the nested branch never taken)
 *                         -> "nested inside another Main", "the ref and tab stop", the
 *                            landmark test "nested inside the shell's own main", and
 *                            App.crash's "a shell screen" (4 red)
 *   `Main` always renders a `<div>`
 *                         -> "alone", "nested", "the ref and tab stop", all four
 *                            landmark tests, and three App.crash tests (10 red)
 *   the nested branch drops `className`
 *                         -> "keeps the layout classes when nested" (1 red)
 */
describe('Main', () => {
  it('alone: renders the page\'s one main landmark', () => {
    render(<Main className="px-5">content</Main>)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('main')).toHaveTextContent('content')
  })

  it('nested inside another Main: no second landmark', () => {
    render(
      <Main>
        <Main>inner</Main>
      </Main>,
    )
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByText('inner')).toBeInTheDocument()
  })

  it('keeps the layout classes when nested', () => {
    render(
      <Main>
        <Main className="mx-auto max-w-md">inner</Main>
      </Main>,
    )
    expect(screen.getByText('inner')).toHaveClass('mx-auto', 'max-w-md')
  })

  it('the ref and tab stop go to the outermost landmark', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Main ref={ref} tabIndex={-1}>
        <Main>inner</Main>
      </Main>,
    )
    expect(ref.current).toBe(screen.getByRole('main'))
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })
})
