/** The seven fixed categories. See README.md → "Category colors". */

export interface Category {
  id: string
  name: string
  /** The bar / active-chip fill. */
  color: string
  /** Pale background. */
  tint: string
  /** Text on the tint. */
  deep: string
}

export const CATEGORIES: Category[] = [
  { id: 'trips', name: 'Trips', color: '#c67139', tint: '#ffe1d0', deep: '#8c491a' },
  { id: 'tv', name: 'TV', color: '#7a8a5e', tint: '#e1eecc', deep: '#56633f' },
  { id: 'movies', name: 'Movies', color: '#8c491a', tint: '#ffe1d0', deep: '#643312' },
  { id: 'sports', name: 'Sports', color: '#56633f', tint: '#e1eecc', deep: '#3d472b' },
  { id: 'concerts', name: 'Concerts', color: '#b2622d', tint: '#fff2eb', deep: '#8c491a' },
  { id: 'birthdays', name: 'Birthdays', color: '#f6a06b', tint: '#fff2eb', deep: '#8c491a' },
  { id: 'goals', name: 'Goals', color: '#8fa073', tint: '#f0fae1', deep: '#56633f' },
]

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))

/** Categories are user-creatable, so an unknown id falls back to the first. */
export function categoryById(id: string): Category {
  return byId.get(id) ?? CATEGORIES[0]
}
