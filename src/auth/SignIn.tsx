import { useState, type FormEvent } from 'react'
import { requireSupabase } from '../lib/supabase'
import styles from './SignIn.module.css'

const MIN_PASSWORD = 8

/**
 * Email and password, with no email sent at all.
 *
 * Two constraints pushed us here. Supabase's default SMTP only delivers to
 * members of the project's own org, so a partner who isn't one would never
 * receive a magic link. And on iOS a home-screen web app has its own storage
 * container — a link tapped in Mail opens Safari, so the session lands
 * somewhere the installed app cannot see.
 *
 * Signing in with a password keeps the whole exchange inside the app. It
 * requires "Confirm email" to be OFF in Authentication → Providers → Email;
 * if it is on, signUp returns no session and we say so rather than appearing
 * to hang.
 */
export function SignIn() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const signingUp = mode === 'sign-up'
  const ready = email.trim() !== '' && password.length >= MIN_PASSWORD

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return

    setBusy(true)
    setError(null)
    setNotice(null)

    const auth = requireSupabase().auth
    const credentials = { email: email.trim(), password }

    if (signingUp) {
      const { data, error: signUpError } = await auth.signUp(credentials)
      setBusy(false)

      if (signUpError) {
        setError(signUpError.message)
        return
      }
      // No session means the project still wants email confirmation, which
      // cannot work here — the default SMTP won't mail non-org addresses.
      if (data.session === null) {
        setNotice(
          'Account created, but the project still requires email confirmation. ' +
            'Turn off "Confirm email" under Authentication → Providers → Email, then sign in.',
        )
        setMode('sign-in')
      }
      return
    }

    const { error: signInError } = await auth.signInWithPassword(credentials)
    setBusy(false)
    if (signInError) setError(signInError.message)
    // On success the auth listener swaps this screen out.
  }

  function switchMode() {
    setMode(signingUp ? 'sign-in' : 'sign-up')
    setError(null)
    setNotice(null)
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Coming up</h1>
      <p className={styles.blurb}>
        {signingUp
          ? 'Create an account to sync your milestones across both phones.'
          : 'Sign in to sync your milestones across both phones.'}
      </p>

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className={styles.input}
          type="email"
          value={email}
          autoComplete="email"
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className={styles.input}
          type="password"
          value={password}
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          placeholder={`At least ${MIN_PASSWORD} characters`}
          minLength={MIN_PASSWORD}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className={styles.submit} disabled={busy || !ready}>
          {busy ? 'Just a moment…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button type="button" className={styles.secondary} onClick={switchMode}>
        {signingUp ? 'I already have an account' : 'Create an account'}
      </button>

      {error !== null && <div className={`${styles.note} ${styles.error}`}>{error}</div>}
      {notice !== null && <div className={styles.note}>{notice}</div>}
    </div>
  )
}
