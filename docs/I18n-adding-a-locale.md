# Adding a locale

Three locales ship at launch — English (`en`, default and fallback),
French (`fr`), Simplified Chinese (`zh-CN`) — but the design goal from
docs/I18n.md was that adding a fourth means adding files, not changing
code. This is the checklist a fourth locale actually follows, written
against what Phases 1–9 built rather than what was originally planned.

## 1. Register the locale

Two places, both in `src/domain/types.ts` and `src/i18n/i18next.ts`:

- Add the locale code to `SUPPORTED_LOCALES` (`src/domain/types.ts`) —
  this is the single source of truth; `i18next.ts` re-exports it.
- Teach `mapNavigatorLanguageToSupported()` (`src/i18n/i18next.ts`) the
  new `navigator.language` prefix, e.g. `if (lower.startsWith('de'))
  return 'de'`.
- Add a button label for it to every locale's `common.json` under
  `language.<code>` (the switcher in `src/ui/LanguageSwitcher.tsx`
  reads `t('language.' + locale)` for each `SUPPORTED_LOCALES` entry —
  it needs no code change itself, but every locale's `common.json`
  must carry the new key, English included, or the switcher's own
  buttons for other locales stay unlabeled).

## 2. Create the locale file tree

One file per namespace under `src/locales/<code>/`, matching
`NAMESPACES` in `src/i18n/i18next.ts` exactly: `common`, `domain`,
`today`, `workout`, `progress`, `library`, `checkin`, `seed`, `plan`,
`settings`. Copy `src/locales/en/` as the starting skeleton — same key
paths, same `{{param}}` names, same `$t()` nesting references, same
`_one`/`_other` plural suffixes. `src/i18n/localeParity.test.ts` fails
the build the moment a key is missing or a param is renamed, so it's a
build-time contract, not a manual checklist.

## 3. Draft a glossary before translating prose

Every prior locale (`docs/I18n-glossary-fr.md`,
`docs/I18n-glossary-zh.md`) started here, and for good reason: a small
set of core terms — readiness, the three tiers, the five signals, RIR,
"Adjusted for readiness", "Projected", "consolidate", the five activity
kinds, the four nav labels — get interpolated into dozens of downstream
sentences (driver phrases nest into adjustment sentences, tier names
nest into headings). Getting one of those wrong and catching it after
300+ strings are written means re-touching all of them. The glossary
format that worked: a table of candidate terms per concept, one ruled
per row, with rejected candidates and *why* — especially near-cognates
that sound safe but carry the wrong register (medical/wellness framing
the product's fitness rules forbid; see docs/I18n.md's terminology
invariant). Draft it, then get a native reader's sign-off before bulk
translation — a non-native draft is a starting point, not a shippable
glossary.

## 4. Translate content, not structure

Copy visible strings and `aria-label`s; never touch the technical
skeleton:

- `{{param}}` names stay as written in English — they're interpolation
  keys, not prose.
- `$t(...)` nesting references point at other keys by name — the
  referenced key changes meaning by translating its own file, not by
  editing the reference.
- `_one`/`_other` (and `_zero`/`_two`/`_few`/`_many` where relevant)
  are CLDR plural categories, not free text — see §6 below for which
  ones a given locale actually needs.
- Enforce every terminology rule from the glossary and from
  docs/I18n.md across *all* prose in the namespace, not just the exact
  glossary terms — a banned word can surface in a sentence the
  glossary never explicitly covered.

**Two deliberate exceptions stay untranslated inside otherwise-
translated sentences**, both in `plan.json`'s `import.*` validation
messages: quoted verbatim tokens from a user's own file (`{{sectionId}}`,
`{{exerciseId}}`, a raw column value) are the user's own words, never
the product's; and — a v1 scope exclusion, not a permanent rule —
`programMarkdown.ts`'s Markdown column headers (`Exercise | Sets |
Range | ...`) and the parenthetical weekday list
(`unrecognizedWeekdayHeading`) stay English-only, because they're the
import parser's fixed vocabulary: translating them per-locale would
mean either supporting all locales' headers forever or breaking a
translated-locale user's own hand-typed English headers. Revisit if a
real need shows up.

## 5. Watch for locale-specific formatting bugs code review won't catch

Two classes turned up empirically across French and Chinese, worth
checking for explicitly rather than assuming Intl handles everything:

- **Grammatical number agreement.** A source string built as
  `"{{count}} <plural noun>"` from an English key with no `_one`/
  `_other` branch produces wrong grammar in a language that inflects
  differently (French: "1 séances" instead of "1 séance"). Since
  adding new plural suffixes is a structural change (out of scope for
  a locale-content pass), fix by rewording: move the noun to modify a
  fixed number instead of the variable (`"{{count}} sur 3 séances"`),
  use a label:value construction (`"Séances complétées :
  {{completedCount}} sur {{scheduledCount}}"`), or fall back to an
  invariant loanword where two dynamic numbers collide with no clean
  restructuring (`"{{reps}} reps"`).
- **Hardcoded ASCII-space separators.** `Array.join(' / ')` and
  similar reads as a real bug in a locale with no inter-word spacing
  convention (Chinese: `"周一/周三/周五"` is correct, `"周一 / 周三 /
  周五"` reads as visibly foreign). `PlanPage.tsx`'s weekday-abbreviation
  join now branches on `locale.startsWith('zh')`; a new locale with the
  same no-spacing convention needs the same check. Punctuation used as
  a neutral value separator (`·`, `→`) rather than joining words of a
  sentence has not shown this problem — it reads naturally across all
  three current locales — but verify live rather than assuming.

## 6. Plurals: check what the locale actually needs, don't guess

`new Intl.PluralRules(<code>).resolvedOptions().pluralCategories` in a
browser console tells you the real CLDR categories for the locale — not
every language needs `_one`/`_two`/`_few`/`_many`, and
`localeParity.test.ts` enforces exactly that locale's real categories
(always including `_other`), not a copy of English's. Chinese needing
only `_other` is correct, not a gap — don't add `_one` there to "match"
English.

## 7. Seed content: exercises are locale-only, programs have a fallback

Exercise `name`/`cues`/`teachingConcept` live only in
`src/locales/<code>/seed.json` under `exercise.<id>.*` — there is no
English fallback for these because there is no code path a user can hit
without a resolved name (`exerciseRepo.put` doesn't exist; every row is
seeded). All ~27 exercises need entries.

Program/session/activity names are different: they're also what a user
types by hand importing a Markdown program (`programMarkdown.ts`), so
they can't be locale-keys-only. `resolveSeedString()` looks up
`program.<id>.name`, `program.<id>.session.<id>.name`, etc. via
i18next's `defaultValue`, and falls through to the literal field stored
in Dexie for anything with no key — a not-yet-translated locale, or a
user's own imported program, still renders (in whatever language the
program was authored in), rather than showing a raw key. Translate the
one built-in seeded program's names/foci for a complete locale, but
know that missing entries here degrade gracefully, unlike Exercise
content.

## 8. Verify live before calling it done

Automated tests catch structural drift (`localeParity.test.ts`,
`src/i18n/liveSwitch.test.tsx`, `src/i18n/missingKeyFallback.test.tsx`)
but not whether the language reads right. Switch to the new locale in
Settings on a real build and read every screen: Today (all its states —
training day, rest day, in-progress, done, weekly review), Plan, a
session detail, Workout Mode end to end, Progress, Library, an exercise
detail, Settings itself, and the import-validation error copy (trigger
a deliberately broken import file). Confirm `document.documentElement
.lang` updates and no English/TODO/raw-key text is left over. This step
is gated on a native reader for the locale being added — the same gate
Phases 8 and 9 used (draft + glossary first, "shipped" only after
sign-off) — not something the implementer can self-certify for a
language they don't read.
