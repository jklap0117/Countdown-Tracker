import { ErrorBanner } from './components/ErrorBanner'
import { Fab } from './components/Fab'
import { TabBar } from './components/TabBar'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { Stub } from './screens/Stub'
import { Upcoming } from './screens/Upcoming'
import { useApp } from './store/AppContext'
import styles from './screens/Screen.module.css'

/** Chrome is hidden on Detail and Add — they are pushed/modal screens. */
const CHROME_SCREENS = new Set(['upcoming', 'past', 'share'])

export default function App() {
  const { state, dispatch } = useApp()
  const showChrome = CHROME_SCREENS.has(state.screen)
  const goHome = () => dispatch({ type: 'screen/set', screen: 'upcoming' })

  return (
    <>
      {state.error !== null && (
        <ErrorBanner
          message={state.error}
          onDismiss={() => dispatch({ type: 'error/set', error: null })}
        />
      )}

      {state.screen === 'upcoming' && <Upcoming />}
      {state.screen === 'past' && (
        <Stub title="Looking back" note="The Past screen isn't built yet." />
      )}
      {state.screen === 'share' && (
        <Stub
          title="Sharing"
          note={
            isSupabaseConfigured
              ? 'The Sharing screen isn’t built yet — syncing through Supabase.'
              : 'The Sharing screen isn’t built yet — running on this device only.'
          }
        >
          {isSupabaseConfigured && (
            <div className={styles.header}>
              <button
                type="button"
                className={styles.back}
                onClick={() => void supabase?.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          )}
        </Stub>
      )}
      {state.screen === 'detail' && (
        <Stub title="Detail" note="The Detail screen isn't built yet." onBack={goHome} />
      )}
      {state.screen === 'add' && (
        <Stub title="New milestone" note="The Add screen isn't built yet." onBack={goHome} />
      )}

      {showChrome && (
        <>
          <Fab onClick={() => dispatch({ type: 'screen/set', screen: 'add' })} />
          <TabBar
            screen={state.screen}
            onChange={(screen) => dispatch({ type: 'screen/set', screen })}
          />
        </>
      )}
    </>
  )
}
