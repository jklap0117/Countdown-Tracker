import type { Milestone } from '../types'
import { requireSupabase } from '../lib/supabase'
import type { MilestoneStore } from './MilestoneStore'

const TABLE = 'milestones'

/** The database row. Column names differ from the client model — see below. */
interface MilestoneRow {
  id: string
  title: string
  cat: string
  /** `date` and `time` are type names in Postgres, so the columns are renamed. */
  occurs_at: string
  has_time: boolean
  who: Milestone['who']
  notes: string | null
  link: string | null
  remind: boolean
}

const COLUMNS = 'id, title, cat, occurs_at, has_time, who, notes, link, remind'

function toMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    title: row.title,
    cat: row.cat,
    date: row.occurs_at,
    time: row.has_time,
    who: row.who,
    notes: row.notes ?? undefined,
    link: row.link ?? undefined,
    remind: row.remind,
  }
}

/**
 * Only the fields present in `patch` are sent, so partial updates stay partial.
 *
 * `notes` and `link` test key presence rather than value, because they are the
 * two fields that can legitimately be cleared. The client model spells "no
 * note" as `undefined`, so a value test would read an intentional clear as
 * "field absent" and silently leave the old text in the database.
 */
function toRow(patch: Partial<Milestone>): Partial<MilestoneRow> {
  const row: Partial<MilestoneRow> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.cat !== undefined) row.cat = patch.cat
  if (patch.date !== undefined) row.occurs_at = patch.date
  if (patch.time !== undefined) row.has_time = patch.time
  if (patch.who !== undefined) row.who = patch.who
  if ('notes' in patch) row.notes = patch.notes ?? null
  if ('link' in patch) row.link = patch.link ?? null
  if (patch.remind !== undefined) row.remind = patch.remind
  return row
}

/**
 * Supabase-backed store. Two devices, one list.
 *
 * Nothing here enforces the sharing rules — that is row-level security's job
 * (see supabase/migrations/0001_init.sql). A private milestone is filtered out
 * by the database before it ever reaches this code, which is why the "not even
 * in counts" promise survives a hostile client.
 */
export function createSupabaseStore(): MilestoneStore {
  const client = requireSupabase()

  async function list(): Promise<Milestone[]> {
    const { data, error } = await client.from(TABLE).select(COLUMNS).order('occurs_at')
    if (error) throw new Error(`Failed to load milestones: ${error.message}`)
    return (data as MilestoneRow[]).map(toMilestone)
  }

  return {
    list,

    async add(milestone) {
      // `id` and `owner_id` are database defaults — gen_random_uuid() and
      // auth.uid(). Sending our own owner_id would just fail the INSERT policy.
      const { error } = await client.from(TABLE).insert(toRow(milestone))
      if (error) throw new Error(`Failed to add milestone: ${error.message}`)
    },

    async update(id, patch) {
      const { error } = await client.from(TABLE).update(toRow(patch)).eq('id', id)
      if (error) throw new Error(`Failed to update milestone: ${error.message}`)
    },

    async remove(id) {
      const { error } = await client.from(TABLE).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete milestone: ${error.message}`)
    },

    subscribe(onChange) {
      // Postgres change events are filtered through the same SELECT policy, so
      // the partner never receives an event for a private row. The payload is
      // ignored on purpose: refetching keeps ordering and policy filtering in
      // one place rather than reimplementing them against the event.
      const channel = client
        .channel('milestones-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
          void list().then(onChange).catch(() => {})
        })
        .subscribe()

      return () => {
        void client.removeChannel(channel)
      }
    },
  }
}
