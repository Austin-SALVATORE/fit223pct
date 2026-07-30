# Verification

Claims are verified by running commands, not by reading reports.

- `npm run typecheck` is the only typecheck. Plain `tsc --noEmit -p .`
  targets the root solution config (`files: []`) and **silently exits
  0 while checking nothing** — it once passed a whole session's work
  without looking at it.
- Verify against the **committed tree**, not the working tree. A
  claim about what shipped is a claim about `origin/main`.
- Before accepting "green", run the suite yourself and compare counts.
  Before accepting "deployed", check the artifact or the device.
- Report failures with their output. A skipped step is stated as
  skipped. "Green except known failures" is not green — name them.
- **Git is deliberately blind to part of the asset tree, so it cannot
  answer questions about it.** `public/assets/exercises/*/reference.png`
  is gitignored (`.gitignore:34`) — the authoring source is untracked
  while its derived AVIFs and manifest entries are committed. So
  `git status` and `git diff HEAD` report **nothing** for a reference
  image that has completely changed, and a clean status is not evidence
  that asset content is unchanged.

  Claims about whether asset content moved come from **mtimes, content
  hashes, or the manifest** — never from git. (30 Jul: the lead
  concluded a regenerated art batch had been lost because
  `git diff HEAD` showed no change; the art was intact on disk. The dev
  had checked `git status` during the same episode and was equally
  unable to see it. Both instruments were blind to the subject, and the
  conclusion was asserted anyway.)
- **A generated artifact older than its source is stale, and nothing
  downstream will notice.** When a brief is corrected mid-flight, some
  subset of what already exists was produced under the old one — and
  it will not announce itself: the file exists, the source now reads
  correctly, and the artifact contradicts it. `convert-assets.mjs`
  reads `prompt.md` for frame count and `reference.png` for pixels and
  never compares their timestamps, so a corrected prompt will happily
  ship an uncorrected image. Compare mtimes before consuming any
  generated tree:

  ```
  [ "$(stat -f %m out)" -lt "$(stat -f %m src)" ] && echo STALE
  ```

  (28 Jul: a wall asset generated ten minutes before its own corrected
  prompt, while the correction was in flight. It was caught by mtime,
  not by any check in the pipeline.)
- **A spawn's model and kind are checkable, so check them.** What a
  definition declares is not evidence of what a spawn got. Grep the
  agent's own transcript:

  ```
  grep -oE '"model" *: *"[^"]{1,40}"' \
    ~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl \
    | sort -u
  ```

  Never `cat` or `tail` that file — it is the full JSONL transcript and
  reading it whole overflows context. The grep costs nothing and turns
  "the definition says sonnet" into a measurement. A bench role that
  has *no* file under `subagents/` was not spawned as a subagent at
  all. (28 Jul: two bench roles spawned with task-shaped names came
  back as teammates on the lead's model, and the first was explained
  away as the definition working correctly.)
- **A clean result from an instrument that cannot see the subject is
  not evidence — and re-running it does not make it evidence.** This is
  the most frequent failure in this repo. Four instances, all with the
  same shape: `tsc --noEmit -p .` exiting 0 against `files: []`;
  `git diff HEAD` reporting no change on a gitignored `reference.png`;
  an i18n guard passing while its regex silently discarded every
  `tCommon()` call; and a plural-family count read from a regex that
  cannot see namespaces.

  The trap is not the wrong answer, it is what happens next. **The
  natural response to doubt is to run the same instrument harder** — a
  wider character class, a second `git status`, another look at the
  console — and the agreement reads as confirmation while the blind
  spot is untouched. (30 Jul: the lead "corrected" a plural-family
  count from 20 to 18, then re-ran with a wider character class and
  took the matching answer as proof. The collision was in namespacing,
  which no character class can reach; the wider pattern could only ever
  have agreed. The dev re-derived it path-aware and both numbers turned
  out to measure different things.)

  So the question is never "did the check pass?" but **"could this
  check have failed for the reason I care about?"** If you cannot say
  how it would fail, you have not measured anything. Change
  *instrument*, not *effort*: a different tool, a different layer, or a
  deliberate break.

- **A guard is not evidence until it has been made to fail on
  purpose.** A test written for a bug and never seen red is
  indistinguishable from a test that checks nothing, and it is worse
  than no test because it stops anyone else from looking. Break the
  thing it guards, watch it go red, name the key or line in the output,
  restore. (30 Jul: an i18n guard shipped green with the exact key it
  was written for deleted from every locale. Only a negative control
  caught it.) Where a wrong "all clear" would be silent, the negative
  control belongs to a *different* role than the author — whoever wrote
  it already believes it works.

- **A citation is a claim.** A comment, docblock, or memory note
  saying "documented in X" is not evidence that X says it — open X.
  Cross-references rot faster than the code around them, and a stale
  pointer propagates a false belief into every reader who follows it
  without looking. (27 Jul: a deleted docblock claimed an i18n
  exclusion was "documented in docs/I18n-adding-a-locale.md"; that
  doc had never carried the claim, and the error reached a teammate's
  own memory before a `grep -ci` settled it.)
