import { useMemo } from 'react'
import { matchesPerson } from '../data/people'
import { byDateAscending, groupByMonth, isPast, pluralizeThings } from '../lib/date'
import { useApp } from '../store/AppContext'
import { CategoryPills } from '../components/CategoryPills'
import { EmptyState } from '../components/EmptyState'
import { HeroCard } from '../components/HeroCard'
import { MonthGroup } from '../components/MonthGroup'
import { PersonFilter } from '../components/PersonFilter'
import styles from './Screen.module.css'

export function Upcoming() {
  const { state, dispatch } = useApp()
  const { items, now, person, cat } = state

  const list = useMemo(
    () =>
      items
        .filter((item) => !isPast(item, now))
        .filter((item) => matchesPerson(item.who, person))
        .filter((item) => cat === 'all' || item.cat === cat)
        .sort(byDateAscending),
    [items, now, person, cat],
  )

  // The hero is the next milestone and is NOT repeated in the month groups.
  const hero = list[0] ?? null
  const groups = useMemo(() => groupByMonth(list.slice(1)), [list])

  const openDetail = (id: string) => {
    dispatch({ type: 'selected/set', id })
    dispatch({ type: 'screen/set', screen: 'detail' })
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Coming up</h1>
        <div className={styles.tagline}>{pluralizeThings(list.length)} to look forward to</div>
      </div>

      <PersonFilter
        value={person}
        onChange={(next) => dispatch({ type: 'person/set', person: next })}
      />
      <CategoryPills value={cat} onChange={(next) => dispatch({ type: 'cat/set', cat: next })} />

      {hero && <HeroCard item={hero} now={now} onOpen={openDetail} />}

      {groups.map((group) => (
        <MonthGroup key={group.key} group={group} now={now} onOpen={openDetail} />
      ))}

      {list.length === 0 && (
        <EmptyState
          title="Nothing on the horizon"
          hint={
            person === 'both'
              ? 'Nothing shared yet — tag a milestone to both of you.'
              : 'Add something to look forward to.'
          }
        />
      )}
    </div>
  )
}
