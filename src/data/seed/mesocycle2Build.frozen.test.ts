import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'

/**
 * **Mesocycle 2 Build v3 is frozen.** The coach approved it on 23 Oct 2026 and
 * froze it for about three to four rotations, with a review around mid-November
 * (`program-frozen-build-v3`). Until now that freeze was checked only by hand,
 * which means only when somebody remembered to. This is the same check, committed.
 *
 * **The method is the one the team has used all along, not a new one:**
 * `md5(JSON.stringify(mesocycle2Build))`, hex digest. It is recorded as the T8
 * verification command in `~/.claude/plans/plan-track-a-weight-cap.md`, and the
 * Track A commits quote its result ("seed md5 unchanged ... mesocycle2Build
 * 539023aa"). That plan lives outside the repo; the value was re-derived on this
 * tree with the plan's own command (`node --input-type=module -e ...`) before
 * this test was written, and gave `539023aaf5594d6895770e49048b6a3c`.
 *
 * **What it covers.** Everything `JSON.stringify` sees in the exported object:
 * ids, session order, every prescription, ladder rung, rep range, warm-up
 * pointer, revision marker, and any English literal in `program.ts`. Key order
 * counts, so a reorder with no change in meaning also fails — acceptable for a
 * freeze, and the failure says how to tell the difference.
 *
 * **What it deliberately does not cover**, so nobody reads a green run as more
 * than it is:
 *   - Translations of the program's names and cues live in `src/locales/*`
 *     (`seed.json`), not in `program.ts`. A locale edit does not move this hash.
 *   - Library exercises (`exercises.ts`). `seedExercises` changes by design —
 *     Library additions reach existing installs by upsert, and it moved from
 *     `c5a97daa` to `3431ca0b` in Track A — so pinning it would turn every
 *     legitimate addition into a failure. It is not pinned here.
 *   - `seedProgram` (Phase 1 Home), the retired earlier program. It is not
 *     under this freeze; its hand-checked hash is `32330a9f2c05ebd73d9a09aef5b88732`.
 *   - `undefined` fields and functions, which `JSON.stringify` drops.
 *
 * **When this test fails**, the rule is not "update the hash". Run
 * `git diff -- src/data/seed/program.ts` and answer one question: is there a
 * coach ruling for this change? If yes, re-pin `FROZEN_MD5` in the same commit
 * that transcribes the ruling, and cite the ruling in the message. If no, the
 * change is the defect. A comment edit does not fail it (the hash is of the
 * evaluated object, not the source text), so a failure is never a formatting
 * accident.
 *
 * **Negative controls**, run 30 Oct against `program.ts` on this tree (a mutation
 * applied, this file run, `program.ts` restored from a copy, `cmp` clean and
 * `git status` empty for it):
 *   program name `Build` -> `Buile` (one character)     -> RED, current md5 46001e014a04a28348aaadbdd5a674c3,
 *                                                          with the "FROZEN pending the coach's first-rotation review" message
 *   Session A rung `reps: 8` -> `reps: 9` (a prescription) -> RED, current md5 776d7e345fdbe088d0fc3d123a7972b0
 *   a trailing `// ...` comment added to the program    -> GREEN, though git sees a changed line: the hash is of the
 *                                                          evaluated object, not the source text
 * The first two show the pin sees both a label and a training number; the third
 * shows a failure cannot be a formatting accident.
 */
const FROZEN_MD5 = '539023aaf5594d6895770e49048b6a3c'

const md5OfProgram = (): string =>
  createHash('md5').update(JSON.stringify(mesocycle2Build)).digest('hex')

describe('Mesocycle 2 Build v3 is frozen pending the coach\'s first-rotation review', () => {
  it('still hashes to the value checked by hand since 23 Oct', () => {
    const actual = md5OfProgram()

    expect(
      actual,
      [
        'mesocycle2Build no longer matches its frozen hash.',
        `  frozen  md5 ${FROZEN_MD5}`,
        `  current md5 ${actual}`,
        '',
        "Mesocycle 2 Build v3 is FROZEN pending the coach's first-rotation review",
        '(approved 23 Oct 2026, review around mid-November). Any intended change to it',
        'needs a coach ruling first. Re-pinning FROZEN_MD5 is part of transcribing that',
        'ruling, in the same commit and citing it; it is never a way to make this pass.',
        'See `git diff -- src/data/seed/program.ts`, and the docblock at the top of this file.',
      ].join('\n'),
    ).toBe(FROZEN_MD5)
  })
})
