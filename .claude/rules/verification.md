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
- **A citation is a claim.** A comment, docblock, or memory note
  saying "documented in X" is not evidence that X says it — open X.
  Cross-references rot faster than the code around them, and a stale
  pointer propagates a false belief into every reader who follows it
  without looking. (27 Jul: a deleted docblock claimed an i18n
  exclusion was "documented in docs/I18n-adding-a-locale.md"; that
  doc had never carried the claim, and the error reached a teammate's
  own memory before a `grep -ci` settled it.)
