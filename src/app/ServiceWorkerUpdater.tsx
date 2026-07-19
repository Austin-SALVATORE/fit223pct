import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { registerSW } from 'virtual:pwa-register'
import { workoutRepo } from '@/data/repositories'

/**
 * A deploy landing while a workout is open is the one way this local-first
 * architecture can actually hurt the user — reloading mid-set. The service
 * worker still updates in the background as soon as one is available; this
 * only controls the moment it's safe to activate it (skipWaiting + reload).
 */
export function ServiceWorkerUpdater() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const applyUpdate = useRef<((reload?: boolean) => Promise<void>) | null>(null)
  // Tri-state, deliberately: useLiveQuery returns undefined both while
  // loading and once resolved to "no active workout" — collapsing those
  // would let an update slip through before the first query result is in.
  const hasActiveWorkout = useLiveQuery<boolean, null>(
    async () => (await workoutRepo.getActive()) !== undefined,
    [],
    null,
  )

  useEffect(() => {
    applyUpdate.current = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true)
      },
    })
  }, [])

  useEffect(() => {
    if (needsRefresh && hasActiveWorkout === false) {
      void applyUpdate.current?.(true)
    }
  }, [needsRefresh, hasActiveWorkout])

  return null
}
