import { exerciseAsset, type ExerciseAsset } from './exerciseAsset'

/**
 * Which of a stretch's two illustrations to show. The owner ruled two frames
 * per stretch (docs/RecoveryRoutines.md, ruling 5) and the player gives the
 * second one a job: the lead-in shows `entry`, and the display switches to
 * `held` when the hold timer starts.
 */
export type RoutineStepPose = 'entry' | 'held'

const POSE_FRAME: Readonly<Record<RoutineStepPose, number>> = {
  entry: 1,
  held: 2,
}

/**
 * Art for a routine step.
 *
 * Stretch art shares the exercise asset tree — the pipeline discovers ids by
 * directory scan under `public/assets/exercises/`, so a stretch is just
 * another folder there and `scripts/**` needs no change (which matters,
 * since scripts are owner territory). A separate tree would mean editing
 * four scripts that hard-code their root, to fix a naming smell that this
 * distinct accessor already contains.
 *
 * Keeping a separate accessor rather than calling `exerciseAsset` directly
 * from the player is the point: at the call site, routine art and Library
 * art stay visibly different things, and `.claude/rules/program-content.md`'s
 * rule that art-only ids must be *promoted* into the Library does not apply
 * to these — stretches are deliberately not Library exercises and must never
 * be promoted into it.
 *
 * Returns null for an unknown id or a missing frame, like its delegate:
 * assets never block a feature, and the player renders its asset-free layout.
 */
export function routineStepAsset(stepId: string, pose: RoutineStepPose): ExerciseAsset | null {
  const frame = exerciseAsset(stepId, 'frame', POSE_FRAME[pose])
  // Falls back to the entry frame so a single-frame stretch still shows
  // something during the hold rather than going blank halfway through.
  if (frame === null && pose === 'held') return exerciseAsset(stepId, 'frame', POSE_FRAME.entry)
  return frame
}
