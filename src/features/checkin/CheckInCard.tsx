import { useState } from 'react'
import { checkinRepo } from '@/data/repositories'
import { describeDrivers, type Readiness, type ReadinessSignal } from '@/domain/readiness'
import type { CheckIn, Rating } from '@/domain/types'

/**
 * The readiness check-in: five taps, under ten seconds, zero typing.
 * Auto-saves per tap. Skipping is always fine (no badge, no streak) —
 * an unanswered check-in simply means the plan is the plan.
 * Labels are phrased so 5 is always the good end.
 */

const SIGNAL_ROWS: { signal: ReadinessSignal; label: string }[] = [
  { signal: 'sleep', label: 'Sleep' },
  { signal: 'energy', label: 'Energy' },
  { signal: 'soreness', label: 'Freshness' },
  { signal: 'stress', label: 'Calm' },
  { signal: 'motivation', label: 'Motivation' },
]

interface CheckInCardProps {
  dateKey: string
  checkIn: CheckIn | undefined
  readiness: Readiness
}

export function CheckInCard({ dateKey, checkIn, readiness }: CheckInCardProps) {
  const complete = SIGNAL_ROWS.every(({ signal }) => checkIn?.[signal] != null)
  const [editing, setEditing] = useState(false)
  const expanded = editing || !complete

  async function rate(signal: ReadinessSignal, value: Rating) {
    const next: CheckIn = {
      id: `checkin-${dateKey}`,
      date: dateKey,
      sleep: null,
      energy: null,
      soreness: null,
      stress: null,
      motivation: null,
      weightKg: null,
      waistCm: null,
      ...checkIn,
      [signal]: value,
    }
    await checkinRepo.put(next)
    const nowComplete = SIGNAL_ROWS.every(({ signal: s }) => next[s] != null)
    if (nowComplete) setEditing(false)
  }

  return (
    <section
      aria-label="Readiness check-in"
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      {expanded ? (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Today's readiness</h2>
            <p className="text-xs text-ink-tertiary">1 low · 5 high</p>
          </div>
          <div className="mt-4 space-y-3">
            {SIGNAL_ROWS.map(({ signal, label }) => (
              <div key={signal} className="flex items-center justify-between gap-3">
                <span className="w-24 shrink-0 text-sm text-ink-secondary">{label}</span>
                <div
                  role="radiogroup"
                  aria-label={label}
                  className="flex gap-1.5"
                >
                  {([1, 2, 3, 4, 5] as const).map((value) => {
                    const selected = checkIn?.[signal] === value
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${label} ${value} of 5`}
                        data-numeric
                        onClick={() => void rate(signal, value)}
                        className={`h-10 w-10 rounded-full border text-sm transition-colors ${
                          selected
                            ? 'border-amber bg-amber/15 font-semibold text-amber'
                            : 'border-border text-ink-tertiary hover:border-border-strong hover:text-ink-secondary'
                        }`}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-baseline justify-between gap-4 text-left"
        >
          <div>
            <h2 className="eyebrow">Today's readiness</h2>
            <p className="mt-2 text-ink">{tierPhrase(readiness)}</p>
          </div>
          <span className="shrink-0 text-sm text-ink-tertiary">Edit</span>
        </button>
      )}
    </section>
  )
}

function tierPhrase(readiness: Readiness): string {
  switch (readiness.tier) {
    case 'ready':
      return 'Ready to train.'
    case 'steady':
      return 'Good to go.'
    case 'easier':
      return `Taking it a touch easier today — ${describeDrivers(readiness.drivers)}.`
  }
}
