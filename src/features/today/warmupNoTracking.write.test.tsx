import { beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { warmupById } from '@/data/seed/warmups'
import { WarmupSection } from './WarmupSection'

/**
 * Write guard mirroring routineNoTracking.write.test.tsx's method (whole-
 * database snapshot, compared byte for byte) — for display-only v1,
 * simplified because there is no player and no interaction to drive: the
 * component is static, so mount is the entire surface a write could ever
 * come from. Coach rules 6/9 forbid a ramp-up set from counting toward
 * completion, volume or progression; this closes the door on the
 * `RoutinePlayer.tsx:388-401` failure mode ("an end screen ... writes
 * nothing and imports nothing, so both no-tracking guards pass while it
 * is exactly the tracking affordance ruled out") ever reaching a warm-up,
 * since there is no affordance here at all to grow one.
 */

async function snapshotDatabase(): Promise<string> {
  const tables = await Promise.all(
    db.tables.map(async (table) => [table.name, await table.toArray()] as const),
  )
  return JSON.stringify(tables)
}

describe('a rendered warm-up writes nothing', () => {
  beforeAll(async () => {
    await seedDatabase()
  })

  it('leaves every table byte-identical after mounting every catalogued warm-up', async () => {
    const before = await snapshotDatabase()

    for (const id of [
      'mesocycle2-chest-back-warmup-v1',
      'mesocycle2-legs-core-warmup-v1',
      'mesocycle2-shoulders-arms-warmup-v1',
    ]) {
      const warmup = warmupById(id)!
      const { unmount } = render(<WarmupSection warmup={warmup} />)
      unmount()
    }
    // A fire-and-forget write (a `.then(...)` never awaited by the
    // component) would not have landed in IndexedDB yet at this point —
    // snapshotting immediately after render is a blind instrument for
    // exactly that shape of write. Flush pending microtasks and one
    // macrotask before comparing, so a leaked async write has time to
    // land and actually get caught.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(await snapshotDatabase()).toBe(before)
  })

  it('detects a write — the snapshot is not vacuously equal', async () => {
    const before = await snapshotDatabase()
    const settings = await db.settings.get('user')
    if (!settings) throw new Error('seeded settings record is missing')
    await db.settings.put({ ...settings, locale: 'fr' })
    expect(await snapshotDatabase()).not.toBe(before)
  })
})
