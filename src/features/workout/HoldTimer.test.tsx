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
 */
