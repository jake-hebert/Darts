import { useEffect, useState } from 'react'

const KEY = 'darts.game'

/** Game state that survives a refresh / app switch. Keyed by the game's id. */
export default function useSavedGame(id, init) {
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY))
      if (saved?.id === id && saved.state) return saved.state
    } catch {}
    return init()
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ id, state }))
    } catch {}
  }, [id, state])

  return [state, setState]
}
