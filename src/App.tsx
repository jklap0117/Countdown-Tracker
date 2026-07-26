import { ErrorBanner } from './components/ErrorBanner'
import { Fab } from './components/Fab'
import { TabBar } from './components/TabBar'
import { Add } from './screens/Add'
import { Detail } from './screens/Detail'
import { Past } from './screens/Past'
import { Sharing } from './screens/Sharing'
import { Upcoming } from './screens/Upcoming'
import { useApp } from './store/AppContext'

/** Chrome is hidden on Detail and Add — they are pushed/modal screens. */
const CHROME_SCREENS = new Set(['upcoming', 'past', 'share'])

export default function App() {
  const { state, dispatch } = useApp()
  const showChrome = CHROME_SCREENS.has(state.screen)

  return (
    <>
      {state.error !== null && (
        <ErrorBanner
          message={state.error}
          onDismiss={() => dispatch({ type: 'error/set', error: null })}
        />
      )}

      {state.screen === 'upcoming' && <Upcoming />}
      {state.screen === 'past' && <Past />}
      {state.screen === 'share' && <Sharing />}
      {state.screen === 'detail' && <Detail />}
      {state.screen === 'add' && <Add />}

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
