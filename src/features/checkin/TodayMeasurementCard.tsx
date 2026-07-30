import { useLiveQuery } from 'dexie-react-hooks'
import { checkinRepo } from '@/data/repositories'
import { toDateKey } from '@/lib/dates'
import { MeasurementCard } from './MeasurementCard'

/**
 * `MeasurementCard` wired to today's check-in, for surfaces that do not
 * already hold one — currently the profile page in Settings, where the owner
 * looked for a body-fat input and found none.
 *
 * **It reuses the card rather than reimplementing the write.** Two components
 * owning create-or-update for the same row is how they diverge: one gains a
 * new nullable column and the other keeps writing null over it. The card, and
 * now `checkinRepo.mergeByDate` beneath it, is the single write path.
 *
 * **It writes a `CheckIn`, never `UserSettings`.** `docs/UserProfile.md`
 * forbids a second copy of a measurement: current weight resolves as the most
 * recent check-in carrying a non-null weight, and a settings copy would drift
 * the first time a check-in was logged without opening the profile, with
 * nothing to report the disagreement.
 *
 * **It shows today, and only claims today.** The card renders the row for
 * `toDateKey(new Date())`, so its collapsed summary is a fact about today
 * rather than about whenever the last measurement happened. That distinction
 * matters here specifically: `resolveProfile` returns the most recent non-null
 * weight, which may be weeks old, so a heading like "measured today" over
 * *that* figure would be a false statement — the same error class as
 * attributing a guessed activity level to someone who never stated one. The
 * baseline card keeps that figure and words it "most recently".
 */
export function TodayMeasurementCard() {
  const todayKey = toDateKey(new Date())
  // Wrapped in an object so loading is distinguishable from "no row yet" —
  // useLiveQuery yields undefined for both, and the card renders its expanded
  // form with placeholder defaults when there is no row. Without this the
  // defaults would flash before a real measurement resolved.
  const data = useLiveQuery(
    async () => ({ checkIn: await checkinRepo.getByDate(todayKey) }),
    [todayKey],
  )

  if (!data) return null
  return <MeasurementCard dateKey={todayKey} checkIn={data.checkIn} />
}
