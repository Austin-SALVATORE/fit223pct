import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { seedDatabase } from './index'
import { seedProgram } from './program'
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
})
