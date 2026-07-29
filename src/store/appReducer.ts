import type { Milestone, PersonFilter, Screen, Who } from '../types'
import { toISODate } from '../lib/date'

/** The Add screen's working copy, before it becomes a Milestone. */
export interface Draft {
  title: string
  cat: string
  who: Who
  /** 'YYYY-MM-DD'. Combined with `time` only when `hasTime`. */
  date: string
  /** 'HH:mm' */
  time: string
  hasTime: boolean
  remind: boolean
  notes: string
  link: string
}

export interface ShareRules {
  upcoming: boolean
  past: boolean
  reminders: boolean
}

export interface AppState {
  items: Milestone[]
  /** False until the store's first read resolves. */
  loaded: boolean
  screen: Screen
  /** Browsing filter. Applies to Upcoming and Past together. */
  person: PersonFilter
  cat: 'all' | string
  selectedId: string | null
  /**
   * Set while the Add screen is editing an existing milestone rather than
   * creating one. Null means "new". The Add screen is the only editor, so this
   * is what tells it to update instead of insert.
   */
  editingId: string | null
  /**
   * The home-screen widget's bucket. Deliberately NOT the same as `person` —
   * changing one must never change the other (README.md → Sharing → widget).
   */
  widgetPerson: PersonFilter
  /** Ticked every 60s so countdowns stay honest. */
  now: Date
  /** Surfaced rather than swallowed — a failed sync should be visible. */
  error: string | null
  linked: boolean
  rules: ShareRules
  draft: Draft
}

export function emptyDraft(): Draft {
  return {
    title: '',
    cat: 'trips',
    who: 'both',
    date: toISODate(new Date()),
    time: '19:30',
    hasTime: false,
    remind: true,
    notes: '',
    link: '',
  }
}

/**
 * Fill the draft from an existing milestone so the Add screen can edit it.
 *
 * `date` carries the time for timed milestones ('2026-09-09T20:20'), so it
 * splits back apart here. An all-day milestone keeps a plausible default time,
 * so toggling `hasTime` on doesn't land on an empty field.
 */
export function draftFromMilestone(item: Milestone): Draft {
  const [date, time] = item.date.split('T')
  return {
    title: item.title,
    cat: item.cat,
    who: item.who,
    date,
    time: time ?? '19:30',
    hasTime: item.time,
    remind: item.remind ?? false,
    notes: item.notes ?? '',
    link: item.link ?? '',
  }
}

export type AppAction =
  | { type: 'items/loaded'; items: Milestone[] }
  | { type: 'screen/set'; screen: Screen }
  | { type: 'person/set'; person: PersonFilter }
  | { type: 'cat/set'; cat: 'all' | string }
  | { type: 'selected/set'; id: string | null }
  | { type: 'widgetPerson/set'; person: PersonFilter }
  | { type: 'now/tick'; now: Date }
  | { type: 'error/set'; error: string | null }
  | { type: 'linked/toggle' }
  | { type: 'rules/toggle'; key: keyof ShareRules }
  | { type: 'draft/patch'; patch: Partial<Draft> }
  | { type: 'draft/edit'; item: Milestone }
  | { type: 'draft/reset' }

export const initialState: AppState = {
  items: [],
  loaded: false,
  screen: 'upcoming',
  person: 'all',
  cat: 'all',
  selectedId: null,
  editingId: null,
  widgetPerson: 'all',
  now: new Date(),
  error: null,
  linked: true,
  rules: { upcoming: true, past: true, reminders: false },
  draft: emptyDraft(),
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'items/loaded':
      return { ...state, items: action.items, loaded: true, error: null }
    case 'screen/set':
      return { ...state, screen: action.screen }
    case 'person/set':
      return { ...state, person: action.person }
    case 'cat/set':
      return { ...state, cat: action.cat }
    case 'selected/set':
      return { ...state, selectedId: action.id }
    case 'widgetPerson/set':
      return { ...state, widgetPerson: action.person }
    case 'now/tick':
      return { ...state, now: action.now }
    case 'error/set':
      return { ...state, error: action.error, loaded: true }
    case 'linked/toggle':
      return { ...state, linked: !state.linked }
    case 'rules/toggle':
      return { ...state, rules: { ...state.rules, [action.key]: !state.rules[action.key] } }
    case 'draft/patch':
      return { ...state, draft: { ...state.draft, ...action.patch } }
    case 'draft/edit':
      return { ...state, draft: draftFromMilestone(action.item), editingId: action.item.id }
    case 'draft/reset':
      return { ...state, draft: emptyDraft(), editingId: null }
    default:
      return state
  }
}
