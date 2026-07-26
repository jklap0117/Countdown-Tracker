import { useMemo } from 'react'
import App from './App'
import { SignIn } from './auth/SignIn'
import { useSession } from './auth/useSession'
import { isSupabaseConfigured } from './lib/supabase'
import { AppProvider } from './store/AppProvider'
import { createSupabaseStore } from './store/supabaseStore'

/**
 * Decides what the app is talking to.
 *
 * No credentials → localStorage, single device, no sign-in. Credentials → the
 * shared Supabase list, which needs a signed-in user because every visibility
 * rule is written in terms of auth.uid().
 */
export function Root() {
  if (!isSupabaseConfigured) {
    return (
      <AppProvider>
        <App />
      </AppProvider>
    )
  }
  return <SyncedRoot />
}

function SyncedRoot() {
  const { session, loading } = useSession()
  // Only built once signed in — the store's queries assume a session.
  const store = useMemo(() => (session ? createSupabaseStore() : null), [session])

  // Held blank rather than flashing the sign-in screen at someone who is
  // already signed in.
  if (loading) return null
  if (!session || !store) return <SignIn />

  return (
    <AppProvider store={store}>
      <App />
    </AppProvider>
  )
}
