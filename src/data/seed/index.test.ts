import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { seedDatabase } from './index'
import { seedProgram, mesocycle2Build } from './program'
import { programRepo } from '../repositories'

afterEach(async () => {
  await db.programs.clear()
  await db.exercises.clear()
  await db.settings.clear()
})

describe('seedDatabase — seed-clobber guard', () => {
  it('does not revert an imported program that reuses the seed id', async () => {
    const imported = { ...seedProgram, name: "Coach's Phase 1 v3", origin: 'imported' as const }
    await programRepo.put(imported)

    await seedDatabase()

    const stored = await programRepo.getById(seedProgram.id)
    expect(stored).toEqual(imported)
  })

  it('still installs the seed program on a genuine first run', async () => {
    await seedDatabase()

    const stored = await programRepo.getById(seedProgram.id)
    expect(stored).toEqual(seedProgram)
  })

  it('still refreshes an origin "seed" row with a newer seed definition', async () => {
    const staleSeedRow = { ...seedProgram, name: 'Old seed content' }
    await programRepo.put(staleSeedRow)

    await seedDatabase()

    const stored = await programRepo.getById(seedProgram.id)
    expect(stored).toEqual(seedProgram)
  })

  /**
   * docs/design/Mesocycle2Implementation.md §10.1 — the guard must be
   * evaluated per program inside the loop, not once before it, or an
   * imported program under one id would suppress seeding of every other
   * seed program too. This is the test that would fail if seedDatabase
   * ever collapsed back to a single before-the-loop check.
   */
  it('does not let an imported program under one id suppress seeding of the other seed programs', async () => {
    const importedPhase1 = { ...seedProgram, name: "Coach's Phase 1 v3", origin: 'imported' as const }
    await programRepo.put(importedPhase1)

    await seedDatabase()

    const storedPhase1 = await programRepo.getById(seedProgram.id)
    const storedMeso2 = await programRepo.getById(mesocycle2Build.id)
    expect(storedPhase1, 'the imported program stays untouched').toEqual(importedPhase1)
    expect(storedMeso2, 'a second seed program must still install even though the first is imported').toEqual(
      mesocycle2Build,
    )
  })

  it('does not revert an imported mesocycle-2-build that reuses its seed id', async () => {
    const imported = { ...mesocycle2Build, name: "Coach's Build v2.8", origin: 'imported' as const }
    await programRepo.put(imported)

    await seedDatabase()

    const stored = await programRepo.getById(mesocycle2Build.id)
    expect(stored).toEqual(imported)
  })

  it('still installs mesocycle-2-build on a genuine first run', async () => {
    await seedDatabase()

    const stored = await programRepo.getById(mesocycle2Build.id)
    expect(stored).toEqual(mesocycle2Build)
  })
})
