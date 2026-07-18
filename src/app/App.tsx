import { Route, Routes } from 'react-router'
import { AppShell } from './AppShell'
import { TodayPage } from '@/features/today/TodayPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { ExercisePage } from '@/features/library/ExercisePage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'

export default function App() {
  return (
    <Routes>
      {/* Workout mode is a full-screen takeover — no shell chrome */}
      <Route path="workout" element={<WorkoutPage />} />
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="library/:exerciseId" element={<ExercisePage />} />
      </Route>
    </Routes>
  )
}
