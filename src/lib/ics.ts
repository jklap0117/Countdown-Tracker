/**
 * iCalendar (RFC 5545) export for a single milestone.
 *
 * The OS calendar handles the alarm, so this gives real reminders with no
 * server, no account and no push permission.
 */

import type { Milestone } from '../types'
import { parseDate } from './date'

/** Reminders fire the day before at 9:00 AM local. */
const REMINDER_HOUR = 9

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** `20261003` — a floating calendar date, no time zone. */
function formatDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

/**
 * `20261003T202000` — local time with no `Z` and no `TZID`, which iCalendar
 * calls a floating time. "8:20 PM" means 8:20 PM wherever the calendar is
 * read; pinning it to UTC is what shifts all-day events a day.
 */
function formatLocalDateTime(d: Date): string {
  return `${formatDate(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** `20261002T130000Z` — an absolute instant, used for DTSTAMP and the alarm. */
function formatUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** Backslash, semicolon, comma and newline all carry meaning in a property value. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** RFC 5545 caps a content line at 75 octets; continuations start with a space. */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = [line.slice(0, 75)]
  let rest = line.slice(75)
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  if (rest.length > 0) parts.push(` ${rest}`)
  return parts.join('\r\n')
}

/**
 * 9:00 AM local on the day before the milestone.
 *
 * Deliberately absolute rather than a relative `TRIGGER:-P1D`: an all-day
 * milestone starts at midnight, so a relative trigger would wake you at
 * midnight instead of over breakfast.
 */
function alarmInstant(target: Date): Date {
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate() - 1,
    REMINDER_HOUR,
    0,
    0,
    0,
  )
}

export function buildIcs(item: Milestone, now: Date = new Date()): string {
  const start = parseDate(item.date)
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Milestone Tracker//Countdown//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${item.id}@milestone-tracker`,
    `DTSTAMP:${formatUtc(now)}`,
  ]

  if (item.time) {
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    lines.push(`DTSTART:${formatLocalDateTime(start)}`, `DTEND:${formatLocalDateTime(end)}`)
  } else {
    // An all-day event's DTEND is exclusive — the day after.
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
    lines.push(`DTSTART;VALUE=DATE:${formatDate(start)}`, `DTEND;VALUE=DATE:${formatDate(end)}`)
  }

  lines.push(`SUMMARY:${escapeText(item.title)}`)
  if (item.notes !== undefined && item.notes !== '') {
    lines.push(`DESCRIPTION:${escapeText(item.notes)}`)
  }
  if (item.link !== undefined && item.link !== '') {
    lines.push(`URL:${escapeText(item.link)}`)
  }

  if (item.remind !== false) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(item.title)} is tomorrow`,
      `TRIGGER;VALUE=DATE-TIME:${formatUtc(alarmInstant(start))}`,
      'END:VALARM',
    )
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n')
}

export function icsFilename(item: Milestone): string {
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug === '' ? 'milestone' : slug}.ics`
}

/** Hands the file to the OS. On iOS this opens Calendar's "Add Event" sheet. */
export function downloadIcs(item: Milestone): void {
  const blob = new Blob([buildIcs(item)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = icsFilename(item)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
