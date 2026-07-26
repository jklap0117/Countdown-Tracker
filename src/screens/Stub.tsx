import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Screen.module.css'

/**
 * Placeholder for a screen that hasn't been built yet. The tab bar targets are
 * real so the chrome behaves correctly; the content lands with each screen.
 */
export function Stub({
  title,
  note,
  onBack,
  children,
}: {
  title: string
  note: string
  /** Screens without the tab bar need their own way out. */
  onBack?: () => void
  children?: ReactNode
}) {
  return (
    <div className={styles.screen}>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack}>
          <ChevronLeft size={18} strokeWidth={2.75} aria-hidden="true" />
          Back
        </button>
      )}
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.tagline}>{note}</div>
      </div>
      {children}
    </div>
  )
}
