import { CATEGORIES } from '../data/categories'
import styles from './CategoryPills.module.css'

const OPTIONS = [{ id: 'all', name: 'All' }, ...CATEGORIES.map((c) => ({ id: c.id, name: c.name }))]

export function CategoryPills({
  value,
  onChange,
}: {
  value: 'all' | string
  onChange: (next: 'all' | string) => void
}) {
  return (
    <div className={styles.row} role="group" aria-label="Filter by category">
      {OPTIONS.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            className={`${styles.pill} ${active ? styles.active : ''}`}
            aria-pressed={active}
            onClick={() => onChange(option.id)}
          >
            {option.name}
          </button>
        )
      })}
    </div>
  )
}
