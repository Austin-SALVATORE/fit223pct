import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Main } from '@/ui/Main'

/**
 * What the athlete sees when a screen fails to render. It answers the three
 * questions every screen answers (docs/Design.md): what is happening (this
 * screen hit a problem), what to do (try again, or go back to Today), and what
 * happens next (nothing is lost — the saved workouts and history are untouched).
 *
 * **It cannot damage data, by construction.** Its actions are a state reset, a
 * link, and a page reload: no storage, no network, no service-worker call, no
 * "clear" of any kind. A reload re-reads Dexie as it is; an in-progress workout
 * is exactly where it was. (`ErrorBoundary.guard.test.ts` holds this file and
 * `ErrorBoundary.tsx` to that.)
 *
 * It renders its own `Main`: for a screen outside the shell (Workout Mode) that
 * is the page's landmark, and inside the shell it nests to a `<div>`.
 */
export function RouteCrashFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('common')
  return (
    <Main className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-md" role="alert">
        <h1 className="text-display text-2xl text-ink">{t('crash.heading')}</h1>
        <p className="mt-3 leading-relaxed text-ink-secondary">{t('crash.body')}</p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-card bg-amber py-4 text-center text-base font-semibold text-bg"
          >
            {t('crash.tryAgain')}
          </button>
          <Link
            to="/"
            className="w-full rounded-card border border-border py-3.5 text-center text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            {t('crash.backToToday')}
          </Link>
        </div>
      </div>
    </Main>
  )
}

/**
 * The last resort, above the router: anything that is not a single failed route
 * (the shell, a provider, the route table itself). It cannot assume a router, so
 * "Back to Today" is a plain link — a full page load, which is also a reload.
 */
export function AppCrashFallback({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation('common')
  return (
    <Main className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-md" role="alert">
        <h1 className="text-display text-2xl text-ink">{t('crash.appHeading')}</h1>
        <p className="mt-3 leading-relaxed text-ink-secondary">{t('crash.appBody')}</p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onReload}
            className="w-full rounded-card bg-amber py-4 text-center text-base font-semibold text-bg"
          >
            {t('crash.reload')}
          </button>
          <a
            href="/"
            className="w-full rounded-card border border-border py-3.5 text-center text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            {t('crash.backToToday')}
          </a>
        </div>
      </div>
    </Main>
  )
}
