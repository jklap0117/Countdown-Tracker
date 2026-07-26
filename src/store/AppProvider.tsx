import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { AppContext } from './AppContext'
import { appReducer, initialState } from './appReducer'
import { createLocalStore } from './localStore'
import type { MilestoneStore } from './MilestoneStore'

const TICK_MS = 60_000

export function AppProvider({
  children,
  store,
}: {
  children: ReactNode
  /** Injectable so the Supabase store can drop in without touching screens. */
  store?: MilestoneStore
}) {
  const milestoneStore = useMemo(() => store ?? createLocalStore(), [store])
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    let active = true
    void milestoneStore
      .list()
      .then((items) => {
        if (active) dispatch({ type: 'items/loaded', items })
      })
      .catch((cause: unknown) => {
        if (!active) return
        const message = cause instanceof Error ? cause.message : String(cause)
        dispatch({ type: 'error/set', error: message })
      })
    const unsubscribe = milestoneStore.subscribe((items) => {
      dispatch({ type: 'items/loaded', items })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [milestoneStore])

  // Countdowns re-tick every 60s; anything crossing its instant moves from
  // Upcoming to Past on the next tick.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'now/tick', now: new Date() }), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
