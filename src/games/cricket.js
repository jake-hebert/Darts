// Cricket & Super Cricket — pure scoring engine (no React).
//
// Targets 20–15 and bull, 3 marks each to close. Darts are entered one at a time
// as { n, m }: n = 1–20, 25 (bull) or 0 (miss); m = 1 single, 2 double, 3 triple
// (bull: 1 = outer, 2 = bullseye).
//
// Super Cricket adds three bonus targets, also 3 marks each:
//   T  — any triple on any number = 1 mark
//   D  — any double on any number (incl. bullseye) = 1 mark
//   3B — "3 in a bed": all 3 darts of a turn in the same number = 1 mark
// One dart can count toward several targets: three triple 20s close 20, close
// Triples, and add a 3-in-a-bed mark.
//
// Points (optional): marks past closing score the number's value while any
// opponent still has it open. Bonus targets never score points.
// Win: close everything (and, with points, have at least as many as everyone).
//
// Sides are individual players (singles) or two teams with a throwing order.

export const NUMBER_TARGETS = ['20', '19', '18', '17', '16', '15', '25']
export const BONUS_TARGETS = ['3B', 'T', 'D']
export const TARGET_LABELS = { 25: 'Bull', '3B': '3 in a bed', T: 'Triples', D: 'Doubles' }
export const DARTS_PER_TURN = 3

export function newGame({ teams, players, options, gameId }) {
  const sides = teams ?? players.map((p) => ({ name: p, players: [p] }))
  const targets = gameId === 'super-cricket' ? [...NUMBER_TARGETS, ...BONUS_TARGETS] : NUMBER_TARGETS
  return {
    targets,
    points: !!options.points,
    sides: sides.length,
    lineups: sides.map((t) => t.players.length),
    up: sides.map(() => 0), // index into each side's throwing order
    side: 0, // side currently throwing
    darts: [], // darts thrown so far this turn
    marks: Object.fromEntries(targets.map((t) => [t, sides.map(() => 0)])),
    score: sides.map(() => 0),
    lastTurn: null,
    over: false,
    winner: null,
    history: [],
  }
}

export const isClosed = (s, target, side) => s.marks[target][side] >= 3

export function dartLabel({ n, m }) {
  if (n === 0) return 'Miss'
  if (n === 25) return m === 2 ? 'Bull×2' : 'Bull'
  return `${['', '', 'D', 'T'][m]}${n}`
}

function addMarks(s, target, count) {
  if (!s.targets.includes(target) || count <= 0) return
  const row = s.marks[target]
  const before = row[s.side]
  const extra = Math.max(0, before + count - 3)
  row[s.side] = Math.min(3, before + count)
  const scoring = s.points && !BONUS_TARGETS.includes(target)
  const opponentOpen = row.some((m, i) => i !== s.side && m < 3)
  if (scoring && extra && opponentOpen) s.score[s.side] += extra * Number(target)
}

function hasWon(s, side) {
  if (!s.targets.every((t) => isClosed(s, t, side))) return false
  if (!s.points) return true
  return s.score.every((p, i) => i === side || s.score[side] >= p)
}

const clone = (s) => ({
  ...s,
  darts: [...s.darts],
  marks: Object.fromEntries(Object.entries(s.marks).map(([k, v]) => [k, [...v]])),
  score: [...s.score],
  up: [...s.up],
})

export function throwDart(s, dart) {
  if (s.over || s.darts.length >= DARTS_PER_TURN) return s
  const next = clone(s)
  next.history = [...s.history, { ...s, history: undefined }]
  const { n, m } = dart

  if (n) addMarks(next, String(n), m)
  if (m === 3) addMarks(next, 'T', 1)
  if (m === 2 && n) addMarks(next, 'D', 1)
  next.darts.push(dart)

  const d = next.darts
  if (d.length === DARTS_PER_TURN && d[0].n && d.every((x) => x.n === d[0].n)) {
    addMarks(next, '3B', 1)
  }

  if (hasWon(next, next.side)) {
    next.over = true
    next.winner = next.side
    return next
  }
  return d.length === DARTS_PER_TURN ? passTurn(next) : next
}

/** End the turn now (remaining darts count as misses). */
export function endTurn(s) {
  if (s.over) return s
  const next = clone(s)
  next.history = [...s.history, { ...s, history: undefined }]
  return passTurn(next)
}

function passTurn(s) {
  s.lastTurn = { side: s.side, thrower: s.up[s.side], darts: s.darts }
  s.up[s.side] = (s.up[s.side] + 1) % s.lineups[s.side]
  s.side = (s.side + 1) % s.sides
  s.darts = []
  return s
}

export function undo(s) {
  if (!s.history.length) return s
  const prev = s.history[s.history.length - 1]
  return { ...prev, history: s.history.slice(0, -1) }
}
