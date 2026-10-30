import { spokenQuantity, spokenSpan, type Translate } from '@/features/today/spokenPrescription'

/**
 * "Target, 5 to 8 reps" — the sentence the range caption "Target · 5–8 reps" stands for
 * (batch A3 for the set screen, batch A4 for the rest screen's next-up card).
 *
 * Two screens print that caption from the same two keys (`setScreen.targetRepRange` and
 * `setScreen.targetSecondsRange`), so the sentence is built in one place: the dot and the en
 * dash are punctuation to a reader, and a range whose ends are equal is one number, not "10
 * to 10". The key is namespaced (`workout:`) so any screen's `t` can call it.
 */
export function spokenTargetRange(t: Translate, mode: 'reps' | 'seconds', min: number, max: number): string {
  return t('workout:setScreen.targetRangeSpoken', { what: spokenQuantity(t, mode, spokenSpan(t, min, max), max) })
}
