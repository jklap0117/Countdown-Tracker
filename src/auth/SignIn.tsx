import { useState, type FormEvent } from 'react'
import { requireSupabase } from '../lib/supabase'
import styles from './SignIn.module.css'

/**
 * Sign-in by six-digit code, not by clicking the emailed link.
 *
 * On iOS a home-screen web app has its own storage container, separate from
 * Safari. Tapping a magic link opens Safari, so the session lands in the wrong
 * container and the installed app is still signed out. Typing the code here
 * keeps the whole exchange inside the app.
 *
 * The emailed link still works — useful on desktop — it just isn't the path
 * this screen depends on.
 */
export function SignIn() {
  const [stage, setStage] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(event: FormEvent) {
    event.preventDefault()
    const address = email.trim()
    if (address === '') return

    setBusy(true)
    setError(null)
    const { error: sendError } = await requireSupabase().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)

    if (sendError) {
      setError(sendError.message)
      return
    }
    setStage('code')
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    const token = code.trim()
    if (token === '') return

    setBusy(true)
    setError(null)
    const { error: verifyError } = await requireSupabase().auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    })
    setBusy(false)

    // On success the auth listener swaps this screen out; nothing to do here.
    if (verifyError) setError(verifyError.message)
  }

  function startOver() {
    setStage('email')
    setCode('')
    setError(null)
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Coming up</h1>

      {stage === 'email' ? (
        <>
          <p className={styles.blurb}>
            Sign in to sync your milestones across both phones. We'll email you a code — no
            password to remember.
          </p>

          <form className={styles.form} onSubmit={(e) => void sendCode(e)}>
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
            <button
              type="submit"
              className={styles.submit}
              disabled={busy || email.trim() === ''}
            >
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className={styles.blurb}>
            Enter the six-digit code sent to <strong>{email.trim()}</strong>.
          </p>

          <form className={styles.form} onSubmit={(e) => void verifyCode(e)}>
            <label className={styles.label} htmlFor="code">
              Code
            </label>
            <input
              id="code"
              className={`${styles.input} ${styles.codeInput}`}
              type="text"
              value={code}
              // Lets iOS offer the code straight from the notification.
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
            <button type="submit" className={styles.submit} disabled={busy || code.length < 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </form>

          <button type="button" className={styles.secondary} onClick={startOver}>
            Use a different email
          </button>
        </>
      )}

      {error !== null && <div className={`${styles.note} ${styles.error}`}>{error}</div>}
    </div>
  )
}
