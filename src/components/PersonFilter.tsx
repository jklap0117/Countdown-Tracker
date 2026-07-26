import type { PersonFilter as PersonFilterValue } from '../types'
import { PEOPLE } from '../data/people'
import { AvatarStack } from './AvatarStack'
import styles from './PersonFilter.module.css'

export function PersonFilter({
  value,
  onChange,
}: {
  value: PersonFilterValue
  onChange: (next: PersonFilterValue) => void
}) {
  const allActive = value === 'all'

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={`${styles.all} ${allActive ? styles.allActive : ''}`}
        aria-pressed={allActive}
        onClick={() => onChange('all')}
      >
        <AvatarStack
          who="both"
          size={16}
          ring={1.5}
          overlap={5}
          // The ring has to match whatever the pill is filled with.
          ringColor={allActive ? 'var(--color-neutral-900)' : 'var(--color-bg)'}
        />
        All
      </button>

      <div className={styles.track} role="group" aria-label="Filter by person">
        {PEOPLE.map((person) => {
          const active = value === person.id
          return (
            <button
              key={person.id}
              type="button"
              className={`${styles.opt} ${active ? styles.optActive : ''}`}
              aria-pressed={active}
              onClick={() => onChange(person.id)}
            >
              {person.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
