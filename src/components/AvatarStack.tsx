import type { CSSProperties } from 'react'
import type { Who } from '../types'
import { WHO } from '../data/people'
import styles from './AvatarStack.module.css'

/** Maddie is sage, Jordan is terracotta. See README.md → "Person colors". */
function colorFor(initial: string): string {
  return initial === 'M' ? 'var(--color-accent-2-600)' : 'var(--color-accent-600)'
}

export function AvatarStack({
  who,
  size = 24,
  ring = 2,
  overlap = 8,
  ringColor = 'var(--color-bg)',
}: {
  who: Who
  size?: number
  ring?: number
  /** How far the second avatar slides back over the first. */
  overlap?: number
  /** Should match whatever sits behind the avatars. */
  ringColor?: string
}) {
  const { initials, label } = WHO[who]

  return (
    <div className={styles.stack} aria-label={label}>
      {initials.map((initial) => (
        <div
          key={initial}
          className={styles.avatar}
          aria-hidden="true"
          style={
            {
              '--avatar-size': `${size}px`,
              '--avatar-font': `${Math.round(size * 0.47)}px`,
              '--avatar-ring': `${ring}px`,
              '--avatar-ring-color': ringColor,
              '--avatar-overlap': `-${overlap}px`,
              '--avatar-color': colorFor(initial),
            } as CSSProperties
          }
        >
          {initial}
        </div>
      ))}
    </div>
  )
}
