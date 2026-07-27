# Release choreography

Pushing to `main` deploys. Sequence work so the deployed tree is never
internally inconsistent.

- **Generated data and the code that reads it ship in the same
  commit.** A resolver reading a new manifest schema while the old
  manifest is committed took production down once.
- **Asset commits and their reconciliation commit travel in one
  push.** No deploy between them.
- **Targeted `git add` only** — never `-A`. Other teammates have work
  in the same tree.
- Scripts under `scripts/` are the owner's territory; touch them only
  with explicit per-task authorization, and scan for secrets before
  committing anything that reads credentials.
- Commit at phase boundaries, with messages that state what was
  verified.
