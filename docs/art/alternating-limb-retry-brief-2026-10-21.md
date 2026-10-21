# Art brief — bicycle crunch and mountain climber, one new-method attempt (21 Oct 2026)

**Authority.** Owner ruling on the board, 21 Oct 15:52: "Try once with a new method: one side only, two frames." Memory record of the failure: `~/.claude/agent-memory/asset-generator/alternating-limb-collapse.md` (five attempts on `bicycle-crunch`, mirrored-frame workaround on both ids audited UNFIT and reverted). Both ids are in both `KNOWN_MISSING` lists today.

**What changes.** Not effort, the ask. Every past prompt asked for alternating left/right frames and the model repeated one side. This attempt asks for **one side only, two frames**, and says so honestly in the strip's own form checkpoints and in the cue wording the dev may add later ("then switch sides"). It is a depiction of one half of one repetition, which is accurate and not misleading.

**Hard limit.** Exactly **one generation per id**. If the result is wrong in pose, equipment or frame count, ship nothing and report the gap closed as "model limit, confirmed with the new method". No second try, no renderer swap, no mirroring.

**Frames, both ids: 2.**

1. **`bicycle-crunch`** — camera side, supine on the floor line. Frame 1: supine, hands lightly beside the head, both legs lifted with knees bent at ninety degrees, shoulder blades just off the floor, neutral neck. Frame 2: torso rotated so the **right elbow travels toward the left knee**, the left knee drawn in toward the chest and the right leg extended long and low off the floor; the lower back stays on the floor. The same side in both frames by design; the prose must not mention the other side at all except in the checkpoint "shows one side; the athlete alternates". No alternation words anywhere in the generation prompt.

2. **`mountain-climber`** — camera side, high plank. Frame 1: high plank, hands under shoulders, body one straight line from head to heels, both feet back. Frame 2: **the right knee driven in under the chest**, toes off the floor, the left leg straight and planted, hips level with the shoulders, head neutral. Same side in both frames by design; same rule on the prose.

**Equipment negatives.** No bench, no mat edge drawn as an object, no dumbbells, no bar.

**Pipeline.** As the generator's memory: Sol route with the goblet anchor, scoped `--only` conversion, `update-manifest-dims.mjs`, staleness check, fringe and near-white thresholds, `generation-run.log`. Look at each `reference.png` yourself. Keep the strips' existing `prompt.md` files' locked STYLE BLOCK byte-identical; rewrite only the movement section and checkpoints; the old alternating prose is wrong for this ask and must go.

**Do not touch** `src/**`; both `KNOWN_MISSING` lists are the dev's to edit in the landing commit for any id that passes. Do not commit. Report attempts (one each), files, numbers, and a plain verdict per id.

**Sequencing.** Runs **after** the parallel-bar batch (`docs/art/parallel-bar-batch-brief-2026-10-21.md`) has reported, never concurrently: both write the manifest and `generation-run.log`.
