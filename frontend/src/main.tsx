import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { AnimatePresence } from 'framer-motion'
import './index.css'

import { AppShell } from '@/components/layout/AppShell'
import { PageTransition } from '@/components/layout/PageTransition'
import { ProtectedRoute, PublicRoute } from '@/components/layout/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'

import LandingPage from '@/pages/LandingPage'
import WorkspacePage from '@/pages/WorkspacePage'
import HistoryPage from '@/pages/HistoryPage'
import RecentPage from '@/pages/RecentPage'
import SettingsPage from '@/pages/SettingsPage'

const EventsPage = lazy(() => import('@/pages/EventsPage'))

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_ZHVtbXkta2V5LmNsZXJrLmFjY291bnRzLmRldiQ'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route element={<PageTransition />}>
                  <Route path="/workspace" element={<WorkspacePage />} />
                  <Route path="/events" element={<Suspense fallback={null}><EventsPage /></Suspense>} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/recent" element={<RecentPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </AnimatePresence>
        <Toaster />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
