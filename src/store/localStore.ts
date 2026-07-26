import type { Milestone } from '../types'
import { SEED_MILESTONES, USE_SEED_DATA } from '../data/seed'
import type { MilestoneStore } from './MilestoneStore'

const KEY = 'countdown-tracker.milestones'

function read(): Milestone[] {
  const raw = localStorage.getItem(KEY)
  if (raw === null) {
    // First run. In dev, plant the sample content; in production, start empty.
    const initial = USE_SEED_DATA ? SEED_MILESTONES : []
    write(initial)
    return initial
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Milestone[]) : []
  } catch {
    // Corrupt payload shouldn't wedge the app on every load.
    return []
  }
}

function write(milestones: Milestone[]): void {
  localStorage.setItem(KEY, JSON.stringify(milestones))
}

/** localStorage-backed store. Single-device only — no sync. */
export function createLocalStore(): MilestoneStore {
  const listeners = new Set<(milestones: Milestone[]) => void>()

  const emit = () => {
    const milestones = read()
    for (const listener of listeners) listener(milestones)
  }

  return {
    async list() {
      return read()
    },

    async add(milestone) {
      write([...read(), milestone])
      emit()
    },

    async update(id, patch) {
      write(read().map((m) => (m.id === id ? { ...m, ...patch } : m)))
      emit()
    },

    async remove(id) {
      write(read().filter((m) => m.id !== id))
      emit()
    },

    subscribe(onChange) {
      listeners.add(onChange)
      // Another tab writing the same key counts as a change.
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) onChange(read())
      }
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onChange)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}
