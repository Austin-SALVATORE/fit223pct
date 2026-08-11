import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { routineById } from './routines'
import type { IsoWeekday } from '@/lib/dates'

/**
 * The coach's 11 Aug revision made recovery-day stretching generic
 * ("Optional gentle stretching") on mesocycle-2-build's non-training
 * weekdays (2/4/6). The app already ships a fully illustrated guided
 * routine, `recovery-stretch-v1`, that this generic prescription can now
 * legitimately point to — so the item must carry that routineId, and the
 * id must resolve to a real routine in the catalogue. `ActivityItemList`
 * degrades an unknown routineId to plain text silently, so a dead link
 * would otherwise ship unnoticed; this guard fails loudly instead.
 */
describe('mesocycle2Build recovery-day stretching links to the guided routine', () => {
  const recoveryWeekdays: IsoWeekday[] = [2, 4, 6]

  for (const weekday of recoveryWeekdays) {
    it(`weekday ${weekday}'s "Optional gentle stretching" item names recovery-stretch-v1`, () => {
      const activity = mesocycle2Build.weekdayActivities?.[weekday]
      expect(activity, `weekday ${weekday}: no weekdayActivities entry`).toBeDefined()

      const item = activity?.items.find((candidate) => candidate.label === 'Optional gentle stretching')
      expect(item, `weekday ${weekday}: no "Optional gentle stretching" item`).toBeDefined()
      expect(item?.routineId, `weekday ${weekday} routineId`).toBe('recovery-stretch-v1')
    })
  }

  it('recovery-stretch-v1 exists in the routine catalogue (a dead routineId must fail this)', () => {
    expect(routineById('recovery-stretch-v1')).toBeDefined()
  })
})
