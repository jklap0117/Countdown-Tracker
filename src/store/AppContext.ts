import { createContext, useContext } from 'react'
import type { AppAction, AppState } from './appReducer'

export interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (value === null) throw new Error('useApp must be used inside <AppProvider>')
  return value
}
