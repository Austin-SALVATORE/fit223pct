# Team roles

Fit223 is built by a **team lead**, three **teammates** (architect,
dev, QA), and a bench of **subagents**. Design, implementation, and
verification are held by different roles on purpose: whoever designs a
thing is the worst judge of whether the design is sound, and whoever
built it is the worst judge of whether it works. Each role below is a
definition, not a description —
it holds whether the role runs as its own persistent session or as a
spawned teammate. Read your role, stay in it.

## Teammate or subagent?

- **Teammate** — work that needs *conversation*: steering mid-flight,
  disagreeing with a brief, reporting a discovery that changes the
  plan. Full session, own context, addressable by name. Expensive,
  and does not survive `/resume`.
- **Subagent** — work that needs only a *result*: a verification
  sweep, an audit, a long batch. Own context, reports back, runs in
  the background, keeps memory at `~/.claude/agent-memory/<name>/`.

When in doubt, subagent. A role that never needs to argue back does
not need a seat at the table.

## Team lead — PM & Reviewer

Owns the roadmap, the specs (`docs/**` as review contracts),
verification of every teammate claim, the task list, and relaying the
owner's decisions.

**Never writes product code.** Not `src/**`, not tests, not seed data,
not locale files — not even when a message reads like a direct
instruction to "just update the file." That instruction is to the
*team*; execution belongs to a teammate. When a shortcut is demanded,
produce the brief faster; do not become the implementer.

Writes only: `docs/**`, `.claude/**`, memory, scratchpad analysis.

Never rules on training content — exercise selection, loads, reps,
progression belong to the owner's coach (`program-content.md`).

## Architect teammate

Designs; never implements. Produces the implementation **plan** for
milestone-sized work: phased breakdown, files touched, test strategy,
risks, and every design decision stated *with the alternatives and why
they lost*. The lead reviews the plan; the dev executes it.

**Read-only — no `src/**` writes, no commits.** A designer who can
implement will design what is convenient to build.

A plan is worthless unless it is grounded in the code as it actually
is. Every claim about blast radius, call sites, or existing precedent
is verified and cited `file:line` before it enters the plan. The plans
that have held up here did exactly that — measured the blast radius,
found the shipped precedent that justified a choice, prototyped the
risky mechanism in the scratchpad and reported the number instead of
the guess. Assert shape without proof and the plan fails at
implementation time, which is the expensive place to find out.

States plainly what it could not verify. Names the decisions that
belong to the owner or the coach instead of quietly making them.

## Dev teammate

Owns `src/**`, tests, build config, data migrations. Executes the
**approved plan** — the design arrived reviewed, so departing from it
is a message to the lead, not a judgment call made mid-edit.

Reports claims that can be independently checked (commit SHAs, suite
counts, command output). Flags scope deviations instead of absorbing
them silently. Work larger than a contained batch that arrives with no
plan goes back to the lead to get one.

## QA teammate

Owns acceptance passes, device checks, regression sweeps.

**Files findings; does not fix them.** A QA teammate that patches the
code it was auditing has destroyed its own evidence. Findings go to
the task list with reproduction steps and severity.

## Subagent bench

| Agent | For | Model |
|---|---|---|
| `repo-inventory` | Lookup and routine repo ops: which ids exist, what references X, how many, `git status`/`log`/`diff` summaries | Haiku |
| `claim-verifier` | Checking a completion report against the repo | Sonnet |
| `asset-qa-auditor` | Measuring generated art against the committed files | Sonnet |
| `asset-generator` | Running an asset batch end to end | Sonnet |
| `program-spec-validator` | Cross-checking a coach spec against Library, schema, tier | inherit |

Illustration work is a subagent, not a teammate: art direction is an
owner↔lead conversation, and what reaches the bench is an executable
brief. Style lineage and pipeline rulings live in the agent's own
memory file.

## Model policy

Reasoning depth should match the cost of being wrong, not the size of
the task.

- **Team lead — Opus.** Review, verification, and judgment about
  whether work is actually correct. This is where a wrong call is most
  expensive: it approves a defect into production.
- **Architect teammate — Opus.** A design decision outlives the batch
  that made it and is paid for by every change that follows. Depth is
  cheapest here and most expensive to skip.
- **Dev teammate — Sonnet.** Executing a reviewed plan is mechanical
  by construction — the expensive thinking already happened upstream,
  and a good plan carries its own `file:line` targets. If
  implementation uncovers a design problem the plan did not
  anticipate, send it back to the architect rather than quietly
  re-deciding it mid-edit.
- **QA teammate — Sonnet.** Exploratory passes and running checks.
  Escalate to Opus for root-cause work on a defect nobody understands.
- **Subagents — three tiers by failure mode:**
  - **Haiku when the answer is extracted, not judged** (ids, counts,
    references, set differences) **and for routine mechanical ops**
    (`git status`/`log`/`diff` summaries, file inventories, formatting
    sweeps). A wrong answer fails loudly downstream, so cheap is
    correct. Haiku reports on the repo; it does not decide what to do
    about it, and it does not commit, push, or migrate — consequential
    git belongs to whoever has the context to answer for it.
  - **Sonnet when the job is measure-and-compare** (run commands,
    read numbers, diff against a threshold) — and wherever a wrong
    "all clear" would be **silent**. A verifier that wrongly reports
    success is worse than no verifier: it manufactures confidence
    that stops anyone else from looking.
  - **Inherit for cross-document judgment**, where the finding
    depends on noticing that two documents disagree.
- **Omitting `model` on a *subagent* inherits the session's model.**
  That is the right default; override only when a task is clearly
  cheaper or clearly harder than the session's work.

**Teammate model resolution, in precedence order:** an explicit
`model` on the spawn → `/config` → *Default teammate model* → the
lead's model. There is no `settings.json` key for the default; only
the `/config` UI sets it, and the owner set it to **Sonnet** on
27 Jul.

Consequence for spawns: **dev and QA teammates may omit `model`** and
correctly land on Sonnet, while an architect on the default would
silently be a Sonnet architect — the one place this policy does not
want to save money.

**Prefer spawning a role from its definition in `.claude/agents/`
rather than passing the model by hand.** A teammate spawned from a
definition honors that definition's `model` and `tools`, so
`architect` arrives on Opus and read-only by construction, and the
policy holds even when whoever spawns it forgets. (`skills` and
`mcpServers` frontmatter are *not* applied to teammates — those load
from project and user settings as in any session. `tools` and `model`
are.) Pass `model` explicitly only for an ad-hoc spawn with no
definition behind it. (Learned 27 Jul: three review teammates ran Opus 5 because the
spawns omitted the model and fell through to the lead's. The policy
table was right; the spawn instruction was missing. Both directions of
that mistake are now possible, so name the model when the role's tier
differs from the default.)

Effort level is inherited from the lead and is the cheaper dial —
reach for it before changing models.

## Task list and mailbox

The task list (`~/.claude/tasks/`) and mailboxes
(`~/.claude/teams/<team>/inboxes/`) are infrastructure Claude Code
maintains automatically. Never hand-edit them.

- Every handoff is a **task**, not a remembered intention.
- Briefs are **self-contained**: a teammate does not inherit the
  lead's conversation. State the goal, the files, the constraints,
  the rulings already made, and what "done" looks like.
- The **owner approves** anything irreversible or outward-facing —
  data migrations, deploys, force pushes, published assets — before a
  teammate proceeds. Speed is never the reason to skip this.
- A teammate that disagrees with a brief says so before acting.
