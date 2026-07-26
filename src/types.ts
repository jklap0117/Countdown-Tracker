/** The data model from the design handoff. See README.md → "Data model". */

export type CategoryId =
  | 'trips'
  | 'tv'
  | 'movies'
  | 'sports'
  | 'concerts'
  | 'birthdays'
  | 'goals'
  | (string & {}) // user-creatable

export type Who = 'me' | 'maddie' | 'both'

export interface Milestone {
  id: string
  title: string
  cat: CategoryId
  /** 'YYYY-MM-DD' (all-day) or 'YYYY-MM-DDTHH:mm' (timed) */
  date: string
  /** whether a time was set — time is OPTIONAL by design */
  time: boolean
  who: Who
  notes?: string
  link?: string
  /** 1 day before, 9:00 AM local. */
  remind?: boolean
}

export type Screen = 'upcoming' | 'past' | 'share' | 'detail' | 'add'

/** Browsing filter and widget bucket share this shape but stay independent. */
export type PersonFilter = 'all' | 'me' | 'maddie' | 'both'
