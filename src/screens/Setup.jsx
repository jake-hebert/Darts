import { useState } from 'react'
import {
  getGame,
  defaultOptions,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_PER_TEAM,
} from '../games.js'

const NAMES_KEY = 'darts.lastNames'
const teamsKey = (gameId) => `darts.lastTeams.${gameId}`
const modeKey = (gameId) => `darts.mode.${gameId}`

// Wording differs between baseball (batters) and everything else (throwers).
const TEAM_WORDS = {
  baseball: {
    defaults: ['Away', 'Home'],
    first: ['Bats first', 'Bats second'],
    order: 'Batting order',
    person: 'Batter',
  },
  other: {
    defaults: ['Team 1', 'Team 2'],
    first: ['Throws first', 'Throws second'],
    order: 'Throwing order',
    person: 'Player',
  },
}

function load(key, valid, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (valid(saved)) return saved
  } catch {}
  return fallback
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const loadNames = () =>
  load(
    NAMES_KEY,
    (s) => Array.isArray(s) && s.length >= MIN_PLAYERS,
    ['Player 1', 'Player 2']
  )

const loadTeams = (gameId, words) =>
  load(
    teamsKey(gameId),
    (s) => Array.isArray(s) && s.length === 2 && s.every((t) => t.players?.length),
    words.defaults.map((name, i) => ({ name, players: [`Player ${i + 1}`] }))
  )

const clean = (name, fallback) => name.trim() || fallback

export default function Setup({ gameId, onBack, onStart }) {
  const game = getGame(gameId)
  const words = gameId === 'real-baseball' ? TEAM_WORDS.baseball : TEAM_WORDS.other
  const [players, setPlayers] = useState(loadNames)
  const [teams, setTeams] = useState(() => loadTeams(gameId, words))
  const [mode, setMode] = useState(() =>
    game.teams === 'always'
      ? 'teams'
      : game.teams === 'optional'
        ? load(modeKey(gameId), (m) => m === 'singles' || m === 'teams', 'singles')
        : 'singles'
  )
  const [options, setOptions] = useState(() => defaultOptions(game))

  const setOption = (key, value) => setOptions((o) => ({ ...o, [key]: value }))

  const start = () => {
    if (game.teams === 'optional') save(modeKey(gameId), mode)
    if (mode === 'teams') {
      const t = teams.map((team, ti) => ({
        name: clean(team.name, words.defaults[ti]),
        players: team.players.map((n, i) => clean(n, `${words.person} ${i + 1}`)),
      }))
      save(teamsKey(gameId), t)
      onStart({ gameId, mode, teams: t, options })
    } else {
      const names = players.map((n, i) => clean(n, `Player ${i + 1}`))
      save(NAMES_KEY, names)
      onStart({ gameId, mode, players: names, options })
    }
  }

  return (
    <div className="screen setup">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">‹</button>
        <h2>{game.name}</h2>
        <span className="icon-btn spacer" />
      </header>

      {game.teams === 'optional' && (
        <div className="segmented mode-switch">
          {['singles', 'teams'].map((m) => (
            <button
              key={m}
              className={mode === m ? 'active' : ''}
              onClick={() => setMode(m)}
            >
              {m === 'singles' ? 'Singles' : 'Teams'}
            </button>
          ))}
        </div>
      )}

      {mode === 'teams' ? (
        teams.map((team, ti) => (
          <TeamPanel
            key={ti}
            index={ti}
            team={team}
            words={words}
            onChange={(next) =>
              setTeams((all) => all.map((t, j) => (j === ti ? next : t)))
            }
          />
        ))
      ) : (
        <section className="panel">
          <h3>Players</h3>
          <NameList
            names={players}
            onChange={setPlayers}
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            dotFor={(i) => i}
            newName={(n) => `Player ${n + 1}`}
            addLabel="+ Add player"
          />
        </section>
      )}

      {game.options.length > 0 && (
        <section className="panel">
          <h3>Options</h3>
          {game.options.map((opt) => (
            <div className="option-row" key={opt.key}>
              <div className="option-label">
                <span>{opt.label}</span>
                {opt.hint && <small>{opt.hint}</small>}
              </div>
              {opt.type === 'toggle' ? (
                <button
                  role="switch"
                  aria-checked={options[opt.key]}
                  className={`switch ${options[opt.key] ? 'on' : ''}`}
                  onClick={() => setOption(opt.key, !options[opt.key])}
                >
                  <span />
                </button>
              ) : (
                <div className="segmented">
                  {opt.choices.map((c) => (
                    <button
                      key={c}
                      className={options[opt.key] === c ? 'active' : ''}
                      onClick={() => setOption(opt.key, c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <div className="bottom-bar">
        <button className="primary-btn" onClick={start}>Start game</button>
      </div>
    </div>
  )
}

function TeamPanel({ index, team, words, onChange }) {
  return (
    <section className="panel">
      <div className="team-head">
        <span className={`dot p${index}`} />
        <input
          className="team-name"
          value={team.name}
          onChange={(e) => onChange({ ...team, name: e.target.value })}
          onFocus={(e) => e.target.select()}
          maxLength={16}
          enterKeyHint="done"
          aria-label={`Team ${index + 1} name`}
        />
        <small>{words.first[index]}</small>
      </div>
      <h3>{words.order}</h3>
      <NameList
        names={team.players}
        onChange={(players) => onChange({ ...team, players })}
        min={1}
        max={MAX_PER_TEAM}
        numbered
        reorder
        newName={(n) => `${words.person} ${n + 1}`}
        addLabel={`+ Add ${words.person.toLowerCase()}`}
      />
    </section>
  )
}

function NameList({ names, onChange, min, max, dotFor, numbered, reorder, newName, addLabel }) {
  const update = (fn) => onChange(fn(names))
  const setName = (i, name) => update((p) => p.map((n, j) => (j === i ? name : n)))
  const remove = (i) => update((p) => p.filter((_, j) => j !== i))
  const add = () => update((p) => [...p, newName(p.length)])
  const moveUp = (i) =>
    update((p) => {
      const next = [...p]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })

  return (
    <>
      {names.map((name, i) => (
        <div className="player-row" key={i}>
          {numbered ? (
            <span className="order-num">{i + 1}</span>
          ) : (
            <span className={`dot p${dotFor(i)}`} />
          )}
          <input
            value={name}
            onChange={(e) => setName(i, e.target.value)}
            onFocus={(e) => e.target.select()}
            maxLength={16}
            enterKeyHint="done"
          />
          {reorder && names.length > 1 && (
            <button
              className="icon-btn small"
              onClick={() => moveUp(i)}
              disabled={i === 0}
              aria-label={`Move ${name} up`}
            >
              ↑
            </button>
          )}
          {names.length > min && (
            <button
              className="icon-btn small"
              onClick={() => remove(i)}
              aria-label={`Remove ${name}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {names.length < max && (
        <button className="ghost-btn" onClick={add}>{addLabel}</button>
      )}
    </>
  )
}
