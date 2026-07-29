# Milestone 10 — AI nutrition logging

**Status: specified, blocked on owner decisions.** This is the review
contract. The owner's proposal is reproduced faithfully below; the
architecture is the architect's to propose once the decisions in §1 are
made. Owner-requested 29 Jul.

Nutrition is the second pillar of body recomposition alongside
training. The objective is fast, frictionless logging accurate enough
for everyday fat-loss and muscle-preservation decisions — **not**
medical-grade analysis.

---

## 1. What must be decided before anything is designed

This milestone is not blocked on effort. It is blocked on four
decisions, and the first one is larger than the feature.

### 1.1 This breaks local-first — the app has no backend and cannot have an API key

Every prior milestone holds because the app is local-first with no
server: Dexie in the browser, no network at rest, nothing to
authenticate against. **An LLM call breaks that**, and not in a way a
design can route around:

- **An API key cannot ship in a PWA.** Anything in the bundle is
  readable by anyone who installs it. There is no client-side secret.
- So a call to any model provider needs **a server the owner controls**
  — a proxy that holds the key, or a hosted function. That is a
  backend, a deployment target, a cost centre and an availability
  dependency the product has never had.
- `.claude/rules/architecture.md` states the product constraint as
  "local-first (no backend)". **This milestone changes that sentence**,
  and every future decision inherits the change.

Three shapes, and the owner picks:

1. **Owner-hosted proxy** — a minimal function holding the key.
   Cheapest to build, and the app keeps working offline for everything
   except analysis. Introduces a deploy target and a bill.
2. **User-supplied key** — the user pastes their own provider key,
   stored locally. No backend, no bill, preserves local-first almost
   intact. Asks something of the user that no other feature asks, and
   the key still sits in browser storage.
3. **On-device model** — no network at all. Preserves every constraint
   and is the only option with no running cost; vision models small
   enough to run in a browser are not close to the accuracy this
   feature needs.

**Until this is decided, nothing else can be designed** — the data
model, the offline story, the privacy story and the cost story all
hang off it.

### 1.2 A daily score conflicts with a shipped non-negotiable

The proposal specifies a daily rating — `Overall 9/10`, with ⚠️ marks
per macro. The app's stated product philosophy, enforced through
Milestone 6 and again in the recovery-routine milestone, is that
**nothing guilts and nothing locks**. Skipping is always fine.
Recovery routines were deliberately built to track nothing at all,
because completion tracking is "the ruling most likely to be eroded
later by a well-meaning *wouldn't it be nice to see consistency*."

A nutrition score is that mechanism, pointed at food. Scoring a day
9/10 is a judgement about the user's eating, delivered daily, in an app
whose distinguishing property is that it never does that.

This may be exactly what the owner wants — food is not recovery, and a
number may be motivating where a streak is punishing. **But it is a
deliberate reversal of a stated non-negotiable and must be made
consciously**, not discovered later. If scoring stays, say what makes
it different from the tracking recovery days forbid.

### 1.3 Nutrition targets are the coach's, not this repo's

The proposal describes calorie and macro targets that vary by training
day, recovery day and rest day. `.claude/rules/program-content.md`
reserves selection, loads, reps and progression philosophy to the
owner's coach. **Nutrition targets are the same class of decision** and
must come from the coach, not be invented here or by a model.

Specifically needed from the coach: protein target (absolute or per kg
bodyweight), the calorie target and how it derives, the carbohydrate
difference between training and recovery days, and what counts as
"clearly excessive or insufficient" fat. The proposal's own "Rest Day,
do some analysis first" is an open question, not a target.

Also unresolved: whether targets are **customisable** or **derived**
from the active program (the proposal's reviewer topic 6).

### 1.4 Fitness rules constrain what the feature may say

`CLAUDE.md`: *follow evidence-informed principles, never fabricate
scientific claims, never promise specific body transformation
outcomes.* A model estimating nutrition and then commenting on it can
violate both without anyone noticing — an LLM will confidently invent a
number and will happily tell a user what it will do to their body.

Whatever the design, the model's output must be constrained to
**estimation and comparison against a coach-set target**, never to
prediction or advice. This is a guardrail on prompt and rendering, and
it belongs in the plan rather than being left to the model.

---

## 2. The proposal, as given

### Goals

Minimise effort to log a meal · eliminate manual calorie calculation ·
provide daily feedback · integrate nutrition into existing progress
tracking.

**Non-goals**: replacing professional nutrition software · tracking
micronutrients · requiring users to weigh ingredients ·
laboratory-level accuracy.

### Input methods

- **Text** — natural language only, no structured form. *"Had two eggs
  and a banana."* · *"Lunch was about 250g chicken breast with rice."*
- **Image** — one or more photos. The AI detects foods, estimates
  portion size, estimates cooking method where possible, and returns
  confidence.
- **Hybrid** — photo plus clarification (*"the steak was about 250g"*),
  preferred whenever possible; materially better than photo alone.

The AI may ask follow-up questions when confidence is low —
*"approximately how much chicken was on the plate?"*

### AI responsibilities

Identify foods · estimate serving sizes · estimate calories · estimate
protein, carbohydrates and fat · return confidence · **explain
assumptions** (*"assumed grilled chicken breast, 250 g"*).

### Daily evaluation

| Macro | Verdicts |
|---|---|
| Calories | too low · on target · too high |
| Protein | insufficient · acceptable · excellent |
| Carbohydrates | context-aware: higher expected on training days, lower acceptable on recovery days |
| Fat | evaluated **only** when clearly excessive or insufficient — avoid unnecessary warnings |

Plus an overall score. The app "should avoid overwhelming users with
excessive nutritional advice."

### Training context

Evaluation adapts to the schedule, which already exists in the app:
training day (higher carbohydrate, high protein) · recovery day
(moderate carbohydrate, high protein) · rest day (lower calories, high
protein — *"do some analysis first"*).

### Daily isolation

**Nutrition records belong to a single calendar day. Previous days
never influence the current day's calculations. Each day starts with a
clean summary.** This is the philosophically strongest part of the
proposal — it is the no-guilt principle expressed in food, and it
should survive whatever else changes.

### Data model, as proposed

```
Meal          id · date · time · inputType(text|photo|hybrid) ·
              notes · aiConfidence
FoodItem      name · estimatedWeight · calories · protein ·
              carbohydrates · fat · confidence
DailyNutrition  calories · protein · carbohydrates · fat ·
              calorieStatus · proteinStatus · carbStatus · score
```

### Accuracy philosophy

The system **estimates** rather than claiming precision, and surfaces
confidence: high (*"chicken breast 250 g"*), medium (*"rice
approximately 150–200 g"*), low (*"sauce could not be identified
accurately"*). It asks follow-up questions whenever uncertainty
materially affects the result.

### Privacy

Local-first. Images uploaded only when analysis is requested.
Processed results stored locally. Raw images may be discarded after
analysis unless the user explicitly keeps them.

### Offline behaviour

History remains available · manual entries can still be created · AI
analysis unavailable until connectivity returns.

---

## 3. Acceptance criteria

Users can log meals by text, by photo, and by both combined; receive
estimated calories, protein, carbohydrates and fat with confidence
levels; view a daily summary; see status adapted to the training plan;
review history; and **edit AI-generated estimates**.

That last one matters more than its position suggests: an estimate the
user cannot correct is a number they must either accept or ignore, and
this feature's whole premise is that the estimates are approximate.

---

## 4. Open questions from the proposal

Recorded as asked, with who owns each:

| # | Question | Owner |
|---|---|---|
| 1 | Stream AI responses for perceived speed? | architect |
| 2 | Which vision model balances cost and accuracy? | architect, then owner on cost |
| 3 | One prompt or a multi-stage pipeline? | architect |
| 4 | Should confidence affect the displayed score? | owner (see §1.2) |
| 5 | Should users be prompted to confirm uncertain estimates? | architect |
| 6 | Targets customisable or derived from the program? | owner + coach (§1.3) |
| 7 | Retain meal photos locally after analysis? | owner (privacy) |
| 8 | How are AI costs managed for frequent photo uploads? | owner (§1.1) |

Questions 2 and 8 collapse into §1.1: neither is answerable before the
hosting shape is chosen.

---

## 5. Future extensions (explicitly out of scope)

Barcode scanning · packaged food recognition · meal templates ·
favourite meals · weekly nutrition reports · smart shopping
recommendations · grocery lists · Apple Health integration · Xiaomi
ecosystem integration.

Apple Health and Xiaomi overlap the Smart Connector milestone
(`docs/design/SmartConnector.md`), which is on hold. If nutrition ships
first, the integration boundary decided there should not be
re-litigated here.
