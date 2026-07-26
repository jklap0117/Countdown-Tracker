import type { CSSProperties } from 'react'
import styles from './EmptyState.module.css'

export function EmptyState({
  title,
  hint,
  disc = 'var(--color-accent-2-200)',
}: {
  title: string
  hint: string
  /** Upcoming uses the sage disc; Past uses neutral. */
  disc?: string
}) {
  return (
    <div className={styles.empty} style={{ '--empty-disc': disc } as CSSProperties}>
      <div className={styles.disc} aria-hidden="true" />
      <div className={styles.title}>{title}</div>
      <div className={styles.hint}>{hint}</div>
    </div>
  )
}
