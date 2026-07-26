import { Plus } from 'lucide-react'
import styles from './Fab.module.css'

export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <div className={styles.layer}>
      <button type="button" className={styles.fab} onClick={onClick} aria-label="Add milestone">
        <Plus size={26} strokeWidth={2.75} aria-hidden="true" />
      </button>
    </div>
  )
}
