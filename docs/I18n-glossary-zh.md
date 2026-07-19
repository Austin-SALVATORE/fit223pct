# Simplified Chinese glossary — draft, pending Austin's review

**Status: draft, gates Milestone 7 Phase 9.** Same gate as the French
glossary: nothing in `src/locales/zh-CN/` is translated in bulk until
these ~15 core terms are confirmed, since a bad call here propagates into
every nested driver phrase.

Register target: a personal coach speaking directly to one person —
plain spoken Chinese, the register used in real fitness communities
(Bilibili/小红书 lifting content), not a written report or a clinical
recommendation.

## Readiness (the core concept)

Same boundary as French: the English word deliberately avoids "recovery"
— this is "how ready you are to train today," not a physiological claim.

| Candidate | Verdict | Reasoning |
|---|---|---|
| **状态** (zhuàngtài, "condition/state") | **Proposed** | The natural, colloquial term Chinese lifters already use ("今天状态怎么样" = "how's your condition today") — non-medical, works standalone or in compounds ("今日状态" for the check-in) |
| 恢复 (huīfù, "recovery") | Rejected | Directly medicalized — used for post-injury or post-surgical recovery (术后恢复); exactly the term the product forbids |
| 竞技状态 (jìngjì zhuàngtài, "competitive form") | Rejected | Real term in professional/competitive sports, but too elite/competition-register for a personal coaching app |

## The three tiers

| Key | English | Proposed Chinese | Rejected candidates |
|---|---|---|---|
| ready | "Ready to train." | **"今天状态好，可以练。"** | *准备好训练了* — reads like a system/checklist message ("preparation complete"), not a coach's voice |
| steady | "Good to go." | **"状态平稳，照常训练。"** | *状态尚可* — formal/literary register, reads like a written report |
| easier | "Taking it a touch easier today — …" | **"今天练轻松一点——…"** | *今天恢复不佳，建议减量* — uses 恢复 (recovery/medical) and reads as a clinical recommendation, exactly the register the product forbids |

## The five signals

| Signal | Proposed Chinese | Rejected candidates |
|---|---|---|
| sleep | **睡眠不足** ("insufficient sleep") | — (clear natural choice; 睡不好 "slept poorly" is a softer alternate if a more casual tone is wanted) |
| soreness | **肌肉酸痛** ("muscle soreness") | *肌肉损伤* ("muscle damage/injury") — implies actual injury, wrong meaning entirely |
| energy | **精力不足** ("energy insufficient") | *疲劳* ("fatigue") alone — drifts toward chronic-fatigue medical register |
| stress | **压力较大** ("stress relatively high") | *有压力* ("has stress") — too flat/vague, loses the "a difficult stretch" framing |
| motivation | **动力不足** ("motivation insufficient") | *没有动力* ("no motivation at all") — too absolute; the English says "low," not "none" |

## RIR (Reps In Reserve)

| Element | Proposed Chinese | Reasoning |
|---|---|---|
| Abbreviation itself | **Keep "RIR"** | Chinese lifting communities also use the international acronym directly (same as kg, 1RM) — this is community usage, not a stylistic choice |
| "Reps left in the tank" (descriptive label) | **保留次数** ("reserved reps") | Plain, descriptive, doesn't compete with the abbreviation |

**Rejected:** fully localizing "RIR" into a Chinese-only term (e.g. 储备次数)
as the primary display form — not wrong, but doesn't match how the term
actually appears in Chinese-language fitness content, where "RIR" itself
is what's used.

## "Adjusted for readiness" (badge)

| Proposed Chinese | Rejected candidates |
|---|---|
| **根据状态调整** | *根据恢复情况调整* — reintroduces 恢复 (recovery), forbidden |

## "Projected" (Plan badge — a forward forecast, not a fixed commitment)

| Proposed Chinese | Rejected candidates |
|---|---|
| **预计** ("estimated/projected" — the same word used in weather forecasts) | *计划* ("planned") — implies a fixed commitment, contradicts the app's own distinction between projected and scheduled days |

## "Consolidate" (progression state — hold this load before advancing)

| Proposed Chinese | Rejected candidates |
|---|---|
| **巩固** ("consolidate/solidify," as in 巩固基础 "solidify the foundation") | *维持* ("maintain") — reads as a plateau/holding pattern, losing the "actively building toward the next jump" framing the English copy carries |

## Nav terms

| Term | Proposed Chinese | Reasoning |
|---|---|---|
| Today | **今天** | Direct, standard — no alternatives worth considering |
| Plan | **计划** | The natural word for the page's content (训练计划 = "training plan/schedule"). Worth flagging: this is the same word rejected above for the "Projected" badge — not a contradiction, different job. There, 计划 wrongly implied a fixed commitment for a value that's explicitly a shifting forecast; here, it correctly names a page that *is* an actual plan/schedule. |
| Progress | **进度** ("progress/pace") | Neutral — about tracking where you are, not claiming an outcome. *进步* ("improvement/advancement") was considered and rejected: it reads as an achievement claim ("you're getting better"), which risks the same territory as promising a transformation outcome. |
| Library | **动作库** ("movement library") | The standard term in Chinese fitness apps. *图书馆* (literal "library," as in a book library) was considered and rejected — wrong register entirely, reads as an actual building. |

## Activity kinds

Note for review: "恢复" reappears here as an **activity type** (a
scheduled recovery day — 恢复日 is completely standard fitness
vocabulary), distinct from the readiness-score usage rejected above. Not
an inconsistency: a recovery *day* is a real category, a recovery
*score* would be a medical claim.

| Kind | Proposed Chinese | Rejected candidates |
|---|---|---|
| recovery | **恢复** | — (correct use, see note above) |
| mobility | **灵活性** ("flexibility/mobility") | *拉伸* ("stretching") — too narrow; mobility work covers more than static stretching |
| cardio | **有氧** (short for 有氧运动, "aerobic exercise") | — (the standard fitness-community term) |
| optional | **可选** | — (plain, neutral) |
| checkpoint | **小结** ("stage summary") | *检查点* ("checkpoint," literal) — reads like a software/game checkpoint, wrong register for a training milestone |
