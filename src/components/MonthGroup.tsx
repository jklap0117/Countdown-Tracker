import type { Milestone } from '../types'
import type { MonthGroup as MonthGroupData } from '../lib/date'
import { MilestoneRow } from './MilestoneRow'
import styles from './MonthGroup.module.css'

export function MonthGroup({
  group,
  now,
  variant = 'upcoming',
  onOpen,
}: {
  group: MonthGroupData
  now: Date
  variant?: 'upcoming' | 'past'
  onOpen: (id: string) => void
}) {
  return (
    <section className={styles.group} aria-label={group.heading}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{group.heading}</h2>
        <div className={styles.rule} aria-hidden="true" />
        <div className={styles.count}>{group.count}</div>
      </div>

      <div className={styles.items}>
        {group.items.map((item: Milestone) => (
          <MilestoneRow key={item.id} item={item} now={now} variant={variant} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}
