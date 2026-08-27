# Verification

Claims are verified by running commands, not by reading reports.

## Project commands

| Purpose | Command | Notes |
|---|---|---|
| Install | `npm install` | |
| Test (all) | `npm test` (`vitest run`) | Baseline is stated as *N tests / M files* — compare both |
| Test (single file) | `npx vitest run <path>` | |
| Lint | `npm run lint` (`oxlint`) | |
| Typecheck | `npm run typecheck` (`tsc -b`) | **The only typecheck — see below** |
| Build | `npm run build` (`tsc -b && vite build`) | |
| Run locally | `npm run dev` (`vite`) | Binds `localhost`; `127.0.0.1` may refuse |

**Known-broken, recorded so nobody reaches for it again:**

- **`tsc --noEmit -p .` silently exits 0 while checking nothing.** The
  root config is a solution file with `files: []`, so it type-checks an
  empty set. It once passed a whole session's work without looking at
  it. `npm run typecheck` runs `tsc -b`, which follows the project
  references and actually checks the code.
- **`curl http://127.0.0.1:5173` can fail while the dev server is up.**
  Vite prints and binds `localhost`, which may resolve to IPv6 only.
  A connection refusal there is not evidence the server failed to start.

A command that exits 0 without checking anything is the most expensive
kind of tooling defect, because it is indistinguishable from success —
and the whole team keeps reaching for it until it is written down.

## Rules

- Verify against the **committed tree**, not the working tree. A claim
  about what shipped is a claim about `origin/main`.
- Before accepting "green", run the suite yourself and compare counts.
  Before accepting "deployed", check the artifact or the device.
- Report failures with their output. A skipped step is stated as
  skipped. "Green except known failures" is not green — name them.

- **A clean result from an instrument that cannot see the subject is
  not evidence — and re-running it does not make it evidence.** This is
  the most frequent failure in this repo. Instances, all the same shape:
  `tsc --noEmit -p .` exiting 0 against `files: []`; `git diff HEAD`
  reporting no change on a gitignored `reference.png`; an i18n guard
  passing while its regex silently discarded every `tCommon()` call; a
  plural-family count read from a regex that cannot see namespaces; a
  touch-target test satisfied by a *sibling's* correct sizing; and a
  ladder assertion that passed whether the ladder had been eased from
  three rungs or had always been two.

  The trap is not the wrong answer, it is what happens next. **The
  natural response to doubt is to run the same instrument harder** — a
  wider character class, a second `git status`, another look at the
  console — and the agreement reads as confirmation while the blind spot
  is untouched. (30 Jul: the lead "corrected" a plural-family count from
  20 to 18, re-ran with a wider character class, and took the matching
  answer as proof. The collision was in namespacing, which no character
  class can reach; the wider pattern could only ever have agreed.)

  So the question is never "did the check pass?" but **"could this check
  have failed for the reason I care about?"** If you cannot say how it
  would fail, you have not measured anything. Change *instrument*, not
  *effort*: a different tool, a different layer, or a deliberate break.

- **A guard is not evidence until it has been made to fail on purpose.**
  A test written for a bug and never seen red is indistinguishable from
  a test that checks nothing, and it is worse than no test because it
  stops anyone else from looking. Break the thing it guards, watch it go
  red, name the key or line in the output, restore. (30 Jul: an i18n
  guard shipped green with the exact key it was written for deleted from
  every locale. Only a negative control caught it. 31 Jul: a length
  assertion on an eased ladder passed *and kept passing* when the seed's
  own ladder was shrunk — it could not distinguish "eased from three"
  from "always two". The dev found it by running a control nobody asked
  for, on an assertion that was already green.) Where a wrong "all
  clear" would be silent, the negative control belongs to a *different*
  role than the author — whoever wrote it already believes it works.

- **Prescribing a negative control is itself a claim about the code, and
  needs the same grounding as any other.** The rule above governs a guard
  someone *wrote*. This one governs a control someone *specified* — a
  plan, a brief, a review comment saying "break X and watch it go red."
  That sentence asserts that a specific mutation reproduces a specific
  defect, which is a claim about how the code actually behaves, and it
  can be wrong in exactly the way a `file:line` citation can be wrong.

  When it is wrong the failure is silent and expensive: the implementer
  runs the prescribed mutation, sees green, and the natural reading is
  "no defect here" rather than "this control cannot see the subject."
  The control was the thing that was supposed to catch a wrong belief,
  so nothing downstream is looking any more.

  So ground the mutation before prescribing it — trace the branch it is
  meant to reach — and when you receive one, treat a green result as a
  question rather than an answer. (27 Aug: a plan justified a
  branch-independent design by naming a specific branch, then prescribed
  a control derived from that wrong mechanism. `programRepo.getActive`
  falls back to the most recent *past* program, so the gate the control
  removed was never `undefined` and the test stayed green. The dev
  refused to accept the pass, found a mutation that genuinely reproduced
  the coupling, and kept **both** attempts in the test's docblock — the
  discarded one is the more instructive half, because it shows the next
  reader why the obvious control fails.)

  This catch is earlier and cheaper than the one above: a bad control
  costs a wrong belief at specification time, before anyone has written
  the guard it was meant to validate.

- **Ignored and generated files are invisible to git, so git cannot
  answer questions about them.** `public/assets/exercises/*/reference.png`
  is gitignored (`.gitignore:34`) — the authoring source is untracked
  while its derived AVIFs and manifest entries are committed. So
  `git status` and `git diff HEAD` report **nothing** for a reference
  image that has completely changed, and a clean status is not evidence
  that asset content is unchanged. Claims about ignored trees come from
  mtimes, content hashes, or the manifest — never from git. (30 Jul: the
  lead concluded a regenerated art batch had been lost because
  `git diff HEAD` showed no change; the art was intact on disk. Both
  instruments were blind to the subject, and the conclusion was asserted
  anyway.)

- **A generated artifact older than its source is stale, and nothing
  downstream will notice.** The file exists, the source now reads
  correctly, and the artifact contradicts it. `convert-assets.mjs` reads
  `prompt.md` for frame count and `reference.png` for pixels and never
  compares their timestamps, so a corrected prompt will happily ship an
  uncorrected image. Compare mtimes before consuming any generated tree:

  ```sh
  # `stat` is not portable: -f %m is BSD/macOS, -c %Y is GNU/Linux.
  mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1"; }
  [ "$(mtime out)" -lt "$(mtime src)" ] && echo STALE
  ```

  Or, with no `stat` at all: `[ src -nt out ] && echo STALE`. (28 Jul: a
  wall asset generated ten minutes before its own corrected prompt,
  while the correction was in flight. Caught by mtime, not by any check
  in the pipeline.)

- **A citation is a claim.** A comment, docblock, or memory note saying
  "documented in X" is not evidence that X says it — open X.
  Cross-references rot faster than the code around them, and a stale
  pointer propagates a false belief into every reader who follows it
  without looking. (27 Jul: a deleted docblock claimed an i18n exclusion
  was "documented in docs/I18n-adding-a-locale.md"; that doc had never
  carried the claim. 6 Aug: `schedule.ts:189` justified weekday-pinning
  by citing "docs/PyramidProgression.md's scheduling section, Question A
  consequence #4" — that document has no Question A and never mentions
  pinning. Five sites carried variants of it.)

- **A plan invalidates its own citations as it is executed**, and its
  first phase is the worst offender, because everything downstream is
  still unwritten when it lands. So **resolve a citation by content, not
  by number**: find the rule, symbol or comment it names, and treat the
  number as a hint. Anchor to a name when writing one — a citation that
  cannot go stale beats one that is merely correct today.

  Distinguish the two failure modes when reporting them, because they
  mean different things: a citation landing a few lines off is **drift**;
  a citation naming something that does not exist is a **defect**, and
  only the second means the author was wrong about the code.

  Do not answer this by re-numbering a long plan by hand. That acquires
  new errors faster than it sheds old ones — state the known offsets in
  the plan's header instead, and let readers resolve by name.

- **A version number is a claim about a specific machine, so read it off
  that machine.** A registry query, a docs page, or memory tells you what
  is *published* — not what is installed, and therefore not what any
  result was produced with. Prefer the offline command (`npm ls <pkg>`,
  the lockfile) over the one that reaches the network. This matters most
  in a table headed "verified", where a registry lookup silently upgrades
  a measurement into a claim about a version nothing was run against.

- **A spawn's model and kind are checkable, so check them.** What a
  definition declares is not evidence of what a spawn got:

  ```sh
  grep -oE '"model" *: *"[^"]{1,40}"' \
    ~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl \
    | sort -u
  ```

  Never `cat` or `tail` that file — it is the full JSONL transcript and
  reading it whole overflows context. A bench role with *no* file under
  `subagents/` was not spawned as a subagent at all. (28 Jul: two bench
  roles spawned with task-shaped names came back as teammates on the
  lead's model, and the first was explained away as the definition
  working correctly.) The `.meta.json` beside it names `taskKind` and the
  spawn's `name` — read both before believing a self-report.

- **A guarantee you have not checked is a guarantee you do not have.**
  Read it off the mechanism — the `tools:` line, the config, the actual
  command — not off the description of the mechanism.
