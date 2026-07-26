import { X } from 'lucide-react'
import styles from './ErrorBanner.module.css'

/** A sync failure should be visible, not swallowed into an empty list. */
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className={styles.banner} role="alert">
      <div className={styles.text}>{message}</div>
      <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        <X size={14} strokeWidth={2.75} aria-hidden="true" />
      </button>
    </div>
  )
}
