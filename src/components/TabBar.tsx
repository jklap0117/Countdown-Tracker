import { Calendar, Clock, Users } from 'lucide-react'
import type { Screen } from '../types'
import styles from './TabBar.module.css'

const TABS = [
  { id: 'upcoming', label: 'Upcoming', Icon: Calendar },
  { id: 'past', label: 'Past', Icon: Clock },
  { id: 'share', label: 'Sharing', Icon: Users },
] as const satisfies readonly { id: Screen; label: string; Icon: typeof Calendar }[]

export function TabBar({
  screen,
  onChange,
}: {
  screen: Screen
  onChange: (next: Screen) => void
}) {
  return (
    <nav className={styles.bar} aria-label="Main">
      {TABS.map(({ id, label, Icon }) => {
        const active = screen === id
        return (
          <button
            key={id}
            type="button"
            className={`${styles.tab} ${active ? styles.active : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={23} strokeWidth={2.75} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
