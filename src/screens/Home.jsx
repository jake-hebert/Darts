import { GAMES } from '../games.js'

export default function Home({ onPick }) {
  return (
    <div className="screen home">
      <header className="home-header">
        <img src="/icon.svg" alt="" className="home-logo" />
        <h1>Darts</h1>
      </header>

      <nav className="game-list">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`game-card accent-${g.accent}`}
            onClick={() => onPick(g.id)}
          >
            <span className="game-name">{g.name}</span>
            <span className="game-blurb">{g.blurb}</span>
            <span className="chevron" aria-hidden>›</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
