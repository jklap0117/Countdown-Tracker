import { useMemo } from 'react'
import { matchesPerson } from '../data/people'
import { byDateAscending, groupByMonth, isPast } from '../lib/date'
import { useApp } from '../store/AppContext'
import { EmptyState } from '../components/EmptyState'
import { MonthGroup } from '../components/MonthGroup'
import { PersonFilter } from '../components/PersonFilter'
import styles from './Screen.module.css'

export function Past() {
  const { state, dispatch } = useApp()
  const { items, now, person } = state

  // Most recent first, and newest → oldest inside each month. No category row
  // here by design, but the person filter is shared with Upcoming.
  const list = useMemo(
    () =>
      items
        .filter((item) => isPast(item, now))
        .filter((item) => matchesPerson(item.who, person))
        .sort(byDateAscending)
        .reverse(),
    [items, now, person],
  )

  const groups = useMemo(() => groupByMonth(list), [list])

  const openDetail = (id: string) => {
    dispatch({ type: 'selected/set', id })
    dispatch({ type: 'screen/set', screen: 'detail' })
  }

  const count = list.length

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Looking back</h1>
        <div className={styles.tagline}>
          {count} {count === 1 ? 'milestone' : 'milestones'} already behind you
        </div>
      </div>

      <PersonFilter
        value={person}
        onChange={(next) => dispatch({ type: 'person/set', person: next })}
      />

      <div className={styles.pastGroups}>
        {groups.map((group) => (
          <MonthGroup
            key={group.key}
            group={group}
            now={now}
            variant="past"
            onOpen={openDetail}
          />
        ))}

        {count === 0 && (
          <EmptyState
            title="No history yet"
            hint="Milestones move here the day after they happen."
            disc="var(--color-neutral-200)"
          />
        )}
      </div>
    </div>
  )
}
