import { beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { MorningSection } from './MorningSection'

/**
 * Layer 4 — the v1 "writes nothing" behavioural test (plan §7.5). Mirrors
 * `warmupNoTracking.write.test.tsx`'s method exactly (whole-database
 * snapshot, compared byte for byte): mounting `MorningSection` is the
 * entire surface a write could ever come from, since v1 has no control at
 * all to exercise — no Mark Complete, no skip, no checkbox (§2.3, §5.3's
 * consolidated ruling).
 *
 * **Behavioural, not structural, deliberately** (§7.5's own distinction).
 * A structural guard forbidding `repositories.ts`/`db.ts` would have to be
 * *weakened* the moment daily-`unavailable` lands (§2.4) — the erosion
 * pattern `docs/RecoveryRoutines.md` names. This test instead guards
 * *current behaviour*: adding a control later is an ordinary, visible test
 * update, not a guard that must be loosened first.
 */

async function snapshotDatabase(): Promise<string> {
  const tables = await Promise.all(
    db.tables.map(async (table) => [table.name, await table.toArray()] as const),
  )
  return JSON.stringify(tables)
}

describe('a rendered Morning section writes nothing', () => {
  beforeAll(async () => {
    await seedDatabase()
  })

  it('leaves every table byte-identical after mounting — v1 has no control to exercise', async () => {
    const before = await snapshotDatabase()

    const { unmount } = render(
      <MemoryRouter>
        <MorningSection />
      </MemoryRouter>,
    )
    unmount()

    // A fire-and-forget write not awaited by the component would not have
    // landed in IndexedDB yet at this point — flush pending microtasks and
    // one macrotask before comparing, same reasoning as the warm-up's own
    // version of this test.
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
