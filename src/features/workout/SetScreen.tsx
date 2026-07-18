import { useState } from 'react'
import { Stepper } from '@/ui/Stepper'
import { suggestProgression } from '@/domain/progression'
import type { Exercise, LoggedSet, WorkoutExercise } from '@/domain/types'
import { SwapSheet } from './SwapSheet'

interface SetScreenProps {
  workoutExercise: WorkoutExercise
  exercise: Exercise
  setIndex: number
  previousSets: readonly LoggedSet[]
  exerciseById: Map<string, Exercise>
  onLog: (set: Omit<LoggedSet, 'setIndex'>) => void
  onSwap: (exerciseId: string) => void
}

export function SetScreen({
  workoutExercise,
  exercise,
  setIndex,
  previousSets,
  exerciseById,
  onLog,
  onSwap,
}: SetScreenProps) {
  const { prescription } = workoutExercise
  const suggestion = suggestProgression(prescription, previousSets)

  // Within a session, people keep the weight they just used.
  const lastSetThisSession = workoutExercise.sets.at(-1)
  const defaultWeight =
    lastSetThisSession?.weightKg ?? suggestion.weightKg ?? prescription.startWeightKg

  const [weightKg, setWeightKg] = useState(defaultWeight)
  const [effort, setEffort] = useState(
    lastSetThisSession
      ? effortValue(lastSetThisSession, prescription.mode)
      : suggestion.targetReps,
  )
  const [rir, setRir] = useState(prescription.targetRir)
  const [swapOpen, setSwapOpen] = useState(false)

  const isSeconds = prescription.mode === 'seconds'

  function handleLog() {
    onLog({
      weightKg,
      reps: isSeconds ? null : effort,
      seconds: isSeconds ? effort : null,
      rir,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-8">
        <p className="eyebrow">
          Set {setIndex + 1} of {prescription.sets}
          {prescription.perSide && ' · each side'}
        </p>
        <h1 className="text-display mt-2 text-4xl text-ink">{exercise.name}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          <LastTime sets={previousSets} mode={prescription.mode} />
        </p>
        {suggestion.type !== 'start' && (
          <p className="mt-1 text-sm leading-relaxed text-amber">{suggestion.reason}</p>
        )}
        {prescription.note && (
          <p className="mt-1 text-sm text-ink-tertiary">{prescription.note}</p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-start justify-center gap-8">
          {weightKg !== null && (
            <Stepper
              label="Weight"
              value={weightKg}
              step={prescription.weightStepKg ?? 1}
              min={0}
              max={prescription.maxWeightKg ?? undefined}
              unit="kg"
              onChange={setWeightKg}
            />
          )}
          <Stepper
            label={isSeconds ? 'Hold' : 'Reps'}
            value={effort}
            step={isSeconds ? 5 : 1}
            min={isSeconds ? 5 : 1}
            unit={isSeconds ? 's' : undefined}
            onChange={setEffort}
          />
        </div>

        <RirPicker value={rir} onChange={setRir} />

        <button
          type="button"
          onClick={handleLog}
          className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98]"
        >
          {isSeconds ? 'Log hold' : 'Log set'}
        </button>

        <button
          type="button"
          onClick={() => setSwapOpen(true)}
          className="mt-4 w-full text-center text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          Swap exercise
        </button>
      </div>

      <SwapSheet
        open={swapOpen}
        exercise={exercise}
        exerciseById={exerciseById}
        onSelect={(id) => {
          setSwapOpen(false)
          onSwap(id)
        }}
        onClose={() => setSwapOpen(false)}
      />
    </div>
  )
}

function LastTime({
  sets,
  mode,
}: {
  sets: readonly LoggedSet[]
  mode: 'reps' | 'seconds'
}) {
  if (sets.length === 0) return <>First time — the numbers below are your starting point.</>
  const parts = sets
    .map((set) => {
      const effort = effortValue(set, mode)
      const suffix = mode === 'seconds' ? 's' : ''
      return set.weightKg !== null ? `${effort}×${set.weightKg} kg` : `${effort}${suffix}`
    })
    .join(' · ')
  return (
    <>
      Last time <span data-numeric>{parts}</span>
    </>
  )
}

function RirPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <fieldset className="mt-8">
      <legend className="eyebrow mx-auto text-center">Reps left in the tank</legend>
      <div className="mt-2 flex justify-center gap-1.5" role="radiogroup">
        {[0, 1, 2, 3, 4].map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            data-numeric
            onClick={() => onChange(option)}
            className={`h-11 w-11 rounded-full border text-sm font-medium transition-colors ${
              value === option
                ? 'border-amber bg-amber/15 text-amber'
                : 'border-border text-ink-secondary hover:border-border-strong'
            }`}
          >
            {option === 4 ? '4+' : option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function effortValue(set: LoggedSet, mode: 'reps' | 'seconds'): number {
  return (mode === 'seconds' ? set.seconds : set.reps) ?? 0
}
