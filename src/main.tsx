import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { seedDatabase } from './data/seed'
import App from './app/App'
import './ui/index.css'

// Fire-and-forget: live queries pick the content up reactively once seeded.
seedDatabase().catch((error: unknown) => {
  console.error('Database seeding failed', error)
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
