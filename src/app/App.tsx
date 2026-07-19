import { Route, Routes } from 'react-router'
import { AppShell } from './AppShell'
import { ServiceWorkerUpdater } from './ServiceWorkerUpdater'
import { LocaleSync } from '@/i18n/LocaleSync'
import { TodayPage } from '@/features/today/TodayPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { ExercisePage } from '@/features/library/ExercisePage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { PlanPage } from '@/features/plan/PlanPage'
import { PlanDayPage } from '@/features/plan/PlanDayPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export default function App() {
  return (
    <>
      <ServiceWorkerUpdater />
      <LocaleSync />
      <Routes>
        {/* Workout mode is a full-screen takeover — no shell chrome */}
        <Route path="workout" element={<WorkoutPage />} />
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
    </>
  )
}
