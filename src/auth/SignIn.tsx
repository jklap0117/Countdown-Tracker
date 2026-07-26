import { useState, type FormEvent } from 'react'
import { requireSupabase } from '../lib/supabase'
import styles from './SignIn.module.css'

type Status = { kind: 'idle' | 'sending' } | { kind: 'sent' | 'error'; message: string }

/**
 * Magic-link sign-in. There's no password to store or leak, and the two of you
 * only ever do this once per device.
 */
export function SignIn() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (email.trim() === '') return

    setStatus({ kind: 'sending' })
    const { error } = await requireSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setStatus({ kind: 'error', message: error.message })
      return
    }
    setStatus({ kind: 'sent', message: `Check ${email.trim()} for a sign-in link.` })
  }

  const sending = status.kind === 'sending'

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Coming up</h1>
      <p className={styles.blurb}>
        Sign in to sync your milestones across both phones. We'll email you a link — no
        password to remember.
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
        <button type="submit" className={styles.submit} disabled={sending || email.trim() === ''}>
          {sending ? 'Sending…' : 'Email me a link'}
        </button>
      </form>

      {(status.kind === 'sent' || status.kind === 'error') && (
        <div className={`${styles.note} ${status.kind === 'error' ? styles.error : ''}`}>
          {status.message}
        </div>
      )}
    </div>
  )
}
