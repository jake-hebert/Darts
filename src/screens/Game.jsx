import { getGame } from '../games.js'
import RealBaseball from './RealBaseball.jsx'
import Cricket from './Cricket.jsx'

const SCREENS = {
  'real-baseball': RealBaseball,
  cricket: Cricket,
  'super-cricket': Cricket,
}

export default function Game(props) {
  const Screen = SCREENS[props.config.gameId] ?? Placeholder
  return <Screen {...props} />
}

// Shown for games whose scoring screen isn't built yet.
function Placeholder({ config, onExit }) {
  const game = getGame(config.gameId)

  const describe = (opt) => {
    const v = config.options[opt.key]
    return opt.type === 'toggle' ? (v ? 'On' : 'Off') : v
  }

  return (
    <div className="screen game">
      <header className="topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Exit game">×</button>
        <h2>{game.name}</h2>
        <span className="icon-btn spacer" />
      </header>

      {config.teams ? (
        config.teams.map((team, ti) => (
          <section className="panel" key={ti}>
            <h3>
              <span className={`team-tag p${ti}`}>{team.name}</span>
            </h3>
            {team.players.map((name, i) => (
              <div className="player-row static" key={i}>
                <span className="order-num">{i + 1}</span>
                <span>{name}</span>
              </div>
            ))}
          </section>
        ))
      ) : (
        <section className="panel">
          <h3>Players</h3>
          {config.players.map((name, i) => (
            <div className="player-row static" key={i}>
              <span className={`dot p${i}`} />
              <span>{name}</span>
            </div>
          ))}
        </section>
      )}

      <section className="panel">
        <h3>Options</h3>
        {game.options.map((opt) => (
          <div className="option-row" key={opt.key}>
            <span>{opt.label}</span>
            <strong>{describe(opt)}</strong>
          </div>
        ))}
      </section>

      <p className="placeholder">Scoring screen coming next.</p>
    </div>
  )
}
