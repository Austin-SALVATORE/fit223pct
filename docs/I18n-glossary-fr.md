# French glossary — approved

**Status: approved 2026-07-19, ruled by Austin.** Gated Milestone 7 Phase
8 until this ruling; Phase 8 translation now proceeds from these terms
verbatim. A wrong call here would have propagated into every sentence
that nests it (driver phrases interpolate into adjustment/tier
sentences), so this list existed to catch that before it multiplied
across 300+ strings, not after.

Register: a personal coach speaking directly to one person (`tu`, not
`vous`) — warm, plain, never clinical, confirmed throughout. Same
constraint as the English copy: no medical framing, no fabricated
claims, no euphemism.

## Readiness (the core concept)

The English word deliberately avoids "recovery" — a readiness score is
"how ready you are to train today" (sleep/soreness/energy/stress/
motivation), not a claim about physiological recovery status. This
boundary was set in M3 and must survive translation.

| Candidate | Verdict | Reasoning |
|---|---|---|
| **état** (as in *état du jour*, "today's state") | **Ruled** | Plain and neutral — mirrors the Chinese choice (状态, "state/condition") — describes a fact ("your state today") rather than making a wellness claim. État-based phrasing throughout ("Ton état aujourd'hui", "ton état" for badges) — "Bilan" is reserved exclusively for the checkpoint activity kind below and must not be reused for the readiness check-in. |
| récupération | Rejected | Literally "recovery" — exactly the medical-register term the product forbids |
| forme | Rejected | An earlier draft of this glossary proposed *forme* as the safe alternative to récupération — corrected on review. *Forme* carries real wellness/lifestyle-marketing baggage in French (*être en forme*, *cure de forme*, diet and spa-magazine copy) and reads as a soft, vague wellness claim rather than a coach's plain assessment — the same territory the product's fitness rules already forbid ("never promise specific body transformation outcomes"). Not medical, but not neutral either. |
| disposition | Rejected | Correct meaning but bureaucratic/administrative register, wrong tone for a coach's voice |
| fraîcheur | Rejected | Real currency in French sports science (cycling especially), but reads as insider jargon here rather than plain coaching language |

## The three tiers

| Key | English | Proposed French | Rejected candidates |
|---|---|---|---|
| ready | "Ready to train." | **"Prêt à t'entraîner."** | — (direct, no real alternative needed) |
| steady | "Good to go." | **"C'est bon, on y va."** | *Prêt à partir* — calques the travel idiom "good to go," reads like a departure announcement |
| easier | "Taking it a touch easier today — …" | **"On lève un peu le pied aujourd'hui — …"** | *Un peu plus facile aujourd'hui* — flat, literal, loses the coaching warmth of the driving idiom ("lever le pied" = ease off the gas) |

## The five signals

Interpolated into driver phrases via `Intl.ListFormat` ("On lève un peu
le pied aujourd'hui — manque de sommeil et peu d'énergie.").

| Signal | Proposed French | Rejected candidates |
|---|---|---|
| sleep | **manque de sommeil** | *sommeil court* — clinical, reads like a lab report |
| soreness | **courbatures** | *douleurs musculaires* — implies injury/pain, not ordinary post-exercise soreness (courbatures is the standard, correct French fitness term) |
| energy | **peu d'énergie** | *fatigue* — a broader, more medical-adjacent term; "peu d'énergie" stays specific to today's level |
| stress | **une période stressante** | *du stress* — flatter, loses the "stretch of time" framing that makes it circumstantial rather than chronic |
| motivation | **motivation en berne** | *manque de motivation* — reads like a symptom on a checklist rather than a coach naming a rough patch |

## RIR (Reps In Reserve)

| Element | Proposed French | Reasoning |
|---|---|---|
| Abbreviation itself | **Keep "RIR"** | French lifters use the same international acronym as English speakers (same as "1RM", "kg") — this is not a case for translation |
| "Reps left in the tank" (descriptive label) | **réserve de répétitions** | Plain, descriptive, doesn't compete with the abbreviation |

**Rejected:** translating the abbreviation to "RER" — this is a real
landmine, not a hypothetical one: RER is the Paris commuter rail system.
Do not do this under any circumstance.

## "Adjusted for readiness" (badge)

| Proposed French | Rejected candidates |
|---|---|
| **Ajusté selon ton état** | *Ajusté pour récupération* — reintroduces the forbidden "recovery" framing. *Ajusté selon ta forme* — an earlier draft's answer, dropped along with "forme" above for the same wellness-marketing reason. |

## "Projected" (Plan badge — a forward forecast, not a fixed commitment)

The app's own honesty invariant: a projected day is a computed forecast
that shifts if an earlier day is missed, not a promise. The French word
must carry that same distinction.

| Proposed French | Rejected candidates |
|---|---|
| **Projeté** | *Prévu* ("planned/scheduled") — implies a fixed calendar commitment, which directly contradicts the app's documented distinction between projected and scheduled days |

## "Consolidate" (progression state — hold this load before advancing)

| Proposed French | Reasoning |
|---|---|
| **Consolider** | True cognate — French strength-training vocabulary already uses "consolider une charge" for exactly this meaning. No translation loss, no alternatives needed. |

## Nav terms

| Term | Proposed French | Reasoning |
|---|---|---|
| Today | **Aujourd'hui** | Direct, unambiguous — no alternatives worth considering |
| Plan | **Plan** | Kept as the loanword the app's own information architecture already establishes for this page (the schedule/rotation view). *Programme* was considered and rejected: the app already uses "Program" for a distinct domain entity (the imported training program itself) — reusing it for the nav tab would collide two different concepts under one word. |
| Progress | **Progression** | The natural French fitness-app convention for a tracking tab — reads as "how you're coming along," not a report. *Suivi* ("tracking/follow-up") was considered as a colder, more admin-register alternative — kept in reserve if "Progression" tests as ambiguous with the *progression* domain concept (load/rep progression logic), but no actual collision found: that concept is never surfaced as a standalone label. |
| Library | **Bibliothèque** | Direct, standard — "bibliothèque d'exercices" (exercise library) is natural and unambiguous |

## Activity kinds

Note for review: "Récupération" reappears here as an **activity type**
(a scheduled recovery day), which is a legitimate, standard use of the
word — distinct from the readiness-score usage rejected above. This
isn't an inconsistency; a recovery *day* is a real category, a recovery
*score* would be a medical claim.

| Kind | Proposed French | Rejected candidates |
|---|---|---|
| recovery | **Récupération** | — (correct use, see note above) |
| mobility | **Mobilité** | — (direct cognate) |
| cardio | **Cardio** | — (universal loanword) |
| optional | **Optionnel** | — (direct cognate) |
| checkpoint | **Bilan** | *Point de contrôle* — evokes a security/border checkpoint, wrong register for a training milestone |
