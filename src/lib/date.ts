/**
 * Date and countdown logic. See README.md → "Date rules", which flags these as
 * the places the prototype got things wrong. Everything here is pure so the
 * rules can be reasoned about (and tested) away from the render path.
 */

import type { Milestone } from '../types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MS_PER_DAY = 86_400_000
const MS_PER_HOUR = 3_600_000

/**
 * Rule 1: date-only strings are LOCAL, never UTC. `new Date('2026-10-03')` is
 * UTC midnight and renders a day early in western timezones — appending the
 * time forces local parsing.
 */
export function parseDate(s: string): Date {
  return new Date(s.length === 10 ? `${s}T00:00` : s)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Rule 3: an item is past the moment its instant is behind `now`. */
export function isPast(item: Milestone, now: Date): boolean {
  return parseDate(item.date).getTime() < now.getTime()
}

/**
 * Rule 2: all-day items count whole calendar days between local midnights;
 * timed items floor the hours. The two differ around DST and around any
 * partial day, which is exactly why they are not the same calculation.
 */
export function daysUntil(item: Milestone, now: Date): number {
  const target = parseDate(item.date)
  if (item.time) {
    return Math.floor((target.getTime() - now.getTime()) / MS_PER_HOUR / 24)
  }
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / MS_PER_DAY)
}

/** Hours remaining after the whole days are taken out. */
function hoursRemainder(item: Milestone, now: Date): number {
  const totalHours = (parseDate(item.date).getTime() - now.getTime()) / MS_PER_HOUR
  return Math.floor(totalHours - Math.floor(totalHours / 24) * 24)
}

export interface Countdown {
  /** The big Caprasimo number. */
  big: string
  /** The small unit line beneath it. */
  unit: string
}

/** See README.md → "Countdown copy". */
export function countdownCopy(item: Milestone, now: Date): Countdown {
  const days = daysUntil(item, now)
  const big = String(days)

  if (days >= 7) return { big, unit: 'days' }

  if (!item.time) {
    if (days === 0) return { big, unit: 'today' }
    return { big, unit: days === 1 ? 'day' : 'days' }
  }

  const hours = hoursRemainder(item, now)
  if (days === 0) return { big, unit: `today · ${hours}h` }
  return { big, unit: `days ${hours}h` }
}

/** Relative copy for the Past list: `today` / `yesterday` / `N days ago` / `N months ago`. */
export function relativeAgo(item: Milestone, now: Date): string {
  const days = Math.abs(daysUntil(item, now))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.round(days / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

function formatTime(d: Date): string {
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const meridiem = d.getHours() >= 12 ? 'PM' : 'AM'
  const hour = d.getHours() % 12 || 12
  return `${hour}:${minutes} ${meridiem}`
}

/** Row and hero: `Sat, Oct 3` — plus ` · 8:20 PM` when timed. */
export function formatWhen(item: Milestone): string {
  const d = parseDate(item.date)
  const base = `${DAYS[d.getDay()]}, ${SHORT[d.getMonth()]} ${d.getDate()}`
  return item.time ? `${base} · ${formatTime(d)}` : base
}

/** Detail: `Saturday, October 3, 2026` — plus ` at 8:20 PM` when timed. */
export function formatLongWhen(item: Milestone): string {
  const d = parseDate(item.date)
  const base = `${LONG_DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  return item.time ? `${base} at ${formatTime(d)}` : base
}

export interface MonthGroup {
  key: string
  /** `OCTOBER 2026` */
  heading: string
  /** `2 things` */
  count: string
  items: Milestone[]
}

/** Groups by calendar month, preserving the order the list arrives in. */
export function groupByMonth(items: Milestone[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const item of items) {
    const d = parseDate(item.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = {
        key,
        heading: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`.toUpperCase(),
        count: '',
        items: [],
      }
      groups.push(group)
    }
    group.items.push(item)
  }
  for (const group of groups) {
    group.count = pluralizeThings(group.items.length)
  }
  return groups
}

export function pluralizeThings(n: number): string {
  return `${n} ${n === 1 ? 'thing' : 'things'}`
}

/** Ascending by instant — the order Upcoming reads in. */
export function byDateAscending(a: Milestone, b: Milestone): number {
  return parseDate(a.date).getTime() - parseDate(b.date).getTime()
}
