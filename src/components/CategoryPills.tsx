import type { Category } from '../data/categories'
import styles from './CategoryPills.module.css'

export function CategoryPills({
  categories,
  value,
  onChange,
}: {
  /** Built-ins plus any custom categories currently in use. */
  categories: Category[]
  value: 'all' | string
  onChange: (next: 'all' | string) => void
}) {
  const options = [{ id: 'all', name: 'All' }, ...categories]

  return (
    <div className={styles.row} role="group" aria-label="Filter by category">
      {options.map((option) => {
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
