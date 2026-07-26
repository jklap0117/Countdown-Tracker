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

/** Colour triples reused for user-created categories, so customs stay on-brand. */
const CUSTOM_PALETTE = CATEGORIES.map(({ color, tint, deep }) => ({ color, tint, deep }))

/** Stable across devices — the same id always picks the same colour. */
function paletteFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return CUSTOM_PALETTE[Math.abs(hash) % CUSTOM_PALETTE.length]
}

/** 'summer-races' → 'Summer races' */
function nameFromId(id: string): string {
  const words = id.replace(/-/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function toCategoryId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
}

/**
 * Categories are user-creatable. A custom one is derived from its id rather
 * than stored — name and colour both fall out of the slug — so it needs no
 * separate table and syncs for free with the milestone that carries it.
 */
export function categoryById(id: string): Category {
  const known = byId.get(id)
  if (known) return known
  return { id, name: nameFromId(id), ...paletteFor(id) }
}

/** The seven built-ins plus whatever custom ids appear in `usedIds`. */
export function allCategories(usedIds: Iterable<string>): Category[] {
  const custom: Category[] = []
  const seen = new Set<string>()
  for (const id of usedIds) {
    if (byId.has(id) || seen.has(id)) continue
    seen.add(id)
    custom.push(categoryById(id))
  }
  return [...CATEGORIES, ...custom]
}
