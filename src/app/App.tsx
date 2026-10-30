import { Route, Routes } from 'react-router'
import { AppErrorBoundary, RouteErrorBoundary } from './boundaries'
import { AppShell } from './AppShell'
import { ServiceWorkerUpdater } from './ServiceWorkerUpdater'
import { LocaleSync } from '@/i18n/LocaleSync'
import { TodayPage } from '@/features/today/TodayPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { ExercisePage } from '@/features/library/ExercisePage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
import { RoutinePlayer } from '@/features/recovery/RoutinePlayer'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { PlanPage } from '@/features/plan/PlanPage'
import { PlanDayPage } from '@/features/plan/PlanDayPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export default function App() {
  return (
    <AppErrorBoundary>
      <ServiceWorkerUpdater />
      <LocaleSync />
      <Routes>
        {/*
          Workout mode is a full-screen takeover — no shell chrome. Each takeover
          has its own error boundary, so a failure in it shows a recovery screen
          instead of a blank page and cannot take Today down (and a failing Today
          cannot take it down). The shell's screens share one, inside `AppShell`.
        */}
        <Route
          path="workout"
          element={
            <RouteErrorBoundary>
              <WorkoutPage />
            </RouteErrorBoundary>
          }
        />
        {/* A routine is the same kind of thing: minutes long, one decision at a time */}
        <Route
          path="routine/:routineId"
          element={
            <RouteErrorBoundary>
              <RoutinePlayer />
            </RouteErrorBoundary>
          }
        />
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="library/:exerciseId" element={<ExercisePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="plan/:date" element={<PlanDayPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AppErrorBoundary>
  )
}
