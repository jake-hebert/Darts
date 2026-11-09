import { useState } from 'react'
import useSavedGame from '../useSavedGame.js'
import { getGame } from '../games.js'
import {
  newGame,
  throwDart,
  endTurn,
  undo,
  isClosed,
  dartLabel,
  BONUS_TARGETS,
  TARGET_LABELS,
  DARTS_PER_TURN,
} from '../games/cricket.js'

// Super Cricket keypad: every number (bonus targets count on any of them) + bull.
const KEYPAD = [...Array.from({ length: 20 }, (_, i) => i + 1), 25]

export default function Cricket({ config, onExit, onRestart }) {
  const game = getGame(config.gameId)
  const [s, setS] = useSavedGame(config.id, () => newGame(config))
  const [mult, setMult] = useState(1)

  const sides = config.teams ?? config.players.map((p) => ({ name: p, players: [p] }))
  const isTeams = !!config.teams
  const isSuper = config.gameId === 'super-cricket'
  const throwerName = (side, i) => sides[side].players[i]

  const hit = (n) => {
    navigator.vibrate?.(15)
    setS((cur) => throwDart(cur, { n, m: n === 0 ? 1 : mult }))
    setMult(1)
  }
  const toggleMult = (m) => setMult((cur) => (cur === m ? 1 : m))
  const exit = () => {
    if (s.over || !s.history.length || confirm('Leave this game?')) onExit()
  }

  // Two sides: classic layout with the number in the middle.
  const classic = s.sides === 2
  const columns = classic
    ? [{ side: 0 }, { target: true }, { side: 1 }]
    : [{ target: true }, ...sides.map((_, i) => ({ side: i }))]

  const gridStyle = {
    gridTemplateColumns: columns.map((c) => (c.target ? '1.3fr' : '1fr')).join(' '),
  }

  return (
    <div className={`screen game cricket ${isSuper ? 'super' : ''}`}>
      <header className="topbar">
        <button className="icon-btn" onClick={exit} aria-label="Exit game">×</button>
        <h2>{game.name}</h2>
        <button
          className="icon-btn undo"
          onClick={() => setS(undo)}
          disabled={!s.history.length}
          aria-label="Undo"
        >
          ↶
        </button>
      </header>

      <div className="board">
        <div className="board-row head" style={gridStyle}>
          {columns.map((c, i) =>
            c.target ? (
              <div key={i} />
            ) : (
              <div
                key={i}
                className={`side-head ${!s.over && s.side === c.side ? 'active' : ''}`}
              >
                <span className={`team-tag p${c.side}`}>{sides[c.side].name}</span>
                {s.points && <strong>{s.score[c.side]}</strong>}
              </div>
            )
          )}
        </div>

        {s.targets.map((t) => {
          const bonus = BONUS_TARGETS.includes(t)
          const dead = s.marks[t].every((m) => m >= 3)
          const disabled = s.over || bonus || (t === '25' && mult === 3)
          const Row = bonus ? 'div' : 'button'
          return (
            <Row
              key={t}
              className={`board-row ${bonus ? 'bonus' : 'tap'} ${dead ? 'dead' : ''}`}
              style={gridStyle}
              {...(!bonus && { onClick: () => hit(Number(t)), disabled })}
            >
              {columns.map((c, i) =>
                c.target ? (
                  <div key={i} className="target">
                    {TARGET_LABELS[t] ?? t}
                  </div>
                ) : (
                  <div key={i} className="marks-cell">
                    <Marks n={s.marks[t][c.side]} />
                  </div>
                )
              )}
            </Row>
          )
        })}
      </div>

      {s.over ? (
        <section className="panel game-over">
          <div className="go-title">
            <span className={`dot p${s.winner}`} />
            {sides[s.winner].name} wins!
          </div>
          {s.points && (
            <div className="go-score">
              {[...s.score].sort((a, b) => b - a).join(' – ')}
            </div>
          )}
          <div className="go-actions">
            <button className="primary-btn" onClick={onRestart}>Play again</button>
            <button className="ghost-btn" onClick={onExit}>Home</button>
          </div>
        </section>
      ) : (
        <>
          <div className="turn-strip">
            <div className="turn-who">
              {isTeams && (
                <span className={`team-tag p${s.side}`}>{sides[s.side].name}</span>
              )}
              <strong>{throwerName(s.side, s.up[s.side])}</strong>
            </div>
            <div className="turn-darts">
              {Array.from({ length: DARTS_PER_TURN }, (_, i) => (
                <span key={i} className={s.darts[i] ? 'thrown' : ''}>
                  {s.darts[i] ? dartLabel(s.darts[i]) : ''}
                </span>
              ))}
            </div>
          </div>

          {!s.lastTurn && !s.darts.length && (
            <div className="last-play">
              {isSuper
                ? 'Double / Triple first, then the number'
                : 'Tap a number to score · Double / Triple first'}
            </div>
          )}

          {s.lastTurn && !s.darts.length && (
            <div className="last-play">
              <span className={`dot p${s.lastTurn.side}`} />
              {throwerName(s.lastTurn.side, s.lastTurn.thrower)}:{' '}
              {s.lastTurn.darts.length
                ? s.lastTurn.darts.map(dartLabel).join(', ')
                : 'no score'}
            </div>
          )}

          <div className="ck-pad">
            <button
              className={`pad-btn mult ${mult === 2 ? 'armed' : ''}`}
              onClick={() => toggleMult(2)}
            >
              Double
            </button>
            <button
              className={`pad-btn mult ${mult === 3 ? 'armed' : ''}`}
              onClick={() => toggleMult(3)}
            >
              Triple
            </button>
            <button className="pad-btn out" onClick={() => hit(0)}>Miss</button>
            <button className="pad-btn out" onClick={() => setS(endTurn)}>
              End turn
            </button>
          </div>

          {isSuper && (
            <div className="keypad">
              {KEYPAD.map((n) => (
                <button
                  key={n}
                  className={n >= 15 ? 'cricket-num' : ''}
                  onClick={() => hit(n)}
                  disabled={n === 25 && mult === 3}
                >
                  {n === 25 ? 'Bull' : n}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Marks({ n }) {
  if (!n) return null
  return (
    <svg className={`marks m${n}`} viewBox="0 0 24 24" aria-label={`${n} marks`}>
      <line x1="5" y1="19" x2="19" y2="5" />
      {n >= 2 && <line x1="5" y1="5" x2="19" y2="19" />}
      {n >= 3 && <circle cx="12" cy="12" r="10" />}
    </svg>
  )
}
