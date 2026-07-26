import type { Milestone } from '../types'

/**
 * The seam between the screens and wherever milestones actually live.
 *
 * Today that's localStorage. Next it's Supabase, where the sharing rules are
 * enforced by row-level security — the handoff is explicit that "private
 * milestones never leave your phone, not even in counts" has to hold at the
 * database, not just in the UI. Everything returns a promise so that swap
 * doesn't change a single call site.
 */
export interface MilestoneStore {
  list(): Promise<Milestone[]>
  add(milestone: Milestone): Promise<void>
  update(id: string, patch: Partial<Milestone>): Promise<void>
  remove(id: string): Promise<void>
  /** Fires whenever the underlying data changes. Returns an unsubscribe fn. */
  subscribe(onChange: (milestones: Milestone[]) => void): () => void
}
