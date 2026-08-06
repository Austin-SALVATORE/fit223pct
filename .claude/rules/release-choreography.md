# Release choreography

**Pushing to `main` deploys** — a plain `git push` reaches the owner's
phone on its own, with no further gate. Sequence work so the deployed
tree is never internally inconsistent.

- **Generated data and the code that reads it ship in the same
  commit.** A resolver reading a new manifest schema while the old
  manifest is committed took production down once — an outage with a
  green test suite behind it.
- **A change and its reconciliation commit travel in one push.** Nothing
  is deployed between them. Asset commits are the case this was learned
  on, but it is not limited to them.
- **Targeted `git add` only** — never `-A` or `.`. Other teammates have
  work in the same tree, and staging theirs by accident is how
  half-finished work ships. Routing commits through `git-op` makes this
  structural rather than remembered.
- Commit at phase boundaries, with messages that state **what was
  verified**, not just what changed.
- Scripts under `scripts/` are the owner's territory; touch them only
  with explicit per-task authorization.
- Scan for secrets before committing anything that reads credentials or
  touches config.
- Anything irreversible or outward-facing — migration, deploy, force
  push, published artifact — needs the owner's explicit approval first.
  Speed is never the reason to skip it. **Standing exception:** routine
  deploys of work already verified, per the owner's 30 Jul grant — the
  gate there is independent verification, not permission.
