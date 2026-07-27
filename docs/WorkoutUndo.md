# Undo a set · Reset a session

**Status: specified, not implemented.** This is the review contract
the implementation is measured against. Owner-requested 27 Jul after
a mis-tapped log during real use.

## The problem

Logging is write-through: tapping *Log set* persists immediately, which
is what makes exact resume work. But there is no counterpart —
`src/domain/workout.ts` exports `logSet` and nothing that removes one.
A set logged by accident (or a session opened by accident) is
permanent in history.

The only existing escape is *Discard session* on the Today page's
in-progress card (`TodayPage.tsx:496-505`), which deletes the whole
workout — and it is unreachable from Workout Mode, which is exactly
where the mistake happens. The user must leave the session to abandon
the session.

## Owner rulings (27 Jul)

1. **Both features ship**: fine-grained undo *and* whole-session reset.
2. **Undo is instant**; **reset confirms**, naming what will be lost.
3. Both are reachable **from inside Workout Mode**.

## Undo last set

- Removes the **most recently logged set in the session**, not merely
  the current exercise's last set — the mistake may be the first set
  of exercise 3, and the user is now looking at set 1 of exercise 3.
- Position steps back to that set, pre-filled as it would have been.
- **Instant, no confirmation.** Re-logging costs one tap; a confirm on
  the common case is friction in a gym, with sweaty hands, mid-set.
- **Only present when at least one set is logged.** Nothing to undo is
  not a disabled button; it is no button.

## Reset session

- Clears the session and returns the user to Today with it unstarted —
  the same end state as the existing *Discard session*, because one
  concept should not have two behaviours. "Reset today" means "put
  today back to before I started."
- **Confirms first, naming the count** ("Clear 6 logged sets?"), since
  it destroys real work and the data is deleted, not archived.
- Lives behind a secondary affordance, not adjacent to *Log set* —
  Workout Mode shows one decision at a time, and a destructive control
  must not sit where a thumb lands repeatedly.

## Rides along: backlog A4

`docs/review-backlog.md` A4 flags the existing Today discard as a
**silent two-tap** — it arms by swapping its own label in place, which
no screen reader announces, so a blind user can destroy a workout
without perceiving a confirmation step. Reset and discard are the same
concept; they must end up sharing one confirm pattern. Fixing A4
separately later would mean designing this twice.

## Constraints

- **Domain purity and immutability**: the new domain function returns
  a new `Workout`; nothing is mutated. It returns message descriptors,
  never prose.
- **Progression suggestions read history.** `previousSetsFor` feeds
  `suggestLadderProgression` / `suggestProgression`; after an undo the
  suggestion for that set must be what it was *before* the mistaken
  log, not derived from it.
- **Locale parity**: new keys land in en, fr and zh-CN together, in the
  registers the glossaries fixed.
- **Nothing guilts, nothing locks.** No "are you sure you want to give
  up" framing. Undo and reset are ordinary, blameless actions.
- The Today-page discard stays; it is the right control for a session
  abandoned without opening it.

## Out of scope (deliberate)

Editing a past set's values; undo after a workout is completed; a
multi-step undo history or redo; recovering a reset session (the
delete is real — say so in the confirm rather than implying a safety
net that does not exist).
