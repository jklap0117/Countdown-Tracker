import { Fab } from './components/Fab'
import { TabBar } from './components/TabBar'
import { Stub } from './screens/Stub'
import { Upcoming } from './screens/Upcoming'
import { useApp } from './store/AppContext'

/** Chrome is hidden on Detail and Add — they are pushed/modal screens. */
const CHROME_SCREENS = new Set(['upcoming', 'past', 'share'])

export default function App() {
  const { state, dispatch } = useApp()
  const showChrome = CHROME_SCREENS.has(state.screen)

  return (
    <>
      {state.screen === 'upcoming' && <Upcoming />}
      {state.screen === 'past' && (
        <Stub title="Looking back" note="The Past screen isn't built yet." />
      )}
      {state.screen === 'share' && (
        <Stub title="Sharing" note="The Sharing screen isn't built yet." />
      )}
      {state.screen === 'detail' && (
        <Stub
          title="Detail"
          note="The Detail screen isn't built yet."
          onBack={() => dispatch({ type: 'screen/set', screen: 'upcoming' })}
        />
      )}
      {state.screen === 'add' && (
        <Stub
          title="New milestone"
          note="The Add screen isn't built yet."
          onBack={() => dispatch({ type: 'screen/set', screen: 'upcoming' })}
        />
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
