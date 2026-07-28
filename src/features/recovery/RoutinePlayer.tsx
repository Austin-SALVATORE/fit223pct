import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { routinePlaylist, type RoutinePlay } from '@/domain/routine'
import { routineById } from '@/data/seed/routines'
import { PRODUCT_NAME } from '@/lib/brand'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { useWakeLock } from '@/lib/useWakeLock'
import { routineStepAsset } from '@/lib/routineAsset'
import { useRoutineStepCue, useRoutineStepName } from '@/i18n/seedRoutine'
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

  const [playIndex, setPlayIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)

  // "Is a routine playing" — not "is the timer running". Pause keeps the
  // lock, because a screen going dark while you adjust position is the
  // defect this exists to prevent. The end screen drops it.
  useWakeLock(plays.length > 0 && !finished)

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

  if (plays.length === 0) {
    return (
      <Fallback body={t('notFound.body')} backLabel={t('notFound.backToToday')} />
    )
  }

  if (finished) {
    // No count, no duration, no stats — see EndScreen.
    return <EndScreen />
  }

  const play = plays[playIndex]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-4">
        <Link
          to="/"
          aria-label={t('leaveAriaLabel')}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
        >
          ✕
        </Link>
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
    </div>
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
