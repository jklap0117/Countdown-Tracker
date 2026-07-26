import type { CSSProperties } from 'react'
import type { Milestone } from '../types'
import { categoryById } from '../data/categories'
import { countdownCopy, formatWhen, relativeAgo } from '../lib/date'
import { AvatarStack } from './AvatarStack'
import styles from './MilestoneRow.module.css'

/**
 * One milestone in a month group. The `past` variant is the same row dialled
 * back — softer, shorter bar, and relative copy instead of a countdown.
 */
export function MilestoneRow({
  item,
  now,
  variant = 'upcoming',
  onOpen,
}: {
  item: Milestone
  now: Date
  variant?: 'upcoming' | 'past'
  onOpen: (id: string) => void
}) {
  const category = categoryById(item.cat)
  const isPastVariant = variant === 'past'
  const countdown = isPastVariant ? null : countdownCopy(item, now)

  return (
    <button
      type="button"
      className={`${styles.row} ${isPastVariant ? styles.past : ''}`}
      onClick={() => onOpen(item.id)}
      style={{ '--row-color': category.color } as CSSProperties}
    >
      <div className={styles.bar} aria-hidden="true" />

      <div className={styles.main}>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.meta}>
          <div className={styles.when}>{formatWhen(item)}</div>
          <AvatarStack who={item.who} />
        </div>
      </div>

      {countdown ? (
        <div className={styles.count}>
          <div className={styles.big}>{countdown.big}</div>
          <div className={styles.unit}>{countdown.unit}</div>
        </div>
      ) : (
        <div className={styles.ago}>{relativeAgo(item, now)}</div>
      )}
    </button>
  )
}
