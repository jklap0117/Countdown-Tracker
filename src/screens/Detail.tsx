import { ChevronLeft } from 'lucide-react'
import { categoryById } from '../data/categories'
import { WHO } from '../data/people'
import {
  breakdown,
  daysUntil,
  formatLongWhen,
  isPast,
  parseDate,
  relativeAgo,
} from '../lib/date'
import { downloadIcs } from '../lib/ics'
import { useApp } from '../store/AppContext'
import styles from './Detail.module.css'

const RADIUS = 112
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * How much of the wait has already elapsed.
 *
 * Milestones don't carry a created date in the client model yet, so the ring
 * measures against a fixed 200-day window — the same stand-in the prototype
 * used. Once created_at comes back from Supabase, swap it in here and the ring
 * becomes a true progress bar.
 */
const ASSUMED_WAIT_DAYS = 200

function progressPercent(target: Date, now: Date): number {
  const created = new Date(target.getTime() - ASSUMED_WAIT_DAYS * 86_400_000)
  const elapsed = (now.getTime() - created.getTime()) / (target.getTime() - created.getTime())
  return Math.max(0, Math.min(100, Math.round(elapsed * 100)))
}

export function Detail() {
  const { state, dispatch, store } = useApp()
  const { items, now, selectedId } = state

  const item = items.find((candidate) => candidate.id === selectedId) ?? null
  const goHome = () => dispatch({ type: 'screen/set', screen: 'upcoming' })

  // The item can vanish underneath us — deleted here, or removed on the other
  // phone while this screen is open.
  if (item === null) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <button type="button" className={styles.back} onClick={goHome} aria-label="Back">
            <ChevronLeft size={19} strokeWidth={2.75} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Not found</h1>
          <div className={styles.longWhen}>This milestone is no longer in your list.</div>
        </div>
      </div>
    )
  }

  const category = categoryById(item.cat)
  const target = parseDate(item.date)
  const past = isPast(item, now)
  const days = Math.abs(daysUntil(item, now))
  const { hours, minutes, weeks } = breakdown(item, now)

  // Past milestones render a complete ring rather than an arc.
  const percent = past ? 100 : progressPercent(target, now)
  const dash = `${((CIRCUMFERENCE * percent) / 100).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`

  async function handleDelete() {
    if (item === null) return
    try {
      await store.remove(item.id)
      goHome()
    } catch (cause: unknown) {
      dispatch({
        type: 'error/set',
        error: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topbar}>
        <button type="button" className={styles.back} onClick={goHome} aria-label="Back">
          <ChevronLeft size={19} strokeWidth={2.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.edit}
          onClick={() => {
            dispatch({ type: 'draft/edit', item })
            dispatch({ type: 'screen/set', screen: 'add' })
          }}
        >
          Edit
        </button>
      </div>

      <div className={styles.ringWrap}>
        <div className={styles.ring}>
          <svg width="250" height="250" viewBox="0 0 250 250" className={styles.ringSvg}>
            <circle
              cx="125"
              cy="125"
              r={RADIUS}
              fill="none"
              stroke="var(--color-neutral-300)"
              strokeWidth="14"
            />
            <circle
              cx="125"
              cy="125"
              r={RADIUS}
              fill="none"
              stroke={category.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={dash}
            />
          </svg>
          <div className={styles.ringCenter}>
            <div className={styles.ringCount}>{days}</div>
            <div className={styles.ringWord}>{past ? 'days ago' : 'days to go'}</div>
          </div>
        </div>

        <div className={styles.columns}>
          <div>
            <div className={styles.colValue}>{hours}</div>
            <div className={styles.colLabel}>hours</div>
          </div>
          <div className={styles.colRule} />
          <div>
            <div className={styles.colValue}>{minutes}</div>
            <div className={styles.colLabel}>minutes</div>
          </div>
          <div className={styles.colRule} />
          <div>
            <div className={styles.colValue}>{weeks}</div>
            <div className={styles.colLabel}>weeks</div>
          </div>
        </div>
      </div>

      <div className={styles.titleBlock}>
        <div className={styles.tags}>
          <span className={`tag tag-accent ${styles.tag}`}>{category.name}</span>
          <span className={`tag tag-accent-2 ${styles.tag}`}>{WHO[item.who].label}</span>
        </div>
        <h1 className={styles.title}>{item.title}</h1>
        <div className={styles.longWhen}>{formatLongWhen(item)}</div>
      </div>

      <div className={styles.cardWrap}>
        <div className={styles.card}>
          <div>
            <div className={styles.cardLabel}>Notes</div>
            <div className={styles.notes}>{item.notes ?? 'No notes yet.'}</div>
          </div>
          <div className={styles.rule} />
          <div className={styles.metaRow}>
            <div className={styles.metaLabel}>{past ? 'Happened' : 'Reminder'}</div>
            <div className={styles.metaValue}>
              {past ? relativeAgo(item, now) : '1 day before'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={past ? undefined : () => downloadIcs(item)}
        >
          {past ? 'Add photos' : 'Add to calendar'}
        </button>
        <button type="button" className={`${styles.action} ${styles.share}`}>
          Share
        </button>
      </div>

      <div className={styles.deleteWrap}>
        <button type="button" className={styles.delete} onClick={() => void handleDelete()}>
          Delete milestone
        </button>
      </div>
    </div>
  )
}
