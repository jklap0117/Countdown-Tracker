import type { PersonFilter, Who } from '../types'

export const USER_NAME = 'Jordan'
export const PARTNER_NAME = 'Maddie'

export const WHO: Record<Who, { label: string; initials: string[] }> = {
  me: { label: USER_NAME, initials: ['J'] },
  maddie: { label: PARTNER_NAME, initials: ['M'] },
  both: { label: `${USER_NAME} + ${PARTNER_NAME}`, initials: ['J', 'M'] },
}

/** The three options in the segmented track. "All" sits outside it. */
export const PEOPLE: { id: Who; name: string }[] = [
  { id: 'me', name: USER_NAME },
  { id: 'maddie', name: PARTNER_NAME },
  { id: 'both', name: 'Shared' },
]

/**
 * All = everything · Jordan = his + shared · Maddie = hers + shared ·
 * Shared = only items tagged to both. See README.md → "Filter semantics".
 */
export function matchesPerson(who: Who, filter: PersonFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'both') return who === 'both'
  return who === filter || who === 'both'
}
