import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { routineOverview, routinePlaylist, type Routine, type RoutinePlay } from '@/domain/routine'
import { routineById } from '@/data/seed/routines'
import { PRODUCT_NAME } from '@/lib/brand'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { useWakeLock } from '@/lib/useWakeLock'
import { routineStepAsset } from '@/lib/routineAsset'
import { useRoutineName, useRoutineStepCue, useRoutineStepName } from '@/i18n/seedRoutine'
import { TimerRing } from '@/ui/TimerRing'

/**
 * A guided recovery routine, played one stretch at a time.
 *
 * A full-screen takeover route rather than a Sheet: a ten-minute sequence
 * held over Today would keep Today's DOM alive behind an aria-modal, and
 * Escape-to-dismiss is the wrong gesture for something you are in the middle
 * of. Precedent is Workout Mode.
 *
 * **Nothing here writes.** No repository import, no Dexie import, nowhere in
 * this subtree — enforced by routineNoTracking.guard.test.ts rather than by
 * discipline. The owner's ruling is that the routine guides and ends:
 * nothing counted, no streak, no gap.
 */

/**
 * Coach ruling A (docs/programs/recovery-stretch-v1-coach-spec.md): eight
 * seconds, fixed, before every stretch. Transition time is physical, so it
 * is the coach's call, not this repo's.
 *
 * One global constant rather than per-step authoring. Should a step ever
 * need its own, the type can gain an override with no migration, since
 * nothing about a routine is stored.
 *
 * Note this is per *play*, not per authored step: routinePlaylist expands a
 * per-side step into two plays, so a left/right stretch gets two lead-ins.
 * That is deliberate — changing sides needs the repositioning time as much
 * as arriving at the stretch did — and it is why the routine runs 9:07
 * rather than the spec's 8:20 arithmetic, which counts one lead-in per
 * stretch.
 */
const LEAD_IN_SECONDS = 8

export function RoutinePlayer() {
  const { t } = useTranslation('recovery')
  const { t: tCommon, i18n } = useTranslation('common')
  const { routineId } = useParams()
  const reducedMotion = useReducedMotion()

  const routine = routineId ? routineById(routineId) : undefined
  const plays = useMemo(() => (routine ? routinePlaylist(routine) : []), [routine])

  const [started, setStarted] = useState(false)
  const [playIndex, setPlayIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)

  // "Is a routine playing" — not "is the timer running". Pause keeps the
  // lock, because a screen going dark while you adjust position is the
  // defect this exists to prevent. The end screen drops it.
  //
  // `started` is part of the condition rather than an omission: the ready
  // screen is a decision, not a stretch, so someone who opens it and puts the
  // phone down should not be holding the display awake indefinitely.
  useWakeLock(started && plays.length > 0 && !finished)

  // A takeover route outside AppShell has no route-title handling of its own.
  useEffect(() => {
    document.title = tCommon('routeTitle.workout', { productName: PRODUCT_NAME })
  }, [i18n.language, tCommon])

  const advance = useCallback(() => {
    setPlayIndex((current) => {
      if (current + 1 >= plays.length) {
        setFinished(true)
        return current
      }
      return current + 1
    })
  }, [plays.length])

  if (plays.length === 0 || !routine) {
    return (
      <Fallback body={t('notFound.body')} backLabel={t('notFound.backToToday')} />
    )
  }

  if (finished) {
    // No count, no duration, no stats — see EndScreen.
    return <EndScreen />
  }

  if (!started) {
    return <ReadyScreen routine={routine} onStart={() => setStarted(true)} />
  }

  const play = plays[playIndex]

  return (
    <Takeover>
      <header className="flex items-center gap-4">
        <LeaveLink />
        <p className="flex-1 text-sm text-ink-tertiary" data-numeric>
          {t('position', { index: play.index, total: play.total })}
        </p>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {/*
          Keyed on the play, so every advance remounts the subtree: fresh
          timer state, and — the part that matters for accessibility — a
          fresh useFocusOnMount, which moves focus to the new heading and is
          what announces the change. Simplifying this key would leave a
          screen-reader user reading a screen that changed underneath them.
        */}
        <motion.div
          key={`play-${play.index}`}
          className="flex flex-1 flex-col"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlayView
            play={play}
            nextPlay={plays[playIndex + 1]}
            paused={paused}
            onTogglePause={() => setPaused((value) => !value)}
            onAdvance={advance}
            onBack={playIndex > 0 ? () => setPlayIndex(playIndex - 1) : undefined}
          />
        </motion.div>
      </AnimatePresence>
    </Takeover>
  )
}

/** The full-screen frame both the ready screen and a play sit in. */
function Takeover({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      {children}
    </div>
  )
}

/**
 * Leaving, identical from the ready screen and from mid-routine.
 *
 * Shared rather than duplicated so the two cannot drift: the ready screen is
 * the one place a user is most likely to change their mind, and an ✕ that
 * behaved differently there would be the worst possible place for it.
 */
function LeaveLink() {
  const { t } = useTranslation('recovery')
  return (
    <Link
      to="/"
      aria-label={t('leaveAriaLabel')}
      className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
    >
      ✕
    </Link>
  )
}

/**
 * What the routine is, before it starts running.
 *
 * The defect this fixes: tapping a stretch on Today dropped you straight into
 * a running lead-in, so the eight seconds were burning while the phone was
 * still in your hand. Opening a screen is not the same act as committing to
 * start.
 *
 * **This does not replace the lead-in, and must not shorten it.** They answer
 * different questions — the gate is "am I doing this", the lead-in is "am I in
 * position" (coach ruling A, physical transition time). Starting from here
 * hands play one a full `LEAD_IN_SECONDS`, however long you spent deciding.
 *
 * The numbers are a **preview**, derived from the playlist rather than written
 * down: a hardcoded "9 min" would be wrong the first time the coach edits a
 * hold. They are also the one place in this player where digits are welcome —
 * see EndScreen for why the end of a routine is the opposite case.
 */
function ReadyScreen({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  const { t } = useTranslation('recovery')
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const routineName = useRoutineName(routine.id)
  const firstStepName = useRoutineStepName(routine.steps[0]?.id ?? '')
  const overview = routineOverview(routine, LEAD_IN_SECONDS)

  return (
    <Takeover>
      <header className="flex items-center gap-4">
        <LeaveLink />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 ref={headingRef} tabIndex={-1} className="text-display text-3xl text-ink">
          {routineName}
        </h1>
        <p className="mt-3 text-sm text-ink-tertiary" data-numeric>
          {t('ready.summary', {
            count: overview.stretches,
            // Minutes, not seconds: the exact 9:07 is precision the user has
            // no use for standing on a mat. Rounding is a display choice, so
            // it lives here rather than in the domain.
            minutes: Math.round(overview.seconds / 60),
          })}
        </p>
        <p className="mt-8 leading-relaxed text-ink-secondary">
          {t('ready.firstUp', { stepName: firstStepName })}
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98]"
        >
          {t('ready.start')}
        </button>
      </div>
    </Takeover>
  )
}

function PlayView({
  play,
  nextPlay,
  paused,
  onTogglePause,
  onAdvance,
  onBack,
}: {
  play: RoutinePlay
  nextPlay: RoutinePlay | undefined
  paused: boolean
  onTogglePause: () => void
  onAdvance: () => void
  /** Absent on the first play — Back clamps rather than wrapping. */
  onBack?: () => void
}) {
  const { t } = useTranslation('recovery')
  const [phase, setPhase] = useState<'leadIn' | 'hold'>('leadIn')
  const [remaining, setRemaining] = useState(LEAD_IN_SECONDS)
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const advanced = useRef(false)

  const stepName = useRoutineStepName(play.stepId)
  const cue = useRoutineStepCue(play.stepId)
  const nextStepName = useRoutineStepName(nextPlay?.stepId ?? '')
  const cueId = `routine-cue-${play.index}`

  useEffect(() => {
    if (paused) return
    // Clamped at zero rather than counting into negatives: this component is
    // not unmounted the instant it finishes — AnimatePresence keeps it alive
    // through its exit animation — so an unclamped counter would keep
    // changing and keep re-running the effect below.
    const tick = setInterval(() => setRemaining((value) => (value <= 0 ? 0 : value - 1)), 1000)
    return () => clearInterval(tick)
  }, [paused, phase])

  useEffect(() => {
    if (remaining > 0) return
    if (phase === 'leadIn') {
      // The hold does not start until the lead-in ends — you cannot be in a
      // stretch the instant the screen changes, and this is also when the
      // announcement lands, so reading time is not taken out of the hold.
      setPhase('hold')
      setRemaining(play.holdSeconds)
      return
    }
    // At most one advance per play, ever. The outgoing subtree lives on
    // during its exit animation with its timer still running, so without
    // this guard a finished play advances again on the next tick and the
    // routine skips a stretch — caught by the auto-advance test, and
    // invisible at any speed a person would notice while reading the code.
    if (advanced.current) return
    advanced.current = true
    onAdvance()
  }, [remaining, phase, play.holdSeconds, onAdvance])

  const heading =
    play.side === null
      ? stepName
      : t('stepWithSide', { stepName, side: t(`side.${play.side}`) })
  const pose = phase === 'leadIn' ? 'entry' : 'held'
  const art = routineStepAsset(play.stepId, pose)

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h1
        ref={headingRef}
        tabIndex={-1}
        aria-describedby={cue ? cueId : undefined}
        className="text-display text-3xl text-ink"
      >
        {heading}
      </h1>
      {cue && (
        <p id={cueId} className="mt-2 max-w-[32ch] text-sm leading-relaxed text-ink-secondary">
          {cue}
        </p>
      )}

      {art && (
        <img
          src={art.url}
          width={art.width}
          height={art.height}
          alt=""
          className="mt-4 max-h-52 w-auto"
        />
      )}

      <p className="mt-2 text-sm text-ink-tertiary">
        {phase === 'leadIn' ? t('leadIn') : ' '}
      </p>

      <TimerRing remaining={Math.max(0, remaining)} total={phase === 'leadIn' ? LEAD_IN_SECONDS : play.holdSeconds} />

      <div className="mt-4 flex gap-3">
        <PlayerButton label={t('back')} onClick={onBack} />
        <PlayerButton label={t('pause')} onClick={onTogglePause} pressed={paused} />
        <PlayerButton label={t('next')} onClick={onAdvance} />
      </div>

      <p className="mt-10 text-sm text-ink-tertiary">
        {nextPlay ? t('nextUp', { stepName: nextStepName }) : t('nextUpLast')}
      </p>
    </div>
  )
}

function PlayerButton({
  label,
  onClick,
  pressed,
}: {
  label: string
  onClick?: () => void
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={onClick === undefined}
      // A stable accessible name with a flipping aria-pressed, never a label
      // swap: backlog A4's whole complaint was that a control which arms by
      // relabelling itself in place announces nothing, and re-introducing
      // that here for pause would be the same defect in a new costume.
      aria-pressed={pressed}
      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink disabled:opacity-40"
    >
      {label}
    </button>
  )
}

/**
 * The end of a routine shows **no count, no duration, no statistics**.
 *
 * This is the single most likely place for the no-tracking ruling to erode,
 * and no guard can catch it: an end screen rendering "12 stretches, 9
 * minutes" writes nothing and imports nothing, so both no-tracking guards
 * pass while it is exactly the tracking affordance the owner ruled out. The
 * only defence is review, plus the deliberately blunt test asserting no
 * digit appears in this subtree.
 *
 * **The ban is this screen's, not the player's**, and the distinction is the
 * timing rather than the digits. ReadyScreen shows a count and a duration
 * because they inform a decision you have not made yet. The same two numbers
 * *after* the routine would be a report on what you did, which is the thing
 * the no-tracking ruling forbids. The test is scoped to this subtree for that
 * reason — narrowing it further, or softening it, gives up the only
 * mechanical defence there is.
 */
function EndScreen() {
  const { t } = useTranslation('recovery')
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 ref={headingRef} tabIndex={-1} className="text-display text-4xl text-ink">
        {t('end.heading')}
      </h1>
      <p className="mt-3 max-w-[32ch] leading-relaxed text-ink-secondary">{t('end.body')}</p>
      <Link to="/" className="mt-8 font-medium text-amber">
        {t('end.backToToday')}
      </Link>
    </div>
  )
}

function Fallback({ body, backLabel }: { body: string; backLabel: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center px-5">
      <p className="text-ink-secondary">{body}</p>
      <Link to="/" className="mt-4 font-medium text-amber">
        {backLabel}
      </Link>
    </div>
  )
}
