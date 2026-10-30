import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import i18n from '@/i18n/i18next'
import { HoldTimer } from './HoldTimer'

/**
 * Backlog A11 (batch A1): a screen reader could not hear how long a hold had
 * run. The count sat inside the Stop button, whose `aria-label` overrides its
 * content (and whose children are presentational anyway), so in the browser's
 * accessibility tree no node carried it at all; the only way to learn it was to
 * stop and read the Stepper. Now a visually hidden `role="timer"` carries it in
 * words, a polite status speaks "Hold started" and then every ten seconds, and
 * the Stop button keeps its stable name.
 *
 * What these tests pin, and the one that matters most: **the status text changes
 * only at 0, 10, 20 and 30 seconds over a 35-second hold**, not 35 times. Every
 * second is the Stepper flood A10 measured, and a green test about *what* is
 * said would not have caught someone shortening the cadence.
 *
 * jsdom has no screen reader and no accessibility tree beyond what
 * dom-accessibility-api computes, so this file pins the DOM that produces the
 * tree. **The evidence is the real browser's tree**, Chromium 151.0.7922.34
 * (playwright-core 1.62.1, CDP `Accessibility.getFullAXTree`), on the real
 * Plank screen, with a fake clock running 35 simulated seconds:
 *
 *                              before                      after
 *   nodes carrying the time    none ("12s" is in no        timer "12 seconds elapsed"
 *                              node; button name           button "Stop hold"
 *                              "Stop hold")                status (polite, atomic)
 *   live-region text changes   0                           4: "Hold started", then
 *   over 35 seconds                                        "10 / 20 / 30 seconds elapsed"
 *   fr / zh-CN                 -                           "12 secondes écoulées" /
 *                                                          "已过 12 秒", same 4 changes
 *   the button and container   identical to the pixel      (idle and running, 3
 *   rects                      before and after            languages, 320 and 375px)
 *
 * Alternatives rejected, with why (the report for A1 repeats this):
 *   - announce every second: the A10 flood; talks over the athlete's breathing;
 *   - every 5 seconds: 12 a minute, a metronome;
 *   - a changing `aria-label` on the Stop button: screen readers disagree about
 *     re-announcing a focused control's name, so it is unreliable at best and a
 *     flood on the ones that do (JAWS), and it loses the stable name;
 *   - `aria-describedby` from the button to the timer: description changes on a
 *     focused control have the same disagreement, and a phone user reaches the
 *     timer by swiping anyway, since it is the element before the button;
 *   - `aria-live="assertive"`: interrupts whatever the reader is saying;
 *   - the timer alone, no announcements: reachable on demand, but a hold is done
 *     hands-on-floor, so there is no hands-free way to know the time.
 *
 * Negative controls, run 30 Oct (mutation applied to `HoldTimer.tsx`, this file
 * run, restored, `cmp` clean): see the list under the tests.
 */

const onComplete = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  onComplete.mockReset()
})

afterEach(async () => {
  vi.useRealTimers()
  await i18n.changeLanguage('en')
})

function runFor(seconds: number) {
  for (let i = 0; i < seconds; i++) act(() => void vi.advanceTimersByTime(1000))
}

const statusText = () => screen.getByRole('status').textContent ?? ''

async function startHold(language = 'en', start = 'Start hold') {
  await i18n.changeLanguage(language)
  render(<HoldTimer onComplete={onComplete} />)
  fireEvent.click(screen.getByRole('button', { name: start }))
}

describe('HoldTimer — the elapsed time is reachable without a flood', () => {
  it('has the polite status mounted and empty before the hold starts, so the first message is announced', () => {
    render(<HoldTimer onComplete={onComplete} />)
    // A live region inserted with its text already in it is often not announced;
    // this one must exist, empty, before the text arrives.
    expect(statusText()).toBe('')
    expect(screen.queryByRole('timer')).toBeNull()
  })

  it('keeps the status region polite, before and during the hold: never assertive, never off', async () => {
    // `role="status"` is polite on its own, so the attribute is normally absent. What must never be
    // there is "assertive" (it interrupts whatever the reader is saying, every 10 seconds) or "off"
    // (it would silence the region, so nothing is ever announced).
    const politeness = () => screen.getByRole('status').getAttribute('aria-live')
    render(<HoldTimer onComplete={onComplete} />)
    expect([null, 'polite']).toContain(politeness())

    fireEvent.click(screen.getByRole('button', { name: 'Start hold' }))
    runFor(12)
    expect(statusText()).toBe('10 seconds elapsed')
    expect([null, 'polite']).toContain(politeness())
  })

  it('carries the time in words on a timer that updates every second and is not live', async () => {
    await startHold()
    runFor(3)
    const timer = screen.getByRole('timer')
    expect(timer).toHaveTextContent('3 seconds elapsed')
    expect(timer).toHaveAttribute('datetime', 'PT3S')
    runFor(9)
    expect(timer).toHaveTextContent('12 seconds elapsed')
    // A timer is silent by default; an explicit politeness would make it speak every second.
    expect(timer).not.toHaveAttribute('aria-live', 'polite')
    expect(timer).not.toHaveAttribute('aria-live', 'assertive')
  })

  it('puts the timer before the Stop button, the order a swipe reaches it in', async () => {
    await startHold()
    runFor(2)
    const timer = screen.getByRole('timer')
    const stop = screen.getByRole('button', { name: 'Stop hold' })
    expect(timer.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('SPEAKS only at 0, 10, 20 and 30 seconds over a 35-second hold — not every second', async () => {
    await startHold()
    const spoken: string[] = [statusText()]
    for (let second = 1; second <= 35; second++) {
      runFor(1)
      if (statusText() !== spoken[spoken.length - 1]) spoken.push(statusText())
    }
    expect(spoken).toEqual(['Hold started', '10 seconds elapsed', '20 seconds elapsed', '30 seconds elapsed'])
  })

  it('keeps the Stop button\'s name stable, so nothing re-announces it', async () => {
    await startHold()
    runFor(1)
    const stop = screen.getByRole('button', { name: 'Stop hold' })
    runFor(29)
    expect(screen.getByRole('button', { name: 'Stop hold' })).toBe(stop)
    expect(stop).toHaveAttribute('aria-label', 'Stop hold')
  })

  it('leaves the visible count as it was and hides it from assistive technology', async () => {
    await startHold()
    runFor(12)
    const stop = screen.getByRole('button', { name: 'Stop hold' })
    const visible = stop.querySelector('time')
    expect(visible).toHaveTextContent('12s')
    expect(stop).toHaveTextContent('12s — Stop')
    expect(visible).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps keyboard focus on the very same button through start and stop', () => {
    render(<HoldTimer onComplete={onComplete} />)
    const button = screen.getByRole('button', { name: 'Start hold' })
    button.focus()
    expect(document.activeElement).toBe(button)

    fireEvent.click(button)
    runFor(2)
    // Same DOM node: React kept the element, so focus did not drop to <body>.
    expect(screen.getByRole('button', { name: 'Stop hold' })).toBe(button)
    expect(document.activeElement).toBe(button)

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: 'Start hold' })).toBe(button)
    expect(document.activeElement).toBe(button)
  })

  it('stops quietly: reports the elapsed seconds, removes the timer and clears the status', async () => {
    await startHold()
    runFor(24)
    fireEvent.click(screen.getByRole('button', { name: 'Stop hold' }))
    expect(onComplete).toHaveBeenCalledWith(24)
    expect(screen.queryByRole('timer')).toBeNull()
    expect(statusText()).toBe('')
  })

  it('uses the singular for one second, in English and French', async () => {
    await startHold()
    runFor(1)
    expect(screen.getByRole('timer')).toHaveTextContent(/^1 second elapsed$/)
    cleanup()
    await startHold('fr', 'Démarrer le maintien')
    runFor(1)
    expect(screen.getByRole('timer')).toHaveTextContent(/^1 seconde écoulée$/)
  })

  it.each([
    ['fr', 'Démarrer le maintien', 'Arrêter le maintien', '12 secondes écoulées', ['Maintien démarré', '10 secondes écoulées', '20 secondes écoulées', '30 secondes écoulées']],
    ['zh-CN', '开始保持', '停止保持', '已过 12 秒', ['已开始保持', '已过 10 秒', '已过 20 秒', '已过 30 秒']],
  ])('%s: the timer, the stable name and the same four announcements', async (language, start, stop, timerAt12, announcements) => {
    await startHold(language, start)
    const spoken: string[] = [statusText()]
    for (let second = 1; second <= 35; second++) {
      runFor(1)
      if (second === 12) {
        expect(screen.getByRole('timer')).toHaveTextContent(timerAt12)
        expect(screen.getByRole('button', { name: stop })).toBeInTheDocument()
      }
      if (statusText() !== spoken[spoken.length - 1]) spoken.push(statusText())
    }
    expect(spoken).toEqual(announcements)
  })
})

/*
 * Negative controls, run 30 Oct (mutation applied to `HoldTimer.tsx`, or to
 * `en/workout.json` where marked, this file run, restored, `cmp` clean; the
 * locale file was reversed by hand and checked against `git diff ed9a6d1`),
 * red tests named:
 *   cadence 10 -> 1                                   -> "SPEAKS only at 0, 10, 20 and 30", and the fr and zh-CN rows
 *   `role="timer"` removed                            -> 5: the timer test, the order test, the singular test, fr, zh-CN
 *   `aria-label` made `Stop hold, <elapsed>`          -> 7, including "keeps the Stop button's name stable"
 *   status mounted only while running                 -> "has the polite status mounted and empty before the hold
 *                                                        starts" and "stops quietly"; the cadence test stays GREEN
 *                                                        (it starts counting after the click), which is why the
 *                                                        mounted-before test exists
 *   `aria-hidden` removed from the visible count      -> "leaves the visible count as it was and hides it"
 *   the running button wrapped in a <span>            -> "keeps keyboard focus on the very same button" (the DOM
 *                                                        node is replaced, so focus drops to <body>)
 *   `aria-live="polite"` added to the timer           -> "carries the time in words on a timer ... not live"
 *   the timer moved after the button                  -> "puts the timer before the Stop button"
 *   `elapsed_one` in en given the plural wording      -> "uses the singular for one second" (en/workout.json)
 * Added after the independent check, which found that none of the first eleven tests
 * could see the politeness of the status region (it put `aria-live="assertive"` on
 * the span and all eleven stayed green):
 *   `aria-live="assertive"` on the status span        -> "keeps the status region polite" ONLY; the other 11 green
 *   `aria-live="off"` on the status span              -> the same one test (it would silence the region)
 */

/**
 * **The hold button is the same width in every state** (batch A2, QA). The pill
 * printed different words idle ("Démarrer le maintien") and running ("12s —
 * Arrêter"), so it changed width the moment it was pressed, and again at 10 s and
 * 100 s when the count gained a digit: the target under the thumb moved, which is
 * the F1 lesson (a press must never land on a moved target) in a new place. Now
 * both states carry the same two hidden sizing lines in one grid cell, so the width
 * is the widest of them by construction, in any language.
 *
 * jsdom has no layout. This file pins the structure that produces the width: the
 * two sizing lines, identical in both states, stacked in one cell, at the heavier
 * weight, hidden from assistive technology. **The evidence is the rects**,
 * Chromium 151.0.7922.34 (playwright-core 1.62.1), touch, `isMobile`, the real
 * Plank screen, a fake clock. The button's width, before -> after, through idle,
 * running at 0 / 9 / 10 / 99 / 100 s, and stopped (x and height also compared):
 *
 *   en 320 / 375   99.06, 98.19, 107.25, 116.31, 99.06    -> 120.88 in every state
 *   fr 320 / 375   171.97, 114.98, 124.05, 133.11, 171.97 -> 175.3 in every state
 *   zh 320 / 375   91.13, 104.16, 113.22, 122.28, 91.13   -> 126.84 in every state
 *   x, before: fr 74.02 idle -> 102.5 running (a 28px jump), then 97.97 at 10 s and
 *   93.44 at 100 s; after: one x per language and width. Height 44 throughout.
 *
 * And the consequence, not only the geometry: tap the idle button 6px in from its
 * left edge, then tap the same point again. Before, in French at 320 and at 375, the
 * second tap missed the moved button and **the hold kept running**; English and
 * Chinese survived that point by luck of where their edges moved. After, the second
 * tap stopped the hold in all six cases.
 *
 * Two details measured on the way, both in `HoldTimer.tsx`'s comments: a ghost set as
 * one text run came out 0.03px narrower than the real label at 100 s (the real label
 * is a `<time>` plus a text node, shaped separately), so the ghost has the same
 * inline structure; and even then "100s" was one layout unit (1/64px) wider than
 * "000s", so the widest ghost has `pr-px`, 1px of slack the real label cannot exceed.
 * The French width went 172 -> 175.3 because the reserved label is semibold, the
 * heavier weight, whichever state is drawn.
 *
 * Negative controls, run 30 Oct (mutation applied to `HoldTimer.tsx`, this file run,
 * restored from a saved copy, `cmp` clean), red tests named:
 *   the idle button loses its sizing lines           -> 4: "idle and running carry the same two ...", "stacks the
 *                                                       real label ...", and "<lang>: the sizing lines use the language's
 *                                                       own labels" (fr, zh-CN)
 *   the running button loses its sizing lines        -> 3: "idle and running carry the same ...", fr, zh-CN
 *   the reserved count "000s" -> "00s"               -> the same 3
 *   a sizing line not `aria-hidden`                  -> 17 across the workout suite (16 here and the old
 *                                                       SetScreen.holdTimer test): the accessible name becomes
 *                                                       "Start holdStart hold", so every role query by name fails
 *   `inline-grid` -> `inline-flex` on the idle button -> "stacks the real label ..." and the touch-target guard
 *                                                       (which now states `inline-grid min-h-11`)
 *   the 1px slack `pr-px` removed                    -> "stacks the real label ..."
 *   the sizing weight `font-semibold` -> `font-medium` -> "stacks the real label ..."
 * Browser: with both sizing lines removed the old behaviour returns, the BEFORE numbers above
 * (the rects script counted 8 unstable: all 6 width cases and both French edge taps). Without `pr-px`
 * the width differed by 0.01 to 0.02px (one layout unit) at 100 s in en and zh-CN.
 */
describe('HoldTimer — the button is the same width in every state', () => {
  /** The hidden sizing lines inside a button. */
  const sizingOf = (button: HTMLElement) =>
    Array.from(button.querySelectorAll<HTMLElement>('[aria-hidden="true"].invisible'))

  it('idle and running carry the same two hidden sizing lines: the idle label, and the longest running label', () => {
    render(<HoldTimer onComplete={onComplete} />)
    const idle = screen.getByRole('button', { name: 'Start hold' })
    const idleLines = sizingOf(idle)
    expect(idleLines).toHaveLength(2)
    expect(idleLines[0]).toHaveTextContent(/^Start hold$/)
    // The count is reserved at three digits ("000s"): a hold gaining a digit at 10 s and 100 s moves nothing.
    expect(idleLines[1]).toHaveTextContent(/^000s — Stop$/)

    fireEvent.click(idle)
    runFor(12)
    const running = screen.getByRole('button', { name: 'Stop hold' })
    // Byte for byte the same markup, so the reserved width cannot differ between states.
    expect(sizingOf(running).map((el) => el.outerHTML)).toEqual(idleLines.map((el) => el.outerHTML))
  })

  it('stacks the real label and the sizing lines in one grid cell, the sizing at the heavier weight', () => {
    render(<HoldTimer onComplete={onComplete} />)
    const idle = screen.getByRole('button', { name: 'Start hold' })
    expect(idle.className).toMatch(/\binline-grid\b/)
    expect(idle.className).toMatch(/\bmin-h-11\b/)
    for (const child of Array.from(idle.children)) {
      expect(child.className, child.outerHTML).toMatch(/\bcol-start-1\b/)
      expect(child.className, child.outerHTML).toMatch(/\brow-start-1\b/)
    }
    for (const line of sizingOf(idle)) {
      // semibold is the heavier of the two states' weights, so the reserved width holds whichever is drawn.
      expect(line.className).toMatch(/\bfont-semibold\b/)
      expect(line.className).toMatch(/\binvisible\b/)
    }
    // 1px of slack on the widest line: the real label has measured one layout unit wider than its ghost.
    expect(sizingOf(idle)[1].className).toMatch(/\bpr-px\b/)
  })

  it('does not change the accessible name: the sizing lines are hidden from assistive technology', () => {
    render(<HoldTimer onComplete={onComplete} />)
    expect(screen.getByRole('button', { name: 'Start hold' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start hold' }))
    runFor(3)
    expect(screen.getByRole('button', { name: 'Stop hold' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /000s/ })).toBeNull()
  })

  it.each([
    ['fr', 'Démarrer le maintien', 'Arrêter le maintien', /^000s — Arrêter$/],
    ['zh-CN', '开始保持', '停止保持', /^000s ——停止$/],
  ])('%s: the sizing lines use the language\'s own labels', async (language, start, stop, longest) => {
    await i18n.changeLanguage(language)
    render(<HoldTimer onComplete={onComplete} />)
    const idle = screen.getByRole('button', { name: start })
    const lines = sizingOf(idle)
    expect(lines[0]).toHaveTextContent(start)
    expect(lines[1]).toHaveTextContent(longest)
    fireEvent.click(idle)
    runFor(2)
    expect(sizingOf(screen.getByRole('button', { name: stop })).map((el) => el.outerHTML)).toEqual(
      lines.map((el) => el.outerHTML),
    )
  })
})
