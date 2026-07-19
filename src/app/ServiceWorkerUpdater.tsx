import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { workoutRepo } from '@/data/repositories'

/**
 * A deploy landing while the user is actively engaged with the app is the
 * one way this local-first architecture can hurt them — most obviously
 * mid-set, but a silent reload while they're reading Progress or Library
 * is still an unannounced flash under someone who didn't ask for it. There
 * is no user-facing update prompt; an update only ever activates at a
 * moment that's already a natural transition:
 *   - the app opening fresh (this session settling for the first time —
 *     covers an update that was already waiting before this load)
 *   - the app being reopened after being backgrounded
 *   - an in-app navigation
 * and never while a workout is in progress, regardless of which of those
 * moments it is.
 */
export function ServiceWorkerUpdater() {
  const location = useLocation()
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
  const state = useRef({ needsRefresh, hasActiveWorkout })
  state.current = { needsRefresh, hasActiveWorkout }

  function tryApply() {
    if (state.current.needsRefresh && state.current.hasActiveWorkout === false) {
      void applyUpdate.current?.(true)
    }
  }

  useEffect(() => {
    applyUpdate.current = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true)
      },
    })
  }, [])

  // Still "freshly opened": react to state settling on its own, so an
  // update already waiting before this load lands as soon as both facts
  // are known, without needing a second, separate trigger.
  const isSessionFresh = useRef(true)
  useEffect(() => {
    if (isSessionFresh.current) tryApply()
  }, [needsRefresh, hasActiveWorkout])

  // Reopened after being backgrounded.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        isSessionFresh.current = false
      } else {
        tryApply()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // In-app navigation.
  const previousPathname = useRef(location.pathname)
  useEffect(() => {
    if (previousPathname.current !== location.pathname) {
      isSessionFresh.current = false
      tryApply()
    }
    previousPathname.current = location.pathname
  }, [location.pathname])

  return null
}
