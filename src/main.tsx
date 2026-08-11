import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { seedDatabase } from './data/seed'
import { workoutRepo } from './data/repositories'
import { toDateKey } from './lib/dates'
import App from './app/App'
import './i18n/i18next'
import './ui/index.css'

// Fire-and-forget: live queries pick the content up reactively once seeded.
seedDatabase().catch((error: unknown) => {
  console.error('Database seeding failed', error)
})

// Same shape as seedDatabase above: idempotent, runs every boot, live
// queries pick the closure up reactively — a workout abandoned days ago
// must stop presenting as "in progress" (docs/design/MissedDayDeferral.md).
workoutRepo.closeStaleWorkouts(toDateKey(new Date())).catch((error: unknown) => {
  console.error('Closing stale workouts failed', error)
})

// Repairs any workout the "remove-last-set finishes on screen but not in
// storage" defect left behind (WorkoutPage.handleRemoveSet, fixed
// alongside this) — same idempotent, every-boot shape as
// closeStaleWorkouts above. See repairPositionCompleteWorkout's doc.
workoutRepo.repairPositionCompleteWorkouts(new Date().toISOString()).catch((error: unknown) => {
  console.error('Repairing position-complete workouts failed', error)
})

// Training history lives only in IndexedDB, with no server backup — ask the
// browser not to evict it under storage pressure. No-op where unsupported.
navigator.storage?.persist().catch(() => {})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root is missing from index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
