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
