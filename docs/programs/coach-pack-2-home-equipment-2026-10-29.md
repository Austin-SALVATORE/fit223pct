# For the coach: progress on your 29 Oct rulings, and the home-equipment feasibility review

**From:** the Fit223 team, 29 Oct 2026. This answers `coach-rulings-q1-q6-home-equipment-2026-10-29`.
**Baseline:** Mesocycle 2 Build v3 is unchanged: A 19, B 17, C 18 working sets. Nothing below changes a prescription.
**How to read it:**
- Section 1 is progress in the three tracks you asked for.
- Section 2 is the questions only you can answer.
- Appendix A is the feasibility matrix and Appendix B the purpose-built support research. Both were independently fact-checked twice and corrected before this was sent.

**Status after sending (added 29 Oct):** The coach answered in `coach-rulings-cq1-cq7-2026-10-29` and `coach-confirmation-cc1-cc4-2026-10-29`.
- CQ6: D8, a dip with a loaded handle held between the legs, is **not approved** as a standard loading method. It stays Conditional and is not ready for program use. No weighted dip is authorized.
- CQ7: no Conditional row is promoted. The full matrix did not reach the coach in that message, so Appendix A is kept for the first-rotation review.
- The text below is unchanged from what was sent.

## 1. Progress

### Track A: immediate product corrections

1. **Weight selector: live.** There is no hard maximum, and the exact entered load is stored. A non-blocking line shows only above the program's ceiling and never on a swapped exercise. Carry-forward repeats the logged load (your O1). A follow-up stops that line from shifting the weight controls under the thumb; it is verified and releasing.
2. **Cross-implement substitution (Q4 b): built, in final checks.**
   - A substitute on a different implement starts from its own most recent logged weight, or offers no weight.
   - It uses its own increment, never the original slot's.
   - A bodyweight substitute shows no weight at all.
   - The screen now resets on a swap. Before this, a swap before the first set kept and stored the previous exercise's weight.
3. **Inverted row as a single-arm dumbbell row substitute (Q1): built,** released together with item 2 so it can never inherit dumbbell weights. It is recorded under its real identity. Inverted row → dumbbell row stays.
4. **Contaminated 24 Oct history (Q1, Q5): designed, waiting for the athlete's data export.**
   - The app will skip exactly the 24 Oct dumbbell-row entries (really inverted rows) and the 24 Oct barbell bench entries (capped at 20 kg). They are identified by that workout's unique id, read from the export.
   - The stored record is never edited.
   - Next prescription: the dumbbell row resumes from its last correct complete session, or the authored baseline.
   - Display: "Last time" marks those entries as not recorded correctly.
   - Until it ships, the athlete adjusts the next Full Body B row by hand.
5. **Barbell bench press out of the routine swap lists (Q2): in build.**
   - It is removed from all four lists that offered it: dumbbell bench press, incline dumbbell press, dumbbell floor press and deficit push-up.
   - It stays in the Library.
   - It ships in the same release as a collapsed **"Other exercises"** section in the swap sheet. That section lists the rest of the same muscle group's Library, under a line saying they are not suggested substitutes. So a bench press done on proper equipment can still be logged truthfully, with no gap between the two changes.
6. **Also fixed (the athlete's 24 Oct "consistent load display" request): built, in final checks.** Today's session preview now shows exactly the plan the session will start from. Before, it showed the program's loads while Start used the carried ones.

### Track B: home-equipment innovation review

- **Appendix A**, the feasibility matrix: 21 candidates.
  - 2 Suitable with existing verified equipment use.
  - 11 Conditional.
  - 3 Require purpose-built equipment.
  - 5 Not recommended.
  - Nothing in it is approved for the program by appearing there.
- **Appendix B**, purpose-built support for barbell bench press and rack-assisted squats. It covers loading, unracking, reracking, stability, independent support movement and failure management, and requires no purchase.
- In short:
  - No manufacturer endorses parallel bars as barbell supports.
  - The TS 100 has none of the features ISO 20957-4 requires of free-standing barbell supports: ground connection, a lipped yoke, and stability under uneven load and impact.
  - At 93 cm maximum it cannot hold a bar at squat unrack height.

### Track C: UI

- Collapsible monthly sections on the Program page are **live** (29 Oct). The current month opens by default, and the other months start collapsed. Scheduling, records and progression are unchanged.

## 2. Questions for you

To keep moving, the app currently follows the readings marked *(current)* below. Each is a small change if you rule otherwise.

- **CQ1. The athlete's real 24 Oct bench loads.** We propose recording them in this documentation only, not as performance history, because they are recalled after the fact. The app keeps the stored 20 kg, flagged as capped by a since-fixed bug. The next bench done on proper equipment creates real history. Do you agree?
- **CQ2. "Most recent valid logged weight" (Q4 b), for a ladder.** The app currently offers *(current)* the last weight logged in that exercise's most recent session. On a ladder the last set is the heaviest. QA found this example: if the barbell bent-over row was last logged as 17.75×12, 21.75×10, 25.75×8, 29.75×6, then swapping the dumbbell row for the bent-over row offers **29.75 kg for the 12-rep first set**. Later sets offer the weight just lifted. The alternatives are:
  - the first set's weight from last time;
  - the weight logged at the same set position;
  - the heaviest set, which here is the same as the last;
  - no suggested weight at all.

  Which do you want? The athlete can always change the weight before logging.
- **CQ3. Which logs count as "valid".**
  - *(current)* Easier-day sessions and logs from other program phases count, so the offered weight matches the "Last time" line on the same screen.
  - Exclude them.

  Which do you prefer?
- **CQ4. Swaps within the same implement** (for example dumbbell bench press → incline dumbbell press). *(current)* They keep the slot's prescribed loads, as before, because Q4 ruled on incompatible implements. Please confirm.
- **CQ5. For visibility.** The excluded 24 Oct entries will also be left out of the strength trend and stagnation detection, because they must not count as verified performance.
- **CQ6. Matrix row D8.** Is holding a loaded dumbbell handle between the legs an acceptable way to add load to dips? This is the validation the matrix needs before D8 could move from Conditional.
- **CQ7. Next steps for Track B.** Which Conditional candidates, if any, do you want validated first? And should that wait for the first-rotation review, as you set out for structural changes?

---

## Appendix A: Home Equipment Combination Feasibility Matrix

### Home Equipment Combination Feasibility Matrix (Track B, coach §3)

Prepared 29 Oct 2026 for the coach's review. Revised the same day after an independent fact-check.

- **Nothing here is approved for the live program by appearing in this matrix** (coach §3).
- It contains no prescribed sets, reps or loads. Equipment ceilings and the manufacturer's vest sizes appear as facts.
- "Could replace" names the existing A/B/C exercise with the same pattern and muscles. It is a candidacy for the coach to judge, not a recommendation.
- Evidence is cited by number to the sources at the end. **Team judgement** marks the team's own reasoning, which is not a sourced fact.

**Dumbbell convention:**

- The coach's "adjustable dumbbells" are the athlete's **two 2 kg handles**. Both draw plates from one shared pool of 8 × 1, 4 × 2 and 4 × 5 kg (36 kg in all). The 7.75 kg barbell draws from the same pool.
- There are no separate fixed dumbbells. "Loaded handle" below means one of the two handles.
- No row needs the barbell and a loaded handle at the same time.

**Classification key:**

- **S**: Suitable with existing verified equipment use.
- **C**: Conditional, requires further validation.
- **P**: Requires purpose-built equipment.
- **N**: Not recommended.

**How a class is chosen.** The same rules apply to every row:

- **S** only when two things hold. First, the manufacturer names or depicts that specific setup, or it is already a verified use in the program. Second, the team adds nothing that changes the forces on the units.
- **C** when the team adds anything: a bench, a single unit, a new pull direction, or a longer moving lever. It stays C until validated.
- **P** when the concept needs equipment the athlete does not own.
- **N** in two cases. A source (the manufacturer, a standard, a professional body or a coach ruling) weighs against the concept. Or team judgement alone weighs against it and it brings no offsetting benefit. A team-judgement concern alongside a real benefit makes the row **C**, not N.

**M-std**, the TS 100 limitations that apply to every row:

- **Intended use:** body-weight training [1]. "Any use of this product other than that intended may lead to serious injury" [1][2].
- **Load figures**, as each source states them:
  - Manual cover: "Max 130 kg" beside a person pictogram [1].
  - French support page: "supportent une charge de 130 kg par barre" and "Poids maximal utilisateur: 130 kg" [3].
  - decathlon.ca: "Can withstand a load of 130 kg (287 lb) per bar", and under usage precautions "Max. user weight: 130 kg (287 lb). For home use only." Its specification table lists "Maximum Load 130 kg", "Working Load (kg) 130 kg", "User's Maximum Weight: weight < 125 kg" and "Workout Type: Body Weight" [5].
  - The explicitly user-weight figures are the cover pictogram, "Poids maximal utilisateur", decathlon.ca's "Max. user weight" and its "User's Maximum Weight: weight < 125 kg". Reading the per-bar, Maximum Load and Working Load figures as body-weight ratings too is an inference from the product's stated body-weight use (team judgement).
  - The conflict between 130 kg and < 125 kg is **unresolved**.
- **Setup:**
  - A flat, stable surface, with pins engaged and wing screws tight [1].
  - The manual shows a 1 m clearance pictogram on each side [1][2].
  - The two units have no connecting part [1].
- **Silent on:** barbell loads, side or lateral loads, use as a rack, and any stability or tip figure [18 §1f].

#### Matrix

| # | Candidate (muscles) | Combination | Benefit vs existing movements | Class | Manufacturer limitations | Could replace | Library / art / metadata needed |
|---|---|---|---|---|---|---|---|
| A1 | Barbell bench press, with the bar unracked from and reracked onto the TS 100 tops (chest, triceps, shoulders) | Barbell + bars + bench | Small. Both implements draw on the same 36 kg pool. The barbell tops out at 43.75 kg total (7.75 kg bar plus the whole pool). The dumbbell bench tops out at two 20 kg handles (2 kg handle plus 18 kg of plates each, which is also the whole pool), or 40 kg (`program.ts:83,97`). | **N** | M-std. No manufacturer was found that endorses dip stations or parallel bars as barbell supports [19 §3].<br>**ISO 20957-4.** Against its clauses for free-standing barbell supports [8], the TS 100 has three gaps (team judgement):<br>- no ground-connection device (§5.3);<br>- no yoke, meaning a front lip 20–40 mm high and a rear upstand at least 80 mm higher (§5.4);<br>- no rating for a non-symmetric barbell impact (§5.5).<br>§5.2.1's unequal-load rule is not cited, because it sits under "Benches with fixed barbell supports".<br>**What the 24 Oct session does not test.** The coach records that the setup "felt stable and usable during normal repetitions" (§2). The loads used are unknown and must not be invented (Q5). Normal reps do not test the four failure events: an uneven rerack, a missed rerack, plates tipped off one side, and a failed rep (team judgement [19 §2]).<br>**NSCA.** Standard 3.2 asks for spotting "in conjunction with appropriate safety equipment (e.g., power racks)" for activities where "free weights are supported on the trunk or moved over the head/face". NSCA also says "use the equipment only for the purpose intended by the manufacturer" [6]. That document addresses S&C professionals and facilities, and its equipment guidance is for "professional/commercial (not home) use" [6]. NSCA's Basics manual lists over-the-face lifts such as the bench press among those where, "When lifting heavy resistances, the role of the spotter increases due to the potential inability of the athlete to lift the weight to a safe position" [7]. | Dumbbell bench press (B) | Nothing new. `bench-press` stays in the Library (coach Q2) and has art. Removing the rack-assuming swaps is **planned** in Track A (coach Q2: approved, in build, not shipped). |
| A2 | Free-bar back or front squat, with the bar taken from the TS 100 tops (quads, glutes, core) | Barbell + bars | Small. The barbell tops out at 43.75 kg, against 38 kg for the goblet squat's single handle (2 kg handle plus the whole pool) (`program.ts:85,97`). | **N** | M-std.<br>**Height.** Sources give three sets of positions:<br>- 72/79/86/93 cm [3];<br>- 79/86/93 cm, elsewhere on the same page [3];<br>- 77/84/91 cm, on the UK support page [20]. Reading that as the older version is an inference, from that page linking the older manual.<br>Either way the top is no higher than 93 cm.<br>**Unrack.** A back-squat unrack needs supports "just below shoulder height" (RPM manual, via [19 §6]). So the TS 100 cannot hold the bar at back- or front-squat unrack height. The only squat it reaches starts from the bottom, with the bar at hip level, like a pin squat. Every rep then ends by lowering the bar onto unanchored units, often unevenly, with no catch (team judgement [19 §6]).<br>**NSCA:** "to promote safety of the athlete during lifts with the bar on the back, or front of the shoulders, a power rack with the safety crossbars in place at an appropriate height is recommended" [7].<br>**Smith squat.** Coach §3A: "The TS 100 is not a guided Smith machine. Do not label a free-bar squat setup as a Smith squat." | Goblet squat (A) | Nothing new. `barbell-squat` already exists (art via the `barbell-back-squat` alias). **Never** use the `smith-machine-squat` art. |
| A3 | The TS 100 as safety catches beside or under any barbell lift (none) | Barbell + bars | None: it only stands in for missing safety equipment. | **N** | M-std. There is no drop or impact rating [18 §1f].<br>A bar dropped onto the units is the "non-symmetric barbell impact" that ISO 20957-4 §5.5 requires a barbell support's rear part to absorb without tipping over [8]. The TS 100 has no such rating (team judgement against that clause).<br>The tops are round tubes (36 mm on the 2024 version [3]) with no lip or hook to hold a bar (team judgement). The bar can roll off and the units can be knocked apart (team judgement).<br>Purpose-built failure protection comes from catches, spotter arms, safety bars or straps [19 §1]. That straps need a four-post rack is team judgement [19 §1]. | None | None |
| A4 | A barbell laid across both units as an inverted-row bar (back, biceps) | Barbell + bars | None over the approved parallel-bar row. | **N** | M-std. Two unconnected units with round tops, so the bar can roll and the units can spread (team judgement). | Inverted row (C) | None |
| A5 | Barbell bench press or squat from purpose-built stands with safeties | Barbell + bench + purpose-built stands or rack | As A1 and A2. | **P** | ISO 20957-4 covers "free-standing barbell racks" and requires free-standing supports to have a ground-connection device (§5.3) [8][19 §4]. The TS 100 cites no standard [1].<br>**Categories with failure protection** [19 §1]: connected squat stands with spotter arms; half or folding racks with safety bars; wall-mounted folding racks with safety bars; power racks with straps.<br>**Category properties:**<br>- Stands on separate bases accept any bar length, but they can drift apart, and §5.3 asks for a ground connection [19 §2].<br>- Some fixed supports state bar lengths. Decathlon's Bench Press 80 kg says "1,50m, 1,75m ou 2m" [21]. Decathlon's Rack 500 reportedly takes 1.75 m or 2 m only (NOT VERIFIED) [19 §0].<br>- Benches with built-in uprights: the Bench Press 80 kg's hooks are there "pour empêcher la barre de basculer pendant que tu la charges ou la décharges" [21]. Whether the Bench Press Fold has anything that catches a failed rep is **unresolved** [19 §1]. Three Decathlon statements exist and none settles it:<br>- its product page: "Safety hooks prevent the bar from tipping while removing weights";<br>- its spec table: "with bar spotter", undefined;<br>- its manual sticker: "ALWAYS USE THE SECURITY DEVICES", also undefined.<br>**Purchase boundary.** The coach: "Do not require the athlete to purchase new equipment merely to complete this research" (§2). With no purchase, the dumbbell bench press (B) needs no supports at all. Floor-press and bail methods have secondary sources only [19 §5].<br>Treating a Smith press as a separate exercise identity from a free-bar bench press is team judgement [19 §1]. | Dumbbell bench press (B), goblet squat (A) | Nothing for the exercises. The `Equipment` union (`types.ts:28`) has no rack token. Adding one is an owner decision, and only if equipment is ever acquired. |
| B1 | Feet-elevated inverted row, heels on the bench (back, biceps) | Bars + bench | A harder row with no added sets. It puts more body weight through the arms (coaching sources [16][17]). **No primary measurement found.** The base inverted row gave the highest lat and upper-back activation of three rows [10]. | **C** | M-std. The coach's row check, "If either bar moves, slides or tilts, do not perform this variation", was set for heels on the floor [R1]. The pull angle changes here, so the check must be repeated. The bench sits inside the 1 m clearance pictogram [1]. | Inverted row (C), or single-arm dumbbell row (B) per Q1 | A new id, or a coach-ruled state like the dip's. Carry-forward looks up history per exercise id (`carryForward.ts`, basis lookup), so two difficulties under one id blur the next prescription (team judgement). The `inverted-row` art shows heels on the floor. |
| B2 | Decline push-up: hands on the floored units, feet on the bench (chest, triceps, shoulders, core) | Bars (floored) + bench | Harder than a floor push-up. With the feet on a 30–61 cm box, peak vertical GRF was 0.70–0.74 of body mass, against 0.64 for a regular push-up [9]. | **C** (was S) | Decathlon Pro names "pompes déclinés" among TS 100 uses in one line, with no setup and no bench [4]. The manual pictures push-ups on the floored units [1][2], but not with the feet raised.<br>Feet on the bench with hands on the floored units is the team's own combination, and the bench sits inside the 1 m clearance [1].<br>**Validation:** the coach confirms the setup, and the floored units don't slide under the push (team judgement). | Incline push-up (C), as a harder variant | New id (none exists), art, and equipment `bench` + `parallel-bars`. With the hands on the floor instead, it becomes a bench-only decline push-up with no TS 100 involved. |
| B3 | Feet-supported dip, toes on the bench (chest, triceps, shoulders) | Bars + bench | Partial support that is reduced over time (coaching [15]). | **C** | The dip is pictured [1]. Feet-supported dips are not Decathlon-listed; band-assisted dips ("dips delestés avec élastique") are [4]. The bench sits inside the 1 m clearance [1]. | It **is** the parallel-bar dip (A) | No new id. It fits the existing Assisted state, which records status, not magnitude [R2]. The coach confirms whether this is the intended method. |
| C1 | Single-leg RDL with one hand lightly on one unit (hamstrings, glutes, core) | Loaded handle + one unit | Instability lowers externally measured force output [11], so support may shift the work to the hinge (team inference from [11]). | **C** | Single-unit use is pictured only as a heel-on-unit stretch [1][2].<br>The older manual has one related warning: "Use the product to support during streching, using resistance straps, ropes or other means to be attached to it" (EN p.9). In French: "comme support lors d'étirements, en y fixant des bandes de résistance, des cordes ou d'autres accessoires" (p.10) [2]. It does not address balance support with nothing attached.<br>Per-unit weight is unpublished [3]. Light touch only (team judgement). | Romanian deadlift (B). `single-leg-rdl` is already its listed swap. | Exists (`single-leg-rdl`, art via the alias, unsupported pose). Support needs a cue, or a new id if the coach wants it logged apart. |
| C2 | Split squat or Bulgarian split squat with one hand on a unit (BSS: rear foot on the bench) (quads, glutes) | Loaded handle + one unit (+ bench) | As C1 [11]. | **C** | As C1, plus the 1 m clearance with the bench [1]. | Reverse lunge (C). The coach chose reverse lunge deliberately over BSS (`exercises.ts`, reverse-lunge comment). | Both exist (`split-squat`, `bulgarian-split-squat`) and have art. A support cue only. |
| C3 | Single-leg calf raise with one hand on a unit (calves) | Loaded handle + one unit | Calves currently get **0** sets per rotation [18 inventory]. | **C** | As C1. | None. It would be an **addition**, and the coach rules out volume inflation (§3, §8). | Exists (`standing-calf-raise`, art). A support cue only. |
| C4 | Single-arm dumbbell row braced on a bar instead of the bench (back, biceps) | Loaded handle + one unit | None. The bench already gives a stable brace. | **N** | A sustained off-axis lean on one freestanding unit, of a kind the manufacturer does not describe (team judgement). | Single-arm dumbbell row (B), the same exercise | None |
| D1 | Neutral-grip deficit push-up on the floored units (chest, triceps, shoulders, core) | Bars (floored) | Range of motion past the hands, the Library's deficit definition (`deficit-push-up` art prompt). | **S** | This setup is the manual's push-up pictogram: hands on the units lying on the floor [1][2]. "Deficit" is the team's description of its depth. | Incline push-up (C), as a harder variant | Exists (`deficit-push-up`). Its art shows **plyo-box risers**, which misrepresents this setup. It needs a setup cue plus new art or a distinct id. |
| D2 | High-incline push-up with hands on the upright bars (chest, triceps) | Bars (upright) | A regression only. The hands are at 72 cm or higher, likely under the 0.41 of body mass in peak vertical GRF measured with hands on a 61 cm box (team extrapolation beyond [9]). | **C** | Upright push-ups are **not** pictured; the manual draws push-ups on floored units [1][2]. The push has a forward force component that is not rated (team judgement). | Incline push-up (C), as an easier variant | A new id plus art. Low value. |
| D3 | Support hold and full L-sit, the two ends of the L-sit progression (core, hip flexors, shoulder depressors, triceps) | Bars | Isometric trunk and support strength (coaching [13]). The program already has a short support hold as a dip warm-up drill, but no compression hold. | **S** | Full L-sit: Decathlon names "L-sits" as static work on the TS 100 [4].<br>Support hold: already a verified program use. It is the coach-ordered `supported-dip-hold` drill in the dip warm-up (`src/data/seed/warmups.ts`, `mesocycle2-parallel-bar-dip-prep-v1`).<br>Both bars must be locked at equal height [1][R1]. | Partial match only: plank (A), supported knee raise (C) | New id(s) and art for the L-sit. The support hold is a warm-up drill, not a Library exercise, so using it as a training movement needs the coach's ruling. The coach also rules between one id with a stage state and separate ids (same logic as B1). |
| D9 | Tuck and one-leg L-sit stages, between the support hold and the full L-sit (core, hip flexors) | Bars | Intermediate stages of the progression (coaching [13]). | **C** | Not named by Decathlon, which names only "L-sits" [4]. Team judgement on the forces:<br>- the tuck holds the supported knee raise's knees-up position statically;<br>- the one-leg stage extends a leg, which is the longer-lever addition that moved D4 to C.<br>**Validation:** the coach's stability check [R1] in each stage, and the coach confirms the stages. | Partial match only: plank (A), supported knee raise (C) | As D3: new id(s) or a stage state, plus art. |
| D4 | Straight-leg raise in support on the bars (core, hip flexors) | Bars | A longer lever than the current knee raise (team judgement; the tuck-to-extended order is from [13]). No study of this exercise was found.<br>The ACE captain's chair scored 212% rectus abdominis and 310% obliques against the crunch [12]. In that exercise the hands grip hand holds, the lower back rests against a back pad, and the knees are lifted, so it is a different exercise. | **C** (was S) | Decathlon names "relevés de jambes" as dynamic work [4], but says neither straight-leg nor in support. The bars are used as in the approved supported knee raise. The team adds a longer moving lever, which may add fore-aft force at the hands (team judgement).<br>**Validation:** the coach's stability check [R1] during a controlled straight-leg raise, and the coach confirms it as the knee raise's progression. | Supported knee raise (C), as a progression; bicycle crunch (B) | New id plus art. The `leg-raise` art is a **floor lying** raise and `hanging-leg-raise` needs a pull-up bar, so neither fits. New art must follow the station ruling [R3]. |
| D5 | Assisted single-leg squat to the bench, hands on both bars (quads, glutes) | Bars + bench | Unilateral knee-dominant work at body weight, with support reduced over time (coaching [14]). | **C** | Not described by the manufacturer. Pulling back on freestanding units is the same concern as the row check [R1]. 1 m clearance [1]. | Reverse lunge (C), goblet squat (A) | New id plus art; equipment `parallel-bars` + `bench`. |
| D6 | Weighted dip with a vest or dip belt (chest, triceps, shoulders) | Bars + vest or dip belt | A progression past unassisted dips. | **P** | Decathlon suggests its "gilets lestés de 5kg … ou 10kg" for dips [4]. The athlete owns no vest or belt. User plus added load should stay within the stated maximum: 130 kg [1][3], or "< 125 kg" in one Decathlon spec table [5]. How those figures apply to added load is team judgement. | Parallel-bar dip (A), as a progression | The dip has no external-load field, only the Assisted state [R2]. Adding one is a schema decision for the owner and coach. |
| D7 | Hanging knee or leg raise (core) | Needs a pull-up bar | n/a | **P** | The TS 100 tops out at 93 cm or lower [3][20] and cannot be hung from. | Supported knee raise (C) | The `hanging-leg-raise` art exists (pull-up bar). **Do not promote** it for this equipment. |
| D8 | Dip holding a loaded handle between the feet or knees (chest, triceps, shoulders) | Bars + loaded handle | Added load without a vest or belt. | **C** (was N) | Not described by the manufacturer; Decathlon's suggested method is a vest [4]. A handle held by the legs can drop (team judgement; no source found). User plus added load should stay within the stated maximum (team judgement, see M-std).<br>**Validation:** the coach rules on whether a handle held by the legs is an acceptable loading method. | Parallel-bar dip (A), as a progression | No new id. It has the same external-load gap as D6 [R2]. |

**Count:** S 2 · C 11 · P 3 · N 5 (21 candidates).

Changes from the first draft:

- B2 and D4 moved from S to C.
- D8 was split out of D6, and is C.
- D9 was split out of D3, and is C.

#### Category A split (coach §3, Barbell + Parallel Bars)

The sourced basis for **N** on A1–A4 is the coach's own rulings:

- "Do not recommend unsupported loaded barbell configurations as ready-to-use training movements" (§3A).
- "Do not prescribe or endorse the TS 100 as a certified barbell rack or Smith machine" (§2).

The row evidence adds the manufacturer's intended-use warning, ISO 20957-4 and NSCA.

| Concept | Physically possible | Manufacturer-supported | Verified stability and capacity | Needs purpose-built equipment | Should not be used |
|---|---|---|---|---|---|
| Bench press on the TS 100 (A1) | Yes. The setup "felt stable and usable during normal repetitions" (coach §2) on 24 Oct (coach Q5, §5). The loads are unknown (Q5). Independent supports can be placed at any spacing, which suits a short bar (team judgement). The bar's identity, likely 1.55 m, is NOT VERIFIED [19 §0]. | No. No manufacturer endorses dip stations as barbell supports [1][18][19 §3]. | No. Three 130 kg figures are explicitly user weight [1][3][5]; reading the per-bar, Maximum Load and Working Load figures as body-weight ratings is inference (M-std). Nothing rates bar, lateral or rerack loads. Against ISO 20957-4 §5.3–§5.5 there is no ground connection, no yoke, and no rating for a non-symmetric impact (team judgement [8][19 §4]). | Yes: catches, spotter arms, safety bars or straps (A5, [19 §1]). | Yes, as a rack and as failure protection. |
| Free-bar squat from the TS 100 (A2) | Only as a start from the bottom, with the bar at hip level. Back- and front-squat unrack heights are out of reach at 93 cm or lower (team judgement [19 §6]). | No | No | Yes (A5, [19 §6]) | Yes. Coach §3A: never label a free-bar squat setup a Smith squat. |
| TS 100 as safety catches (A3) | Placeable | No | No. There is no rating for the §5.5 impact case [8]. | Yes (A5). That straps need a four-post rack is team judgement [19 §1]. | Yes |
| Barbell across both units as a row bar (A4) | Placeable | No | No | Not needed: the approved row uses the bars directly | Yes |

#### Key caveats

- **One good session does not validate a setup** (coach §2, §8). That is why every row where the team adds something to a manufacturer-named use is **C**: a bench, a single unit, a new pull direction, or a longer moving lever. The coach's own row rule shows the validation each one needs: if either bar moves, slides or tilts, stop [R1].
- **The older manual's warning, read correctly.**
  - It is one warning, about using the product as a support **during stretching with something attached**: "Use the product to support during streching, using resistance straps, ropes or other means to be attached to it" [2].
  - The heel-on-unit stretch in the pictograms attaches nothing [1][2], so it does not contradict the warning.
  - A weaker tension remains. The warning names bands attached to the product, though in a stretching context, while Decathlon's page suggests band-assisted dips [4].
  - Bands are not in the coach's §3 equipment list, so band variants are left out of the matrix.
- **Decathlon's load figures are inconsistent.** 130 kg appears as a user maximum, as "par barre", as "Maximum Load" and as "Working Load". One spec table gives the user maximum as "< 125 kg" (M-std, [1][3][5]). Only the user-maximum figures are explicitly body weight.
- **Carry-forward is keyed by exercise id** (`carryForward.ts`, basis lookup). A variant adopted under an existing id needs its own id or a ruled state, as the dip's Assisted flag does. Otherwise its logs set the other variant's next prescription (team judgement on the consequence).
- **Art rules.**
  - All new parallel-bar art must show two independent bars with consistent geometry [R3].
  - Existing art that must not be used for these setups: `leg-raise` (floor), `hanging-leg-raise` (pull-up bar), `smith-machine-squat`, and `deficit-push-up` (box risers).
- **The athlete's bar has not been identified.** It is probably the Corength 1.55 m bar with a 1 m inner length, but that match rests on its 7.75 kg weight only [19 §0]. The owner can confirm it from the label. It matters only if purpose-built supports are ever considered (A5), because bar length decides which categories fit.

#### Sources

Kind: **MFR** manufacturer · **PRO** professional body or standard · **PR** peer-reviewed · **CB** certifying body · **CO** coaching source · **REPO** project file.

1. MFR. Corength TS 100 manual, ref. 8882305 (2024): cover, p.3 warnings, p.5 pictograms, p.8 safety. https://cdn.decathlon-share.com/product-user-guide/wj3drwzxt4cif/chn_5346722_ss24_354940_981_hd_2024-03-15_09-17-06.pdf
2. MFR. TS 100 older manual (ref. 8584544). EN p.9 and FR p.10 carry the stretching-with-attachments warning; the spelling "streching" is the manual's own. https://drive.google.com/file/d/1NXrTmw6zpzvedGKf97dhggMnID8Jiwhg/view
3. MFR. Decathlon France support page for the 2024 TS 100. It gives "130 kg par barre" and "Poids maximal utilisateur: 130 kg"; heights "72cm, 79cm, 86cm et 93cm" and, elsewhere, "79, 86 ou 93 cm"; the 36 mm tube; and 12.4 kg for both bars. https://support.decathlon.fr/barres-a-dips-ts-100-notice-reparation
4. MFR. Decathlon Pro TS 100 page: dips, "rowings inversés", "pompes déclinés", "L-sits", "relevés de jambes", "dips delestés avec élastique", and 5 or 10 kg weighted vests. https://www.decathlonpro.fr/barres-a-dips-reglables-et-compactes-ts-100-id-8882305.html
5. MFR. Decathlon Canada TS 100 page: "Can withstand a load of 130 kg (287 lb) per bar", and "Max. user weight: 130 kg (287 lb). For home use only." Its spec table gives "Maximum Load 130 kg", "Working Load (kg) 130 kg", "User's Maximum Weight: weight < 125 kg" and "Workout Type: Body Weight". It was read in the original research [18 §1a]. The first fact-check's re-fetch returned 403, and the re-verification pass read it. https://www.decathlon.ca/en/p/8882305/adjustable-dip-bars-ts-100
6. PRO. NSCA *Strength and Conditioning Professional Standards and Guidelines* (2017): Standard 3.2 and the p.7 intended-use guideline. It is written for S&C professionals and facilities, and its equipment guidance is for "professional/commercial (not home) use". https://web.archive.org/web/20260611115926/https://www.nsca.com/globalassets/education/nsca_strength_and_conditioning_professional_standards_and_guidelines.pdf
7. PRO. NSCA *Basics of Strength and Conditioning Manual* (2012), ch. 3, spotting. https://web.archive.org/web/20240105092846/https://www.nsca.com/contentassets/48a12160221541acbdc048498d77192d/basics_of_strength_and_conditioning_manual.pdf
8. PRO. ISO 20957-4:2016. Scope: https://normy.normoff.gov.sk/norma/124812/nahlad. Clause text from the sample: https://cdn.standards.iteh.ai/samples/66870/eea8faf5d4164c5d8e4388a2444f72e0/ISO-20957-4-2016.pdf.
   - §5.2 (including §5.2.1) covers benches with fixed barbell supports.
   - §5.3 covers free-standing barbell supports.
   - §5.4 covers barbell support dimensions.
   - §5.5 covers barbell support strength and stability.
   - The §6.3–§6.5 pass criteria were not read (paywalled).
9. PR. Ebben WP et al., "Kinetic analysis of several variations of push-ups", *J Strength Cond Res* 2011;25(10):2891–4, PMID 21873902. The coefficients (peak vertical GRF as a coefficient of body mass) come from the conference version, not the journal paper: Wurm B … Ebben W, ISBS 2010 proceedings, Table 1 (https://ojs.ub.uni-konstanz.de/cpa/article/view/4457/4146). The PubMed abstract gives no per-variation coefficients.
10. PR. Fenwick, Brown and McGill, "Comparison of different rowing exercises", *J Strength Cond Res* 2009, PMID 19197209. https://pubmed.ncbi.nlm.nih.gov/19197209/
11. PR (review). Behm and Anderson, "The role of instability with resistance training", *J Strength Cond Res* 2006;20(3):716–22, PMID 16937988. https://pubmed.ncbi.nlm.nih.gov/16937988/
12. CB. ACE-commissioned EMG study led by Peter Francis, PhD, San Diego State University Biomechanics Lab, reported in *ACE FitnessMatters*, May/June 2001. It is not peer-reviewed. The captain's chair is described as "gripping the hand holds and lightly pressing your lower back against the back pad", then lifting the knees. https://www.acefitness.org/getfit/studies/BestWorstAbExercises.pdf
13. CO. M. Dewar, CSCS, "L-sit hold progression", BarBend (updated 9 Aug 2023). https://barbend.com/l-sit-hold-progression-for-beginners/
14. CO. C. Garay, "How to progress pistols", Breaking Muscle (updated 25 Apr 2022). https://breakingmuscle.com/whats-preventing-you-from-doing-pistol-squats-how-to-progress-pistols/
15. CO. Hybrid Calisthenics, "Assisted Parallel Dips" ("Rest your toes on the chair behind you"). No author is named. https://www.hybridcalisthenics.com/assisted-parallel-dips
16. CO citing PR. A. Sánchez Pérez, Mundo Entrenamiento (2021), citing Ronai and Scibek, "The Inverted Row", *Strength Cond J* 2014;36(4):94–97 (NSCA). The paper's existence was verified, but its full text was not read. https://mundoentrenamiento.com/en/inverted-row/
17. CO. E. Cressey, "10 inverted row progressions" (undated). https://ericcressey.com/10-inverted-row-progressions/
18. REPO. The team's TS 100 research notes: every TS 100 fact and quote, with URLs. The TS 100 sources are listed in this appendix.
19. REPO. The purpose-built barbell support research, cited by section (§0–§7). It is Appendix B of this pack. Claims it tags NOT VERIFIED are marked the same way here.
20. MFR. Decathlon UK support page for the TS 100: "3 heights available: 77 cm / 84 cm / 91 cm". It links the older manual, which is the basis for inferring that it describes the older version. https://support.decathlon.co.uk/ts-100
21. MFR. Decathlon France support page for the Bench Press 80 kg: bar lengths "1,50m, 1,75m ou 2m", and safety hooks "pour empêcher la barre de basculer pendant que tu la charges ou la décharges". https://support.decathlon.fr/banc-bench-press-80kg-notice-entretien-et-reparation

Coach and owner rulings:

- R1. `docs/programs/inverted-row-grip-coach-ruling-2026-10-23.md`
- R2. `docs/programs/dip-assistance-ruling-2026-10-21.md`
- R3. `docs/programs/parallel-bars-station-ruling-2026-10-23.md`

---

## Appendix B: Purpose-built barbell support research (bench press and rack-assisted squats)

### Track B: purpose-built barbell supports for bench press and rack-assisted squats

Researched 29 Oct 2026, in answer to coach rulings §2 (follow-up research) and §3A. Revised the same day after the lead's fact-check (D2, I7, I10, I13) and re-verification (ISO clause scope, the 24 Oct wording, the 130 kg wording, peg wording, the Bench Press 80 kg hooks). This file holds facts with sources and no training prescriptions.

**No purchase is implied.** The coach's instruction (§2) is: "Do not require the athlete to purchase new equipment merely to complete this research." Products are cited only as evidence of a category's properties: how its supports, catches, anchoring and bar fit are specified. A product's statement about itself is not advice to buy it.

Tags:

- **[PRIMARY]**: the manufacturer's manual or spec sheet, or a standard's own text.
- **[MFR-WEB]**: the manufacturer's own product or support page. It comes from the manufacturer but is not the manual.
- **[SECONDARY]**: a third party, including a manufacturer's marketing blog.
- **[NOT VERIFIED]**: seen only in a search-engine snippet, because the page itself refused automated fetches (403, 429 or a login wall).
- **Team judgement**: my own mechanical reasoning, with no source behind it.

TS 100 facts come from the team's TS 100 research notes (see Appendix A's sources) and are not re-derived here.

**What is known about 24 Oct.** The sources say only two things:

- the athlete tested a barbell bench press setup "using the freestanding Domyos TS 100 bars as supports" (coach §2);
- "The barbell rested on the TS 100 bars during the session" (coach pack, `docs/programs/coach-pack-weight-cap-dip-station-2026-10-29.md`).

The coach records that it "felt stable and usable during normal repetitions" (§2). **The loads actually lifted are unknown, and the bar may even have been bare (7.75 kg):**

- the stored value is a 20 kg total cap;
- the coach says it must not be treated as verified performance;
- the athlete will supply the real figures (§5).

Nothing in the evidence describes:

- whether plates were on the bar, or whether it was loaded symmetrically;
- how it was unracked or reracked, or where on the units it rested;
- any failed rep.

---

#### 0. Bar length as a category property

- **The athlete's bar, likely match.** The Decathlon/Corength "Weight Training Bar 28 mm 1.55 m", ref. 8289896. [MFR-WEB] https://www.decathlon.ca/en/p/8289896/weight-training-bar-28-mm-155-m
  - "lightweight (7.75 kg/17 lb)"
  - "Length: 1.55 m"
  - "Inner length: 1 m"
  - "Load length: 25 cm (10”) per side"
  - "Diameter: 28 mm"
  - "Max. weight load: 160 kg"
  - "For home use only"
  - Collars are sold separately: "28 mm (1”) Disc Collar (ref: 8574652)".
- **Not verified:** that this is the athlete's bar. The match rests on weight only. Decathlon's other 28 mm bars are 1.20 m at 6 kg and 1.75 m at 8.75 kg, per search snippets. Whether the sleeves rotate is not stated.
- **The property to check (team judgement).** With 1.0 m between the inner collars, both supports must sit within about 1 m of each other, so that the bar rests on the shaft and not on the plate sleeves.
  - Supports with a fixed spacing state, or imply, a bar-length range. A short bar can fall outside that range.
  - Independent supports have no fixed spacing.
  - That probably explains why the TS 100 pair could take this bar on 24 Oct. It does not establish that the arrangement was safe.
- **How manufacturers state this property.** Examples of the property, not fit advice:

| Category | How the bar-length property is stated | Tag |
|---|---|---|
| Bench with integrated uprights | "utilise des barres d'une largeur de 1,50m, 1,75m ou 2m" (Decathlon Bench Press 80 kg, ref 8927167) | [MFR-WEB] https://support.decathlon.fr/banc-bench-press-80kg-notice-entretien-et-reparation |
| Bench with integrated uprights | Not stated (Decathlon Bench Press Fold, ref 8595564). The page gives "Peg dimensions … Width: 101 cm (39.8”)", while the "Space between pegs:" field is empty. A Malta listing for the same model code says 1.55 m to 2 m. | Peg wording: [MFR-WEB] https://www.decathlon.ca/en/p/8595564/bodybuilding-collapsible-bench-press-bench. Malta listing: [NOT VERIFIED] |
| Folding freestanding rack | "For use with 1.75 m and 2 m weight training and weight lifting bars" (Decathlon Rack 500, ref 8616805) | [NOT VERIFIED] (decathlon.ch, 403) |
| Independent stands | "go hand in hand with any length of Olympic Bar or Barbell" (Gymgear) | [PRIMARY] spec sheet https://gymgear.com/cdn/shop/files/Independent_Squat_Stands.pdf |

#### 1. Categories against the coach's six points

| Category (example evidence) | Loading | Unracking | Reracking | Stability | Independent support movement | Failure management |
|---|---|---|---|---|---|---|
| **Squat stands, connected base, spotter arms** (Rogue SML, 6ix Indy; RPM Power Ultra) | Bar on J-cups, inside the stated rating | J-cups set near shoulder or chest height | J-cups with a raised rear lip | Bases bolted to a crossmember. Bolting to the floor is advised "where required or whenever possible" (BoS guide) | Cannot drift apart: the crossmember fixes the spacing | Spotter arms "catch the barbell should you not be able to return it" (RPM). Outboard arms add tipping risk on unanchored stands |
| **Independent stands, separate bases** (Gymstick Press & Squat Stand; X-plode PFX-220; Gymgear) | Gymstick: "150kg (100kg on the Weight Support)". PFX-220: "400 lbs (recommended max: 225 lbs)" | As above | As above. No manual found specifies spacing or alignment | Gymstick asks only for "a level and dry surface". No tipping figure in any manual read | **The defining risk.** Nothing ties the two stands together, and ISO 20957-4 §5.3 requires a ground-connection device (§4) | PFX-220 and Gymgear have catches or spotter arms. Gymstick has none. BoS says spotter arms on stands that are not anchored carry "a high chance of tipping" [NOT VERIFIED] |
| **Bench with integrated uprights** (Decathlon Bench Press Fold; Bench Press 80 kg) | Fold: 100 kg on the bar rest. 80 kg model: 80 kg including bar and plates. Fold sticker: "Load one disc at a time… difference… must not exceed 20 kg" | Fixed stanchions: Fold 75–105 cm; 80 kg model 82 or 100 cm | The same pegs | Fold marked EN ISO 20957-1 and EN ISO 20957-4 (manual p.3) | The uprights are one frame and the bench hooks into it (Fold manual pp.8 and 13, my reading of the drawings) | **80 kg model:** the hooks "sont là pour empêcher la barre de basculer pendant que tu la charges ou la décharges. C'est ton filet de sécurité !" [MFR-WEB]. The page calls them a safety net for loading and unloading and does not define any failure catch. **Fold: unresolved** (see the notes after this table) |
| **Half rack or folding freestanding rack** (Decathlon Rack Fold 500) | 200 kg. Same 20 kg side-imbalance limit | Bar rests ("reposes barres") | Bar rests | Marked EN 20957-1 and EN 20957-4. "Pas de mouvement dynamique" | Single frame | Safety bar rests ("reposes barre de sécurité"). Manual: "Les dispositifs de sécurité doivent être employés à tout moment" |
| **Folding wall-mount rack** (Decathlon Rack mural pliable; MuscleSquad wall rack) | Decathlon: "Testé avec des charges pouvant aller jusqu'à 200kg" | Bar support "50mm, adaptable 28mm" | Same | Rigid only once fixed. MuscleSquad: "Expansion bolts must be installed into concrete walls or brick walls" | Fixed to the structure | Safety bar rests (MuscleSquad #17; Decathlon spare part "repose barre de sécurité") |
| **Safety straps** (Rogue, Titan, Sorinex) | Strap ratings run from 3,100 lb per strap (Titan T-3) to 10,000 lb (Rogue) [NOT VERIFIED] | Not applicable: an accessory | Not applicable | Inherits the rack's stability | Not applicable | Catches a failed bar. **Team judgement:** a strap spans a front and a rear upright, so it needs a four-post rack of matching depth. It cannot fit two-post stands or the TS 100 |
| **Plate-loaded lever press or Smith machine** (Powertec, Titan chest press) | Plates on arms or on a guided bar | Lever or guided bar, often with a start stop | A built-in hook or stop | One machine frame | Not applicable | "built-in safety stops… without the use of a spotter" (Powertec) [NOT VERIFIED]. On naming, see the note below |
| **Floor press** (no extra equipment) | The bar starts on the floor and is brought into position ("bridge the bar into place", Contreras) [SECONDARY] | None needed | None needed: the bar returns to the floor | The floor | Not applicable | The floor limits depth. A failed rep ends nearer the torso than on a bench. There is no primary source |
| **TS 100 pair as used on 24 Oct** (for comparison) | Real loads unknown, possibly the bare 7.75 kg bar (coach §5). The plate pool caps any load at 43.75 kg. Manufacturer 130 kg wording varies by source (§2 below); none mentions a barbell | **Unknown.** Team judgement: the setup implies lifting the bar off the units' top tubes, which have no lip or cradle | **Unknown.** Team judgement: the setup implies returning the bar onto the same tubes | No ground connection, and "S'il y a des irrégularités, les barres risquent de bouger" [MFR-WEB] | Two loose units. The manufacturer says nothing on spacing, joint use or lateral load | **None.** No catches, no straps, and the manufacturer documents no barbell use |

**Bench Press Fold, failure catch: unresolved.** Three Decathlon statements exist, and none settles whether the Fold has anything that catches a failed rep:

- **Product page:** "Safety hooks prevent the bar from tipping while removing weights." [MFR-WEB] https://www.decathlon.ca/en/p/8595564/bodybuilding-collapsible-bench-press-bench, in the feature block "A compact, well-designed bench". The team retrieved it by direct HTTP at 15:53 on 29 Oct and kept a copy. The same page lists a spare part, "Safety hooks (ref: 8644609)".
- **Same page's specification table:** "bar spotter: with bar spotter", with no description.
- **Manual sticker:** "ALWAYS USE THE SECURITY DEVICES" (p.3), which does not define the devices. [PRIMARY]

**Naming a Smith exercise.** The coach's rule (§3A) is: "Do not label a free-bar squat setup as a Smith squat." **Team judgement:** by the same logic, a Smith press is a guided-bar exercise that would be recorded separately from a free-bar bench press. That extension is mine; the coach did not state it.

Sources for the table, with any tag not repeated in the cells:

- RPM Power Adjustable Pro Squat Rack [PRIMARY] https://rpmpower.com/wp-content/uploads/2021/03/Adjustable_Pro_Squat_Rack_Manual.pdf
- RPM Power Ultra Squat Stand [PRIMARY] https://rpmpower.com/wp-content/uploads/2022/02/1263824_Ultra-Squat-Stand-Manual_0FINAL_compressed.pdf
- Rogue Monster Lite Squat Stand: two 48" base tubes bolted to a 43" crossmember, uprights bolted with triangle plates [PRIMARY] https://assets.roguefitness.com/instructions/IS0070/IS0070_CUST_INSTR_V1
- 6ix Indy Stand: base feet on a crossmember; "place the uprights 48" apart" [PRIMARY] https://cdn.shopify.com/s/files/1/0445/4262/3905/files/6ix_Indy_Stand.pdf
- Bells of Steel guide to safety, item 15 [PRIMARY] https://bellsofsteel.us/cdn/shop/files/BoS_BSS3RA_10_2v2.pdf
- Gymstick Press & Squat Stand [PRIMARY] https://hefitness.se/produktfiler/pressandsquatstand-manualeng.pdf
- X-plode PFX-220 [PRIMARY] https://cdn.shopify.com/s/files/1/0510/7869/3013/files/PFX-220-Ind-Squat-Rack_Manual.pdf
- Bench Press Fold:
  - manual [PRIMARY] https://drive.google.com/file/d/1HYAgJmv6jiAtde20AF52ETdYni6mj_oy/view, linked from https://support.decathlon.co.uk/bench-press-fold
  - product page [MFR-WEB] https://www.decathlon.ca/en/p/8595564/bodybuilding-collapsible-bench-press-bench
- Bench Press 80 kg: "Ils sont là pour empêcher la barre de basculer pendant que tu la charges ou la décharges. C'est ton filet de sécurité !" [MFR-WEB] https://support.decathlon.fr/banc-bench-press-80kg-notice-entretien-et-reparation. The safety-net sentence refers to loading and unloading; the page describes no catch for a failed rep.
- Rack Fold 500:
  - manual [PRIMARY] https://drive.google.com/file/d/1iyRpMDNbaPH6a4eVYmgTP7gh3kl6XG59/view
  - support page [MFR-WEB] https://support.decathlon.fr/rack-500-pliable
- Rack mural pliable, ref 8651534 [MFR-WEB] https://support.decathlon.fr/rack-mural-pliable. Its manual link returned HTML, not a PDF, so it was not read.
- MuscleSquad wall rack [PRIMARY] https://cdn.shopify.com/s/files/1/2602/1472/files/MuscleSquad-Wall-Mounted-Folding-Squat-Rack-Manual.pdf
- Bret Contreras, 2011, updated 2014 [SECONDARY] https://bretcontreras.com/how-to-floor-press-without-a-spotter-or-rack/

#### 2. Independent stands compared with connected uprights

What sources say:

- **Standard:** "Free-standing barbell supports shall have a device for connecting to the ground." ISO 20957-4:2016 §5.3, verified by visual examination (§6.1.2). [PRIMARY] See §4.
- **A manufacturer making two-piece stands** asks only for "a level and dry surface". Its manual gives no spacing, alignment, tipping or failure guidance and no safety catches. [PRIMARY] Gymstick manual.
- **A manufacturer making independent stands with catches** presents bench pressing on them as a use and puts the catches forward as the safety: "adjust the safety bar catches in case you need safety support". It also says "do not practice squats alone. Always have a spotter." [PRIMARY] PFX-220 sheet.
- **A manufacturer's general rule:** "The product should be anchored where required or whenever possible." [PRIMARY] Bells of Steel safety guide, item 15.
- **Manufacturer blogs and FAQs:**
  - "Look for a squat stand that's connected with a crossmember for extra stability."
  - "Keep your weights evenly distributed… This not only prevents tipping."
  - "bolt that sucker down"

  [SECONDARY] Bells of Steel, 14 Sep 2023, https://bellsofsteel.us/blogs/content/are-squat-stands-safe

  Same maker on spotter arms: "Unless the Squat Stands are heavily weighed down with sandbags or bolted to the floor, there is a high chance of tipping if the Spotter Arms are attached." [NOT VERIFIED] https://www.bellsofsteel.us/all-products/racks/rack-attachments/spotter-arms-attachment/
- **Capacity depends on configuration.** RPM's rack is rated 200 kg on its supports when retracted and 140 kg when extended, and the spotter bars carry the same two figures. [PRIMARY] RPM Pro manual.
- **Uneven loading:** both Decathlon rack products cap the difference between sides at 20 kg. [PRIMARY] Bench Press Fold sticker, Rack Fold sticker.
- **Decathlon on the TS 100:** "S'il y a des irrégularités, les barres risquent de bouger" and "caler les barres à l'aide de poids ou de sacs lestés". [MFR-WEB] From the companion file.
- **The TS 100's 130 kg figures, by source:**

| Source | Wording | Tag |
|---|---|---|
| Manual cover | "Max 130 kg", next to a person pictogram | [PRIMARY] |
| Support page | "Résistantes, supportent une charge de 130 kg par barre." and "Poids maximal utilisateur: 130 kg" | [MFR-WEB] https://support.decathlon.fr/barres-a-dips-ts-100-notice-reparation |
| decathlon.ca prose | "Can withstand a load of 130 kg (287 lb) per bar." and "Max. user weight: 130 kg (287 lb). For home use only." | [MFR-WEB] https://www.decathlon.ca/en/p/8882305/adjustable-dip-bars-ts-100 |
| decathlon.ca spec table | "Maximum Load 130 kg" and "Working Load (kg) 130 kg" | [MFR-WEB], same URL, retrieved by direct HTTP on 29 Oct |

Only the cover pictogram and the "user weight" lines say user weight explicitly. None of the four sources mentions a barbell or a lateral load. **Inference (team judgement):** the per-bar "charge" and the spec table's "Maximum Load" and "Working Load" also mean body weight, because the manual scopes the product to training "using your body weight" (companion file). The sources do not state this.

**Team judgement:**

- What is known about 24 Oct is narrow: normal repetitions, which felt stable and usable. The loads are unknown (see the header).
- Normal repetitions do not exercise the four events that carry the risk of this setup, whatever the load:
  - one end of the bar landing first on rerack;
  - the bar striking the front or back of a support on a missed rerack;
  - plates being tipped off one side;
  - a rep that fails.
- Each of these puts a horizontal or one-sided impulse into a T-foot base that is not fixed to the floor.
  - ISO 20957-4 §5.5 requires the rear part of a barbell support to withstand "a non-symmetric barbell impact" without breaking or tipping over.
  - §5.3 requires a ground-connection device on free-standing supports.
  - Nothing is known about how the TS 100 behaves under such an impact.
- None of the manufacturer's 130 kg figures gives any basis for judging a barbell's vertical or lateral load.
- Separate stands also make spacing and parallelism the user's job on every set, and no manual found states a tolerance for either.
- In favour of independent stands: they fit any bar length (§0).

#### 3. Does any manufacturer endorse parallel bars or dip stations as barbell supports?

**None found.**

- The TS 100 documents are silent on barbells, racking and lateral load, and say it is for "body weight" use. [PRIMARY] Companion file.
- Where makers sell a dip station alongside squat stands, the snippets point the other way:
  - Blackout: "We do not recommend using a dip station with the squat stand as it is not bolted to the floor and therefore may not be stable enough." [NOT VERIFIED; the page needs a login] https://help.blkboxfitness.com/support/solutions/articles/44002251414
  - Nike: "*Not recommended for use with Nike Squat Stand." [NOT VERIFIED] https://treadmillfactory.ca/products/nike-dip-station
  - Again Faster: 75 kg maximum for its dip station on Squat Stand 3.0/4.0. [NOT VERIFIED] https://againfaster.eu/it/again-faster-squat-rack-dip-station.html
  - Note that these concern dip handles *mounted on* stands, not a barbell resting on dip bars.
- **The purpose-built reverse does exist.** RPM Power's Adjustable Pro Squat Rack ships "Dip Station Rack (2PCS)" together with barbell supports and spotter bars, on a frame joined by a "Connecting Tube". Its manual teaches both dips and bench press on it. [PRIMARY] RPM Pro manual.
  - A UK listing titled "RIP X Adjustable Squat and Bench Press Rack Stand with Spotters and Dip Bars" suggests the same idea, but only the title was seen. [NOT VERIFIED] https://www.ypc.co.uk/product/rip-x-adjustable-squat-and-bench-press-rack-stand-with-spotters-and-dip-bars/
  - **Team judgement:** dip handles and barbell supports can share one frame when the maker designs, connects and rates that frame for both uses. That is the opposite of putting a barbell on a dip station.
- Searches run: dip station used as barbell rack or warning; dip stand plus squat stand combo manuals; "2 in 1" dip/squat stands; the TS 100 searches in the companion file.

#### 4. Standards: ISO 20957-4:2016, the clause text that is publicly readable

The iTeh sample covers up to §6.2. [PRIMARY] https://cdn.standards.iteh.ai/samples/66870/eea8faf5d4164c5d8e4388a2444f72e0/ISO-20957-4-2016.pdf

- **Scope:** "stationary strength training benches and free-standing barbell racks", classes S, H and I. The European version supersedes EN 957-4:2006+A1:2010.
- **§5.1:** "Depending on the design of the training equipment, the following requirements shall apply as appropriate."
- **§5.2 "Benches with fixed barbell supports":** its three subclauses apply only to benches whose barbell supports are fixed to the bench.
  - **§5.2.1 "Stability of the barbell":** "Overturning of the barbell by an unequal load shall be prevented either by the distance between the supports or safety device." It concerns the bar itself overturning, not the base tipping, and is tested per §6.2.
  - **§5.2.2 and §5.2.3:** such benches must be stable laterally, "when loaded with unequal load", and longitudinally.
- **§5.3:** "**Free-standing barbell supports shall have a device for connecting to the ground.**"
- **§5.4, yoke geometry:** measured with a 30 mm bar, the front of the support must stand "20 mm to 40 mm" above the lowest point of the resting bar. The rear part must be "≥80 mm higher than the top of the front".
- **§5.5:** "The rear part of the barbell support shall absorb the loads without breakage, shall not tip over and shall still function as intended by the manufacturer, when subjected to a non-symmetric barbell impact."
- **§5.6:** loading follows ISO 20957-1.
- **§5.7:** supports must be "easily accessible to the user while accepting or replacing the barbell."
- **§6.2 test, for §5.2.1 (bench clause):** a steel bar "(1 600 ± 50) mm long" with a diameter of "(27,5 ± 1) mm" is placed centrally. One disc of "10 kg for class H" or "20 kg for class S" goes on one side. That test bar is the same class as the athlete's 1.55 m, 28 mm bar.
- **Not read:** §6.3 to §6.5 and their pass criteria, which are beyond the sample. The ToC has no clause on safety catches or spotter arms, so as far as the ToC shows, the standard governs support geometry and stability, not failure protection.
- **Team judgement.** The clauses that apply to a free-standing barbell support are §5.3, §5.4, §5.5 and §5.7. Against them, the TS 100 used as a barbell support has:
  - no ground-connection device (§5.3);
  - no yoke: the round tube top has no front lip or rear upstand (§5.4);
  - no tested resistance to a non-symmetric barbell impact (§5.5).

  §5.2 is not applied here: the athlete's adjustable bench has no fixed barbell supports, and the TS 100 is not a bench.

  This says nothing about the TS 100 as a dip station. It means the TS 100 would not meet the free-standing barbell-support clauses if it were judged against them.

#### 5. Failure management with no purchase, for a lone lifter at under 44 kg total

The primary rule is unchanged. NSCA Standard 3.2 asks for spotting together with "appropriate safety equipment (e.g., power racks)" for lifts with the weight on the trunk or over the face. For bar-on-back lifts the NSCA Basics manual recommends "a power rack with the safety crossbars in place". [PRIMARY] Companion file, §2a.

None of the options below supplies safety equipment. They change how a failed rep ends.

- **Floor press.** No rack and no rerack: the bar starts and ends on the floor, and the floor limits depth. The only source found for the setup is "just bridge the bar into place", and that source does not address failure. [SECONDARY] Contreras. No primary source was found.
- **Dumbbell bench press instead of the barbell.** "Consider swapping barbell bench press for dumbbell press when training alone." [SECONDARY] Rep Fitness, 2026, https://repfitness.com/blogs/training/how-to-fail-heavy-lifts
  - **Team judgement:** dumbbells have no supports to unrack or rerack, and a failed rep can be ended by lowering them to the sides.
  - Dumbbell bench press is already the athlete's Session B exercise on owned equipment, at 20 kg per hand maximum (`program.ts` constants). This is not a prescription.
- **Collars.** The two sources point in opposite directions:
  - **Without collars**, so plates can be tipped off. "When benching heavy alone without a rack— not recommended, by the way — leave the collars off." Tipping one side means "The empty side will whip up violently". [SECONDARY] Rep Fitness. Art of Manliness puts it as an absolute rule. [SECONDARY] Companion file.
  - **With collars.** Decathlon's Rack Fold manual says: "To avoid any accident, please use weight retention devices on the barbell." That is a manufacturer instruction for a rack *with* safety bars. [PRIMARY] Rack Fold manual p.19. The same manual's English usage page is copied from the Bench Press Fold ("The BENCH PRESS FOLD is a bench…"), a defect in the document.
  - **Team judgement:** the two pieces of advice address different failures: plates sliding off during normal reps, against being pinned with no catch.
  - On the TS 100 specifically, tipping plates off one side creates the largest asymmetric impulse available, on supports that are not anchored. The athlete's pool gives at most about 18 kg per side.
- **Roll of shame.** "Lower the bar to your chest… roll it down your torso to your hip crease." The source adds that it "works for moderate weights but is risky near your max". [SECONDARY] Rep Fitness.
- **Pin or safety heights.** These apply only to equipment that has catches:
  - Squat: "set the spotter bars to a height that is just below your shoulder level when you are in your lowest squat position." [PRIMARY] RPM Ultra manual.
  - Bench: "adjust the safety bar catches in case you need safety support", with no height given. [PRIMARY] PFX-220.
  - No primary bench-height rule was found. A snippet says Smith machine stops are set "just beneath the bar's lowest travel point". [SECONDARY, NOT VERIFIED]
- **Practising bails.** "practice your bail techniques with lighter weight before you need them for real." [SECONDARY] Rep Fitness.

#### 6. Rack-assisted squat variations (coach §3A)

These are purpose-built categories that support a free-bar squat with failure protection: squat stands or a half rack with spotter arms or safety bars, a power rack with pins or straps, and a folding wall rack with safety bars (table above).

- **The coach's naming rule:** "The TS 100 is not a guided Smith machine. Do not label a free-bar squat setup as a Smith squat." (§3A). **Team judgement:** a squat on a Smith machine is a guided-bar exercise and would be its own entry.
- **Unracking a back squat needs bar supports near shoulder height.** RPM: the "rack level… holds the barbell just below shoulder height", and lifting off from an upright position on tiptoe "can be dangerous". [PRIMARY] RPM Ultra and Pro manuals.
- **The TS 100's published heights top out at 93 cm** (sources give 72/79/86/93, 79/86/93 or 77/84/91). [MFR-WEB, conflicting] Companion file.
- **Team judgement:**
  - At 93 cm, the TS 100 cannot hold a bar at back-squat or front-squat unrack height for an adult.
  - The only squat geometry it could reach is a start from the bottom, with the bar on the supports at hip level: a pin-squat or Anderson-type start.
  - That start ends every rep by lowering the bar back onto the supports, often unevenly. That is a non-symmetric impact on unanchored units (ISO §5.5), with no catch if the bar misses.
  - The concept is physically possible. It is not manufacturer-supported, has no verified stability, and would need purpose-built equipment to be done with failure protection.
  - Rack-free squat patterns on equipment the athlete already owns (goblet, dumbbell or bodyweight) need no supports at all.
- No source was found that addresses squatting with a barbell supported on parallel bars or dip stations.

#### 7. Verified and not verified

| Claim | Status |
|---|---|
| ISO 20957-4 §5.1, §5.2.1 (bench clause: the bar overturning), §5.3 (ground-connection device), §5.4, §5.5, §5.7, and the §6.2 test bar and one-sided 10 kg disc | PRIMARY, from the standard's sample text |
| ISO 20957-4 §6.3–§6.5 pass criteria; ISO 20957-1 loading values | NOT READ (paywalled) |
| Decathlon Bench Press Fold: EN ISO 20957-1/-4 marking, 100 + 100 kg, 20 kg side-imbalance limit, "ALWAYS USE THE SECURITY DEVICES" | PRIMARY (manual p.1, p.3) |
| Bench Press 80 kg: its hooks hold the bar while loading and unloading ("C'est ton filet de sécurité !"); no failure catch defined | MFR-WEB |
| Bench Press Fold: whether anything catches a failed rep | **UNRESOLVED.** The product page says the hooks are for plate changes [MFR-WEB, retrieved by direct HTTP]. The spec table says "with bar spotter", undefined. The manual sticker does not define "security devices" |
| Rack Fold 500: 200 kg, 20 kg side-imbalance limit, safety bar rests, "use weight retention devices", EN 20957-1/-4, "Pas de mouvement dynamique" | PRIMARY (manual) and MFR-WEB |
| Rack 500 takes only 1.75 m and 2 m bars | NOT VERIFIED |
| Athlete's bar is the Corength 1.55 m (1 m inner length) | Specs MFR-WEB. The identity is NOT VERIFIED: matched on weight only; the owner should check the label |
| 24 Oct: whether plates were on the bar, the loads, symmetry, unrack and rerack, where the bar rested | **Unknown.** Known: the TS 100 units were used as supports, and it "felt stable and usable during normal repetitions"; the real loads are to be supplied (§5) |
| TS 100 130 kg wording: cover pictogram, "charge de 130 kg par barre", "Poids maximal utilisateur", "Max. user weight", "Maximum Load", "Working Load (kg)" | PRIMARY (cover) and MFR-WEB. Reading every figure as body weight is an inference |
| Independent-stand manuals (Gymstick, PFX-220, Gymgear): ratings, catches, no spacing or tipping guidance | PRIMARY |
| Connected stands are bolted to a crossmember (Rogue SML, 6ix) | PRIMARY |
| "Anchor where required or whenever possible" (Bells of Steel) | PRIMARY |
| Spotter arms tip stands that are not anchored (Bells of Steel FAQ); dip station not recommended with squat stands (Blackout, Nike) | NOT VERIFIED (snippets) |
| A manufacturer endorsing dip stations or parallel bars as barbell supports | NOT FOUND |
| A purpose-built rack with dip handles on a connected frame (RPM Pro) | PRIMARY |
| Plate-loaded lever-press safety stops (Powertec, Titan); strap ratings | NOT VERIFIED (snippets) |
| Floor press, collars off, roll of shame, dumbbell bench press as the alone option | SECONDARY only. No primary source found |
| Team judgement items | The four failure events on the TS 100; how the TS 100 setup implies unracking and reracking; its fit against §5.3, §5.4 and §5.5; that it cannot reach squat unrack height; the Smith-press naming extension |
