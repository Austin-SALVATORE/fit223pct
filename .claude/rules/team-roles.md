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

**One teammate per role, for the life of the session.** A role that
already exists is never re-spawned — the next brief goes to the
teammate that holds it, resumed by name if it stopped. A second agent
for a role you already have throws away a context window that already
read this code, and it feels tidy rather than wasteful, which is why
it keeps happening. A model-tier mismatch does not justify it: paying
a full cold start to save a per-token rate is a bad trade.

**Subagents may start cold; their memory must not.** Every recurring
bench role keeps `~/.claude/agent-memory/<name>/MEMORY.md`, so the
next invocation inherits what the last one learned. Seed those files
with structural facts only — never conclusions about a live task, or
an independent reader becomes an echo of the previous spawn.

## Routing work by size

The lead decides this before touching anything. Both directions are
failures: running a typo through a plan-review-implement pipeline, and
hand-writing a subsystem because briefing felt slower than drafting.

| What arrived | Route |
|---|---|
| A typo, a rename, a one-line fix, a single grep in a file you are already reading | **Do it.** No plan, no spawn — a cold start costs more than the work. |
| A contained batch — one feature area, approach already obvious, no new design | **Brief the dev directly.** No architect plan. |
| Milestone-sized — multi-file, new subsystem, schema or data migration, anything irreversible or outward-facing | **Architect plan → lead review → dev executes → QA acceptance → `claim-verifier` before "done".** |
| "What / where / how many" about the repo | `repo-inventory` |
| Anything that changes git state, including a dev's own commits | `git-op` |
| A report claiming green, shipped, or pushed | `claim-verifier`, before accepting it |
| A defect nobody understands | QA reproduces it first; escalate the root-cause work rather than guessing at a fix |
| An approved art brief | `asset-generator`, then `asset-qa-auditor` against the committed files |
| A new or revised coach spec | `program-spec-validator`, before any transcription |
| A ruling on exercises, loads, reps or progression | **Nobody here.** It belongs to the owner's coach — see `program-content.md`. |

**The size is judged before the work starts, not discovered halfway
through.** The common failure is beginning a milestone as "just a quick
change" and never going back for the plan — by then the design
decisions have been made silently, inside edits, by whoever was closest
to the keyboard.

When it is genuinely ambiguous, ask for the plan. A plan for work that
turned out small costs one architect pass; skipped design on work that
turned out large is paid for by every change after it.

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

**The lead's hands are for reading, judging, and briefing — anything
that changes state is delegated**, including git operations and
deploys, even when delegating costs more than doing it. The test is
not whether an action appears on a list of prohibitions; it is whether
it changes state. A list only forbids the cases it has already met, so
each new kind of action feels like a reasonable exception until it too
has to be added. Mutating git goes to `git-op`; read-only git goes to
`repo-inventory`.

**The lead's output is a brief, not a draft.** The prohibition on
writing code is the easy half; the half that actually gets broken is
softer. You correctly route a decision to whoever owns it — ask the
owner, get the ruling — and then start drafting the solution yourself,
because you have the context and drafting feels faster than briefing.
The work still ships, so nothing looks wrong, but three roles have
collapsed into one and the independent view that justified the team is
gone. Tells: writing the implementation approach into a reply instead
of into a brief; producing a prompt for the *human* to paste at a
teammate you could dispatch yourself; "I'll just sketch this and hand
it over"; reaching for the file because the change is one line. Stop
at the moment you notice, and dispatch.

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

## The bench belongs to the whole team, not just the lead

The delegation discipline above is written in the lead's section
because that is where it is most often broken, but two parts of it
bind every role:

- **Git that changes state goes to `git-op`, whoever is committing.**
  Not because a teammate's tokens are expensive — because `git-op`
  refuses `git add -A`, refuses force and reset unless explicitly
  named, and stops on rejection *by construction*. A dev committing
  with its own hands has to remember the targeted-add rule on every
  single commit; routed through `git-op` it cannot be forgotten. The
  dev still owns the decision of what to commit and still reports the
  SHA — it delegates the hands, not the judgment.
- **Batch mechanical reads go to `repo-inventory`** — inventory every
  id, count references repo-wide, diff two lists. Work whose answer is
  extracted rather than judged, at a size where a cold start is worth
  paying.

**And a threshold, because the opposite failure is real too:** a
single grep in a file you are already editing is not a delegation
candidate. Routing it through a spawn costs a cold start to save a
per-token rate on one command, which is the same bad trade as
re-spawning a warm teammate. The rule is about *sweeps* and *state
changes*, not about every read.

**The architect delegates too, and the reason it was once excluded was
wrong.** It was briefly argued that withholding the Agent tool kept
the role "read-only by construction". It never was: the definition
grants `Bash`, and `Bash` writes files. `Bash` also has to stay —
prototyping the risky mechanism and reporting a measured number
instead of a guess is most of what makes the role worth its tier. So
read-only is a norm here, enforced by the role's own prompt, and
withholding Agent bought no safety while making the only Opus teammate
run its own file inventories. It now has Agent. If read-only should be
real, that is a separate and more valuable fix than the one that was
being defended.

The general lesson is worth more than the case: **a guarantee you have
not checked is a guarantee you do not have.** It was asserted from the
role's description rather than from its `tools:` line, and defended
before it was verified.

## Subagent bench

| Agent | For | Model |
|---|---|---|
| `repo-inventory` | Lookup and **read-only** repo ops: which ids exist, what references X, how many, `git status`/`log`/`diff` summaries | Haiku |
| `git-op` | Git operations that **change** state: commit, push, tag. Executes what it is told; never decides, never forces, stops on rejection | Haiku |
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

**All three teammate roles now have definitions** —
`.claude/agents/dev.md`, `qa.md` and `architect.md` — so tier is
structural rather than dependent on a `/config` value that has already
failed to apply once. Spawn a role from its definition; do not
hand-assemble it. `qa.md` additionally withholds `Edit` and `Write`,
which raises the friction on the one thing QA must never do, though it
does not eliminate it: `Bash` remains, because QA has to run the suite,
and a shell redirect writes files. Treat that as intent to honour, not
a wall.

**A custom `name` on a spawn makes it a teammate, and a teammate is
not the thing the definition describes.** Passing `name` is the
teammate trigger — the spawn comes back `in_process_teammate`, not a
subagent. Two things follow, and both are silent:

- The definition's `model` stops applying, so the spawn falls through
  to the lead's model. This is the same failure as the 27 Jul
  three-Opus-teammates incident wearing different clothes.
- **Agent memory does not come with it.** Memory lives at
  `~/.claude/agent-memory/<name>/` and is a subagent property;
  teammates have none. An `asset-generator` spawned under a task-
  specific name loses the locked style block and the generation route
  — and produces a whole batch in a re-derived style that nothing
  catches until the auditor measures it.

So: **a bench role is spawned by its `subagent_type` with no custom
name.** The urge to name it after the task ("stretch-art",
"stretch-spec-check") is the trap — it reads as helpful labelling and
silently converts a memory-carrying subagent into a memoryless
teammate on the wrong model. Name a spawn only when you genuinely need
to address it mid-flight, which is the definition of a teammate.
(Learned 28 Jul: an art batch and a spec validator were both spawned
with task-shaped names; both ran on the lead's model, and the art one
was stopped before it generated anything. The first was explained away
as the definition "correctly inheriting" — two spawns landing on the
lead's model was the pattern, and it was rationalised twice before it
was noticed.)

**A definition change does not reach a teammate that is already
running.** A teammate keeps the `tools` and `model` it was spawned
with, for its whole life. Editing `.claude/agents/<role>.md` changes
the *next* spawn, not the live one — and the live one will discover
this by finding a tool missing mid-task, which is a bad moment to
learn it. (29 Jul: `Agent` was added to `architect.md` while the
architect teammate was mid-plan; it reported "No such tool available"
and fell back to grep. Correct behaviour, wasted intent.) Weigh the
change against a respawn: a cold start mid-task usually costs more
than the capability is worth, so prefer landing definition changes
between batches rather than during one.

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

## A plan being executed is a contract, not a document

Authorship and authority are different things. The architect owns a
plan while nobody is working from it; the moment a dev starts
executing, the file becomes a contract between the lead and that dev,
and improving it — even correcting something genuinely wrong —
desynchronises the implementer from the document without anyone
noticing.

**The question is "is anyone executing this?", not "is this my file?"**

The failure does not surface as a merge conflict. It surfaces later as
a broken migration, a stale constant, or a test written against a
requirement that changed, with the divergence invisible in between.
That is worse than the error being fixed. (29 Jul: a Dexie version
allocation was corrected inside an approved plan while the dev was
implementing from it — sound reasoning, wrong moment, caught only
because the architect asked rather than assumed.)

Corrections to a live plan route through the lead, who can sequence
them against what the implementer already holds.

## Two agents, one working tree

Teammates and subagents share one checkout. Parallel dispatch is cheap
until two agents touch the same files, and the failure is not a merge
conflict — it is one agent reading another's **uncommitted, half-done**
work as if it were the truth.

**A verifier is a writer.** This is the case the section did not cover,
and it was authored by the lead. Proving a guard exists means *breaking
the thing it guards* — adding the token, deleting the key, reverting the
argument — and every one of those is an edit to the shared tree. The
role reads as read-only, its definition grants no `Edit` or `Write`, and
`Bash` writes files anyway. So a negative control is indistinguishable
from a defect to anyone else looking at that tree at that moment.

(6 Aug: a `claim-verifier` was asked to prove a ninth enum token would
ship silently. It added `extra-pause` to the type and to all three
locales, measured, and restored — correctly, and it said so. But a dev
was editing the same files throughout, saw the token appear, and
correctly stopped to report a spec violation that no longer existed by
the time anyone looked. Nothing was damaged and both agents behaved
exactly as instructed. The cost was a stopped teammate, a false alarm
escalated to the lead, and a verification report whose own suite runs
were contaminated by the dev's half-finished work in the other
direction.)

Both directions of that contamination are the point: the verifier
polluted the dev's view, and the dev polluted the verifier's
measurements. Neither could see the other's brief.

So: **a mutating negative control needs the tree to itself**, and it is
the lead's job to say so — sequence it against in-flight work, or scope
it to files nobody else is touching, or send it to a scratch worktree
(`git worktree add`), which is what a verifier measuring committed SHAs
should have been doing anyway. It is *committed* state a claim is about;
running the control against a dirty shared checkout is measuring the
wrong tree even when nobody collides.

It is the lead's job to notice before dispatching, because neither
agent can see the other's brief.

- **A generator editing inputs and a consumer reading them cannot run
  concurrently.** (29 Jul: an art batch was rewriting `prompt.md` frame
  counts while the dev ran the conversion pipeline that reads them. The
  pipeline picked up a not-yet-true count of 4 and sliced six-pose art
  into four frames — reproducing exactly the defect a withdrawn ruling
  would have caused. Caught and reverted by the dev, who then could not
  run its full-library proof at all.)
- **Whole-tree operations are the collision surface.** A scoped
  `--only` run is safe; a 120-asset conversion or a full re-index is
  not. If one agent needs the whole tree, nothing else may be writing
  to it.
- **Sequence, or scope.** Either serialise the two, or constrain the
  second to files the first cannot touch — and say which in the brief,
  since the agent cannot infer it.
- **Never revert another agent's uncommitted work to unblock your
  own.** Restore what you disturbed, report the collision, and let the
  lead sequence it.

The tell that this went wrong is a proof that cannot be run rather than
a proof that failed.

**The working tree is not the only shared instrument.** The Playwright
browser is shared too, and it collides the same way. (31 Jul: the lead
drove the browser to build a status board while the dev was mid
device-check; the dev stopped rather than clobber it, and lost its
French measurement. The lead then did it again minutes later, having
just written the incident up — knowing the rule is not what prevents
this. Checking *before* reaching is.)

What was then measured rather than assumed, so nobody re-derives it:

- **`browser_resize` is per-page.** A second tab at 375px leaves the
  first at 1680px. Two agents measuring different viewports do not
  corrupt each other.
- **Tab *selection* is one shared pointer.** `navigate`, `evaluate` and
  `resize` all act on whichever tab is current, and neither agent can
  see the other holding it. So a second tab shrinks the blast radius to
  the selection itself — it does not remove it.
- Therefore: **one agent owns the browser at a time**, and hands it back
  explicitly. A wrong-tab result still looks like a result, which makes
  this failure quieter than a file conflict, not louder.

The general form: before using any shared instrument, ask who is holding
it — not whether you are being careful with it.

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

### A message cannot interrupt a batch, so reprioritising by message does not work

Messages to a working teammate **queue**. They are read together, at
the boundary, after it finishes what it was already doing. A teammate
mid-batch is not ignoring the inbox — it is not reading the inbox yet.

This is a mechanism, not a diligence problem, and mistaking one for the
other is expensive. The tell is a small urgent task losing repeatedly
to a large task with a later deadline: you send "do X first", the batch
completes without X, and the natural response is to send it again more
firmly. That is `verification.md`'s *run the same instrument harder*
failure wearing project-management clothes — a firmer message reaches
an agent that is not reading messages by exactly the same route as the
first one, which is to say, not until the batch ends.

So when something must happen before a teammate's current batch ends,
there are only two moves that actually work:

- **Dispatch it elsewhere** — a subagent, or another teammate — after
  checking the two cannot collide in the shared tree, and *telling the
  first teammate to stand off those files*. It cannot see the second
  brief, so the sequencing is the lead's to enforce, not theirs to
  infer.
- **Accept batch granularity** and wait for the boundary, having said
  so plainly rather than pretending the instruction was urgent.

Two corollaries, both learned the same evening:

- **State observed at dispatch time is stale by the time it is read.**
  A message describing a teammate's working tree as it was when you ran
  `git status` will very often arrive after that teammate has committed.
  Quote a SHA, not a snapshot; ask what is open rather than asserting it.
- **The handover itself is a collision risk, and a stand-down cannot
  fix it — because a stand-down is also a message.** It queues with
  everything else and arrives at the same batch boundary, by which time
  the teammate has already done the work you reassigned. There is
  therefore **no safe moment to reassign work away from a mid-batch
  teammate at all.** Either wait for the boundary and reassign there, or
  accept that both agents will do the work and decide in advance whose
  result you will keep. "Send the stand-down first" is not a third
  option; it was written in this file twenty minutes before it failed.

(6 Aug: a seven-row seed-content correction, due the next morning, lost
three times to a set-customization feature due two days later. Three of
the lead's five messages went to firmness rather than to mechanism. The
correction only moved once it was handed to a second pair of hands — and
the teammate, reading all five at once, then announced it was starting
the same correction, which would have put two agents in one file had the
stop not arrived first.)
