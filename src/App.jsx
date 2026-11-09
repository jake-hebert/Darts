import { useEffect, useState } from 'react'
import Home from './screens/Home.jsx'
import Setup from './screens/Setup.jsx'
import Game from './screens/Game.jsx'

// screen: { name: 'home' } | { name: 'setup', gameId } | { name: 'game', config }
const STORAGE_KEY = 'darts.screen.v2'

function loadScreen() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.name) return saved
  } catch {}
  return { name: 'home' }
}

export default function App() {
  const [screen, setScreen] = useState(loadScreen)

  // Remember where we are so a phone refresh / app switch doesn't lose a game.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(screen))
    } catch {}
  }, [screen])

  const goHome = () => setScreen({ name: 'home' })

  switch (screen.name) {
    case 'setup':
      return (
        <Setup
          gameId={screen.gameId}
          onBack={goHome}
          onStart={(config) =>
            setScreen({ name: 'game', config: { ...config, id: Date.now() } })
          }
        />
      )
    case 'game':
      return (
        <Game
          key={screen.config.id}
          config={screen.config}
          onExit={goHome}
          onRestart={() =>
            setScreen({ name: 'game', config: { ...screen.config, id: Date.now() } })
          }
        />
      )
    default:
      return <Home onPick={(gameId) => setScreen({ name: 'setup', gameId })} />
  }
}
