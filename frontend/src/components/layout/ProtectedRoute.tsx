import { Navigate, Outlet } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

export function ProtectedRoute() {
  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <Navigate to="/" replace />
      </SignedOut>
    </>
  )
}

export function PublicRoute() {
  return (
    <>
      <SignedOut>
        <Outlet />
      </SignedOut>
      <SignedIn>
        <Navigate to="/workspace" replace />
      </SignedIn>
    </>
  )
}
