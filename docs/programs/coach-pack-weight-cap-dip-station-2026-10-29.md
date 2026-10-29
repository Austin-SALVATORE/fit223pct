# For the coach: Saturday's Full Body B, the weight cap, and the dip station

**From:** the Fit223 team, 29 Oct 2026. This answers the athlete feedback dated 24 Oct.
**Baseline:** Mesocycle 2 Build v3, which is frozen. Nothing in the program has changed.
**How to read it:** sections 1–3 are facts taken from the app's code. Section 4 is the questions only you can answer, each with the manufacturer or safety facts it needs. Our recommendations on Q1–Q4 are about product and safety. Q5 is about progression, which is yours: there we only point to the option that leaves your current carry rule unchanged.

## 1. What the app recorded on Saturday 24 Oct (Full Body B)

- **Dumbbell bench press → barbell bench press.** This was done with the app's swap button. The barbell rested on the TS 100 bars during the session. A bug capped the weight at **20 kg total, including the 7.75 kg bar**, so anything above 20 kg was stored as 20 kg. The cause is that the swap kept the dumbbell bench press's 20 kg *per-dumbbell* ceiling. The athlete will give you the real load. These sets do not feed the next dumbbell bench press, because swapped sets are kept out of carry-forward.
- **Single-arm dumbbell row → inverted row.** The app does not offer this swap. The inverted row lists the dumbbell row as its fallback, but not the other way round. So the athlete logged the inverted rows **in the dumbbell row's slot, at the dumbbell weights the screen showed**. History therefore holds three single-arm dumbbell row sets that were really bodyweight inverted rows. The next Full Body B will start the dumbbell row from exactly those entries, the weight and the reps of each set, because carry-forward repeats what was logged and adds no increase. This assumes Saturday counts as a complete, normal (not easier-day) session.
- The app cannot edit a finished workout, so these entries stay as stored. Please read them with this section in mind.

## 2. The weight cap: what we are fixing, and one question for you

- **Cause:** the weight control was given each exercise's equipment ceiling as a hard limit, and it lowered anything above it to the ceiling. The only feedback was the line "Your equipment tops out here." That control is the only place the limit was enforced. Saving, storage, carry-forward and import never enforced it.
- **Fix** (approved by the athlete on 29 Oct and being released):
  - The ceiling no longer limits input.
  - Above the ceiling, a non-blocking line says the weight is over the program's equipment limit and will be logged as entered.
  - The ceiling stays in the program as information.
  - No stored log is changed.
  - The line is not shown on a swapped exercise, because that ceiling belongs to another implement.
- **Your question (Q5 below):** after a set is logged above the ceiling, what should the next session start from?

## 3. Current A/B/C, counted from the app

| Session | Exercises (working sets) | Sets |
|---|---|---|
| A, squat emphasis | goblet squat 4 · incline dumbbell press 4 · bent-over row (barbell) 4 · parallel-bar dip 2 · dumbbell lateral raise 3 · plank 2 | 19 |
| B, hinge emphasis | Romanian deadlift 4 · dumbbell bench press 4 · single-arm dumbbell row 3 per side · rear-delt fly 3 · bicycle crunch 3 | 17 |
| C, lower body & shoulder | reverse lunge 4 per side · overhead press (barbell) 3 · inverted row 3 · incline push-up 3 · hammer curl 2 · supported knee raise 3 | 18 |

- **Horizontal rows per rotation:** 10 sets, from bent-over row 4 (A), single-arm dumbbell row 3 (B) and inverted row 3 (C). Other back-tagged work: Romanian deadlift 4 and rear-delt fly 3, both in B.
- **Parallel bars:** dips (A), inverted row and supported knee raise (C). B uses no bars.
- **Progression history follows the exercise, not the session.** Carry-forward looks up the last complete time an exercise was done in this program, whichever session it was in. It skips easier-day sessions and swapped exercises. Moving an exercise from B to C keeps its history.

## 4. Questions for you

**Q1. Should the inverted row become Full Body B's pulling movement?** These are structural options. The choice is yours.

- **(a) No change.** The inverted row stays in C and the dumbbell row in B.
- **(b) Swap places.** The inverted row (3 × 8–12, with its bar-check note) moves to B, and the single-arm dumbbell row (3 per side) moves to C.
  - Every weekly total stays the same: 10 row sets, 54 sets.
  - Every session then uses the bars.
  - B gets shorter, because it loses a per-side exercise. C gets longer, with two per-side exercises (reverse lunge and row).
- **(c) The inverted row moves to B, and C gets a different pull** that you choose, at a dose you choose. Library pulls that fit this equipment:
  - single-arm dumbbell row;
  - bent-over row (already in A);
  - chest-supported row (dumbbell and bench).

  Band row needs a resistance band. Bands appear in some of the app's older equipment notes but not in the athlete's 24 Oct list, so please confirm with the athlete whether one is available.
- **(d) The inverted row in both B and C**, replacing the dumbbell row in B. Row sets stay at 10, and the only dumbbell or barbell rowing left in the week is the bent-over row in A.

Option (b) is the only one that changes no weekly total. Whether it is the better training choice is for you to judge.

Separately, should the dumbbell row's swap list include the inverted row? Then a swap like Saturday's would be recorded as a swap.

**Q2. Barbell bench press at home.** What we found:

- **The athlete's equipment record:** a 7.75 kg barbell with **no rack**, limited to floor- or bench-start movements.
- **The TS 100 manual** (Decathlon / CORENGTH):
  - It describes body-weight training only.
  - Its warning label says: "Any use of this product other than that intended may lead to serious injury."
  - Its cover gives a maximum of 130 kg. Decathlon's support page says each bar takes 130 kg, and one Decathlon product page lists 125 kg.
  - It says nothing about barbell loads, sideways loads, or using the bars as a rack or stand.
  - It gives no stability figure.
  - The 2024 version's parts list has no part that connects the two units. An older version also exists, and we do not know which one the athlete owns.
- **NSCA (2017):**
  - Standard 3.2 requires attentive spotting, together with appropriate safety equipment such as power racks, when free weights are supported on the trunk or moved over the head or face. NSCA's basics manual names the bench press as an over-the-face lift.
  - The same standards document (p.7) says to use equipment only for the purpose the manufacturer intended.
  - It is written for professional facilities, not home trainees.
- **ISO 20957-4** sets safety requirements, including barbell-support strength and stability tests, for strength-training benches and free-standing barbell racks. The TS 100 manual cites no standard. None of the parts we could read (1, 2 and 4) names dip stations.

**We will not add a barbell bench press that uses the TS 100 as a rack.** Will you let us take barbell bench press out of every swap list while the equipment has no rack? It is offered today from dumbbell bench press, incline dumbbell press, dumbbell floor press and deficit push-up. We recommend doing so. The alternatives already in the Library need no rack: dumbbell bench press and dumbbell floor press.

**Q3. More movements on the bars.** The Library has three: dips, inverted row and supported knee raise. For this product, Decathlon suggests dips, push-ups, inverted rows, L-sits, leg raises and band-assisted dips, plus a weighted vest for dips. L-sit and leg raise are not in the Library. Neither are push-ups on the bars: the Library has floor, incline-on-bench and hands-raised deficit push-ups. Adding a movement needs a Library entry from us, then a prescription from you. Drawings already exist for leg raise and hanging leg raise; an L-sit would need a new one. Nothing will be added during the freeze unless you say so.

**Q4. Swapping to a different implement.** Each exercise carries simple equipment tags, and setups that combine equipment are not modelled. The app does not record which equipment the athlete owns. When an exercise is swapped for one on a different implement, the substitute inherits the original slot's starting weight, step and target. On Saturday the barbell bench opened at the dumbbell bench's first-set weight, which is a per-dumbbell value: 10 kg in the program as written. That cannot even be built on a 7.75 kg bar, whose loads run 7.75, 9.75, 11.75 kg and so on. What should a cross-implement swap start at?

- (a) No suggested weight; the athlete enters it.
- (b) The last weight logged for that exercise, if there is one, otherwise no suggestion.
- (c) Leave it as it is.

We recommend (b). It only repeats a load the athlete has already lifted and never generates a new one.

**Q5. After a set is logged above the equipment ceiling, what should the next session start from?**

- **O1.** The logged weight, as for every other set today. The warning shows again next time. This is your existing carry rule and needs no code.
- **O2.** The logged weight, capped at the ceiling.
- **O3.** That set falls back to the program's authored weight, and the reps still carry.
- **O4.** That session is skipped as the basis, and the next one starts from the last session that stayed within the ceiling. This is how swaps and easier days are already handled.

We recommend O1. It treats the log as the historical fact the athlete asked for, and nothing in it records that the athlete owns heavier equipment. If you read "do not treat it as owning heavier equipment" as "do not plan above the ceiling", O4 is the cleanest alternative. Any option applies from the next session start with no change to stored data. Until you rule, the app follows O1, as the athlete chose on 29 Oct.

**Q6. Timing.** The athlete asked for no permanent A/B/C change until you have reviewed this. Would you like to decide Q1–Q4 now, or at the first-rotation review?

## Sources

- Program and app behaviour: the Fit223 code at 29 Oct 2026 (`src/data/seed/program.ts`, `src/data/seed/exercises.ts`, `src/domain/workout.ts`, `src/domain/carryForward.ts`, `src/features/workout/SetScreen.tsx`).
- TS 100: the Decathlon support page, https://support.decathlon.fr/barres-a-dips-ts-100-notice-reparation, and the user manual (2024 version, ref. 8882305) linked from it. The Canadian product page, https://www.decathlon.ca/en/p/8882305/adjustable-dip-bars-ts-100, is the source for the suggested exercises.
- NSCA, *Strength and Conditioning Professional Standards and Guidelines*, Strength and Conditioning Journal 39(6), 2017: Standard 3.2, p.11, and p.7.
- ISO 20957-1:2024, general requirements, scope only. ISO 20957-4:2016, benches and free-standing barbell racks: scope and table of contents (the full texts are paywalled).
