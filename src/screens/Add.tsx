import { Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Milestone, Who } from '../types'
import { CATEGORIES } from '../data/categories'
import { PARTNER_NAME, USER_NAME } from '../data/people'
import { addDays, toISODate } from '../lib/date'
import { useApp } from '../store/AppContext'
import type { Draft } from '../store/appReducer'
import { Switch } from '../components/Switch'
import styles from './Add.module.css'

const WHO_OPTIONS: { id: Who; label: string }[] = [
  { id: 'me', label: USER_NAME },
  { id: 'maddie', label: PARTNER_NAME },
  { id: 'both', label: `${USER_NAME} + ${PARTNER_NAME}` },
]

function whoHint(who: Who): string {
  if (who === 'both') return `Syncs to ${PARTNER_NAME}'s phone and widget.`
  if (who === 'maddie') return `Hers — you'll still see it in All.`
  return 'Private to you.'
}

export function Add() {
  const { state, dispatch, store } = useApp()
  const { draft, now } = state

  const patch = (next: Partial<Draft>) => dispatch({ type: 'draft/patch', patch: next })

  const close = () => {
    dispatch({ type: 'draft/reset' })
    dispatch({ type: 'screen/set', screen: 'upcoming' })
  }

  const titled = draft.title.trim() !== ''

  const quickDates = [
    { name: 'This weekend', days: 6 - now.getDay() },
    { name: 'Next month', days: 30 },
    { name: 'A year out', days: 365 },
  ]

  async function handleSave() {
    if (!titled) return

    const milestone: Milestone = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      cat: draft.cat,
      date: draft.hasTime ? `${draft.date}T${draft.time}` : draft.date,
      time: draft.hasTime,
      who: draft.who,
      notes: draft.notes.trim() === '' ? undefined : draft.notes.trim(),
      link: draft.link.trim() === '' ? undefined : draft.link.trim(),
      remind: draft.remind,
    }

    try {
      await store.add(milestone)
      close()
    } catch (cause: unknown) {
      dispatch({
        type: 'error/set',
        error: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }

  return (
    <>
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <button type="button" className={styles.cancel} onClick={close}>
            Cancel
          </button>
          <div className={styles.kicker}>New milestone</div>
          <div className={styles.spacer} />
        </div>

        <div className={styles.titleWrap}>
          <input
            className={styles.titleInput}
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="What's coming up?"
            aria-label="Title"
            autoFocus
          />
          <div className={styles.titleRule} />
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Category</div>
          <div className={styles.chips}>
            {CATEGORIES.map((category) => {
              const active = draft.cat === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  aria-pressed={active}
                  style={{ '--chip-color': category.color } as CSSProperties}
                  onClick={() => patch({ cat: category.id })}
                >
                  {category.name}
                </button>
              )
            })}
            <button type="button" className={styles.newChip}>
              <Plus size={13} strokeWidth={2.75} aria-hidden="true" />
              New
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Who's it for</div>
          <div className={styles.whoRow}>
            {WHO_OPTIONS.map((option) => {
              const active = draft.who === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.whoChip} ${active ? styles.whoActive : ''}`}
                  aria-pressed={active}
                  onClick={() => patch({ who: option.id })}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <div className={styles.hint}>{whoHint(draft.who)}</div>
        </div>

        <div className={styles.section}>
          <div className={styles.label}>When</div>
          <div className={styles.card}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>Date</div>
              <input
                type="date"
                className={styles.dateInput}
                value={draft.date}
                onChange={(e) => patch({ date: e.target.value })}
                aria-label="Date"
              />
            </div>

            <div className={styles.rule} />

            <div className={styles.row}>
              <div>
                <div className={styles.rowLabel}>Add a time</div>
                <div className={styles.rowSub}>Optional — leave off for all-day</div>
              </div>
              <Switch
                checked={draft.hasTime}
                onChange={(next) => patch({ hasTime: next })}
                label="Add a time"
              />
            </div>

            {draft.hasTime && (
              <div className={styles.timeRow}>
                <div className={styles.rowLabel}>Time</div>
                <input
                  type="time"
                  className={styles.dateInput}
                  value={draft.time}
                  onChange={(e) => patch({ time: e.target.value })}
                  aria-label="Time"
                />
              </div>
            )}

            <div className={styles.quick}>
              {quickDates.map((quick) => (
                <button
                  key={quick.name}
                  type="button"
                  className={styles.quickChip}
                  onClick={() => patch({ date: toISODate(addDays(now, quick.days)) })}
                >
                  {quick.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Extras</div>
          <div className={`${styles.card} ${styles.cardStack}`}>
            <input
              className={styles.textInput}
              value={draft.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Notes — flight numbers, who's coming…"
              aria-label="Notes"
            />
            <input
              className={styles.textInput}
              value={draft.link}
              onChange={(e) => patch({ link: e.target.value })}
              placeholder="Link (trailer, booking, tickets)"
              aria-label="Link"
            />
            <div className={styles.row}>
              <div>
                <div className={styles.rowLabel}>Remind me</div>
                <div className={styles.rowSub}>One week before, 9:00 AM</div>
              </div>
              <Switch
                checked={draft.remind}
                onChange={(next) => patch({ remind: next })}
                label="Remind me"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.save}
          disabled={!titled}
          onClick={() => void handleSave()}
        >
          {titled ? 'Start the countdown' : 'Name it first'}
        </button>
      </div>
    </>
  )
}
