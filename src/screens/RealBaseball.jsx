import useSavedGame from '../useSavedGame.js'
import {
  newGame,
  play,
  undo,
  totalRuns,
  hasRunners,
} from '../games/realBaseball.js'

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function RealBaseball({ config, onExit, onRestart }) {
  const [s, setS] = useSavedGame(config.id, () => newGame(config))
  const names = config.teams.map((t) => t.name)
  const hitterName = (team, i) => config.teams[team].players[i]
  const sacBunt = config.options.sacBunt
  const target = ((s.inning - 1) % 20) + 1
  const doublePlayOn = hasRunners(s) && s.outs < 2

  const act = (outcome) => {
    navigator.vibrate?.(15)
    setS((cur) => play(cur, outcome))
  }

  const exit = () => {
    if (s.over || !s.history.length || confirm('Leave this game?')) onExit()
  }

  const half = `${s.batter === 0 ? 'Top' : 'Bottom'} ${ordinal(s.inning)}`

  return (
    <div className="screen game baseball">
      <header className="topbar">
        <button className="icon-btn" onClick={exit} aria-label="Exit game">×</button>
        <h2>Real Baseball</h2>
        <button
          className="icon-btn undo"
          onClick={() => setS(undo)}
          disabled={!s.history.length}
          aria-label="Undo"
        >
          ↶
        </button>
      </header>

      <LineScore s={s} names={names} />

      {s.over ? (
        <GameOver s={s} names={names} onRestart={onRestart} onExit={onExit} />
      ) : (
        <>
          <section className="situation panel">
            <div className="sit-left">
              <div className="sit-half">
                {half} · <span className={`team-tag p${s.batter}`}>{names[s.batter]}</span>
              </div>
              <div className="sit-batter">{hitterName(s.batter, s.up[s.batter])}</div>
              <Outs outs={s.outs} />
            </div>
            <div className="sit-target">
              <small>Aim</small>
              <strong>{target}</strong>
            </div>
            <Diamond bases={s.bases} />
          </section>

          <div className="last-play">
            {s.lastPlay ? (
              <>
                <span className={`dot p${s.lastPlay.batter}`} />
                {hitterName(s.lastPlay.batter, s.lastPlay.hitter)}: {s.lastPlay.label}
                {s.lastPlay.scored > 0 &&
                  ` · ${s.lastPlay.scored} run${s.lastPlay.scored > 1 ? 's' : ''} score${s.lastPlay.scored > 1 ? '' : 's'}`}
              </>
            ) : (
              'Play ball!'
            )}
          </div>

          <div className="pad">
            <button className="pad-btn hit" onClick={() => act('single')}>
              Single
            </button>
            <button className="pad-btn hit" onClick={() => act('double')}>
              Double
            </button>
            <button className="pad-btn hit" onClick={() => act('triple')}>
              Triple
            </button>
            <button className="pad-btn homer wide" onClick={() => act('homer')}>
              Home run <small>bull</small>
            </button>
            <button className="pad-btn out half" onClick={() => act('out')}>
              Out <small>missed slice</small>
            </button>
            <button className="pad-btn out half" onClick={() => act('offboard')}>
              {doublePlayOn ? 'Double play' : 'Out'} <small>off board</small>
            </button>
            {sacBunt && (
              <>
                <button
                  className="pad-btn bunt wide"
                  onClick={() => act('bunt')}
                  disabled={!hasRunners(s)}
                >
                  Sac bunt <small>hit beside the slice · runners up 1</small>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function LineScore({ s, names }) {
  const cols = Math.max(s.innings, s.inning)
  const innings = Array.from({ length: cols }, (_, i) => i + 1)
  return (
    <div className="linescore-wrap">
      <table className="linescore">
        <thead>
          <tr>
            <th className="ls-name" />
            {innings.map((n) => (
              <th key={n} className={n === s.inning && !s.over ? 'now' : ''}>
                {n}
              </th>
            ))}
            <th className="ls-total">R</th>
          </tr>
        </thead>
        <tbody>
          {names.map((name, p) => (
            <tr key={p} className={p === s.batter && !s.over ? 'batting' : ''}>
              <td className="ls-name">
                <span className={`dot p${p}`} />
                <span>{name}</span>
              </td>
              {innings.map((n) => {
                const r = s.runs[p][n - 1]
                const live = !s.over && n === s.inning && p === s.batter
                return (
                  <td key={n} className={live ? 'live' : ''}>
                    {r ?? (s.over && n <= s.inning ? 'x' : '')}
                  </td>
                )
              })}
              <td className="ls-total">{totalRuns(s, p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Outs({ outs }) {
  return (
    <div className="outs" aria-label={`${outs} out${outs === 1 ? '' : 's'}`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < outs ? 'on' : ''} />
      ))}
      <small>{outs} out{outs === 1 ? '' : 's'}</small>
    </div>
  )
}

function Diamond({ bases }) {
  // 1st right, 2nd top, 3rd left, home bottom
  const pos = [
    [78, 50],
    [50, 22],
    [22, 50],
  ]
  return (
    <svg className="diamond" viewBox="0 0 100 100" aria-label="Bases">
      <path d="M50 78 L78 50 L50 22 L22 50 Z" className="basepath" />
      {pos.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 9}
          y={y - 9}
          width="18"
          height="18"
          transform={`rotate(45 ${x} ${y})`}
          className={bases[i] ? 'base on' : 'base'}
        />
      ))}
      <path d="M44 72 L56 72 L56 78 L50 84 L44 78 Z" className="home" />
    </svg>
  )
}

function GameOver({ s, names, onRestart, onExit }) {
  const scores = names
    .map((name, p) => ({ name, p, r: totalRuns(s, p) }))
    .sort((a, b) => b.r - a.r)
  return (
    <section className="panel game-over">
      <div className="go-title">
        <span className={`dot p${s.winner}`} />
        {names[s.winner]} wins!
      </div>
      <div className="go-score">{scores.map((x) => x.r).join(' – ')}</div>
      <div className="go-actions">
        <button className="primary-btn" onClick={onRestart}>Play again</button>
        <button className="ghost-btn" onClick={onExit}>Home</button>
      </div>
    </section>
  )
}
