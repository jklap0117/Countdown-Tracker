import { Check, Plus, X } from 'lucide-react'
import { useState, type CSSProperties, type FormEvent } from 'react'
import type { Milestone, Who } from '../types'
import { allCategories, toCategoryId } from '../data/categories'
import { PARTNER_NAME, USER_NAME } from '../data/people'
import { addDays, toISODate } from '../lib/date'
import { useApp } from '../store/AppContext'
import type { Draft } from '../store/appReducer'
import { Switch } from '../components/Switch'
import styles from './Add.module.css'

const WHO_OPTIONS: { id: Who; label: string }[] = [
  { id: 'me', label: USER_NAME },
  { id: 'maddie', label: PARTNER_NAME },
  // Matches the "Shared" bucket in the browsing filter and the widget picker.
  { id: 'both', label: 'Shared' },
]

function whoHint(who: Who): string {
  if (who === 'both') return `Syncs to ${PARTNER_NAME}'s phone and widget.`
  if (who === 'maddie') return `Hers — you'll still see it in All.`
  return 'Private to you.'
}

/**
 * Create a milestone, or edit one.
 *
 * Both modes share this screen deliberately — the fields, validation and date
 * rules are identical, and a second near-copy would be the thing that drifts.
 * `editingId` is the only switch: null creates, an id updates.
 */
export function Add() {
  const { state, dispatch, store } = useApp()
  const { draft, now, items, editingId } = state
  const editing = editingId !== null

  // Naming a new category is a two-step inline flow rather than a dialog —
  // one field, one tap, no modal stacked on a modal.
  const [naming, setNaming] = useState(false)
  const [newName, setNewName] = useState('')

  const patch = (next: Partial<Draft>) => dispatch({ type: 'draft/patch', patch: next })

  // Existing custom categories, plus the one being drafted right now so its
  // chip renders selected before the milestone is saved.
  const categories = allCategories([...items.map((item) => item.cat), draft.cat])

  function commitNewCategory(event: FormEvent) {
    event.preventDefault()
    const id = toCategoryId(newName)
    if (id === '') return
    patch({ cat: id })
    setNewName('')
    setNaming(false)
  }

  function cancelNewCategory() {
    setNewName('')
    setNaming(false)
  }

  // Editing was entered from Detail, so that's where cancelling and saving both
  // return. Creating has no such origin and goes to the list.
  const close = () => {
    const back = editing ? 'detail' : 'upcoming'
    dispatch({ type: 'draft/reset' })
    dispatch({ type: 'screen/set', screen: back })
  }

  const titled = draft.title.trim() !== ''

  const quickDates = [
    { name: 'This weekend', days: 6 - now.getDay() },
    { name: 'Next month', days: 30 },
    { name: 'A year out', days: 365 },
  ]

  async function handleSave() {
    if (!titled) return

    const fields: Omit<Milestone, 'id'> = {
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
      if (editingId === null) {
        await store.add({ id: crypto.randomUUID(), ...fields })
      } else {
        await store.update(editingId, fields)
      }
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
          <div className={styles.kicker}>{editing ? 'Edit milestone' : 'New milestone'}</div>
          <div className={styles.spacer} />
        </div>

        <div className={styles.titleWrap}>
          <input
            className={styles.titleInput}
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="What's coming up?"
            aria-label="Title"
            // Focusing an already-filled field would only throw the keyboard up
            // over the form on a phone.
            autoFocus={!editing}
          />
          <div className={styles.titleRule} />
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Category</div>
          <div className={styles.chips}>
            {categories.map((category) => {
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

            {naming ? (
              <form className={styles.newForm} onSubmit={commitNewCategory}>
                <input
                  className={styles.newInput}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelNewCategory()
                  }}
                  placeholder="Category name"
                  aria-label="New category name"
                  maxLength={24}
                  autoFocus
                />
                <button
                  type="submit"
                  className={styles.newAction}
                  disabled={toCategoryId(newName) === ''}
                  aria-label="Create category"
                >
                  <Check size={14} strokeWidth={2.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.newAction}
                  onClick={cancelNewCategory}
                  aria-label="Cancel"
                >
                  <X size={14} strokeWidth={2.75} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <button type="button" className={styles.newChip} onClick={() => setNaming(true)}>
                <Plus size={13} strokeWidth={2.75} aria-hidden="true" />
                New
              </button>
            )}
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
                <div className={styles.rowSub}>One day before, 9:00 AM</div>
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
          {!titled ? 'Name it first' : editing ? 'Save changes' : 'Start the countdown'}
        </button>
      </div>
    </>
  )
}
