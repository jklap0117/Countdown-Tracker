import type { Milestone } from '../types'
import { categoryById } from '../data/categories'
import { countdownCopy, formatWhen } from '../lib/date'
import { AvatarStack } from './AvatarStack'
import styles from './HeroCard.module.css'

/** The single next milestone in the filtered list. */
export function HeroCard({
  item,
  now,
  onOpen,
}: {
  item: Milestone
  now: Date
  onOpen: (id: string) => void
}) {
  const category = categoryById(item.cat)
  const { big, unit } = countdownCopy(item, now)

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.card} onClick={() => onOpen(item.id)}>
        <div className={styles.blob} aria-hidden="true" />

        <div className={styles.kicker}>
          <div className={styles.kickerText}>Up next · {category.name}</div>
          <AvatarStack who={item.who} />
        </div>

        <div className={styles.body}>
          <div className={styles.count}>
            <div className={styles.big}>{big}</div>
            <div className={styles.unit}>{unit}</div>
          </div>
          <div className={styles.meta}>
            <div className={styles.title}>{item.title}</div>
            <div className={styles.when}>{formatWhen(item)}</div>
          </div>
        </div>
      </button>
    </div>
  )
}
