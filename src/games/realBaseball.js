// Real Baseball — pure scoring engine (no React).
//
// Two teams. Each inning N, each team takes a half-inning aiming at slice N until
// 3 outs. Every dart is one at-bat; the team's batting order carries over innings.
//   single / double / triple: batter takes that base, runners advance hit + 1
//   homer (either bull):      everyone scores
//   out (miss on the board):  1 out
//   offboard (miss off board, any throw incl. a bunt): double play (batter + lead
//                              runner) if anyone is on and fewer than 2 outs; else 1 out
//   bunt (sac, hit either side of the slice): batter out, runners advance 1
//                              (a bunt that misses on the board is just an 'out')
// Ends after the final inning when one team leads; ties go to extra innings.
// The home team (bats second) gets a walk-off, and skips the bottom of the
// final inning if already ahead.

export const OUTCOMES = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  homer: 'Home run',
  out: 'Out',
  offboard: 'Off board',
  bunt: 'Sac bunt',
}

export function newGame({ teams, options }) {
  const runs = teams.map(() => [])
  runs[0][0] = 0
  return {
    players: teams.length, // number of teams (sides)
    lineups: teams.map((t) => t.players.length),
    up: teams.map(() => 0), // index into each team's batting order
    innings: options.innings,
    inning: 1,
    batter: 0, // team currently at bat
    outs: 0,
    bases: [false, false, false], // 1st, 2nd, 3rd
    runs, // runs[team][inning - 1]; undefined = hasn't batted yet
    lastPlay: null,
    over: false,
    winner: null,
    history: [],
  }
}

export const totalRuns = (s, p) => s.runs[p].reduce((a, b) => a + (b || 0), 0)

export const hasRunners = (s) => s.bases.some(Boolean)

/** Index of the team strictly ahead of everyone else, or null on a tie. */
export function leader(s) {
  const totals = s.runs.map((_, p) => totalRuns(s, p))
  const max = Math.max(...totals)
  return totals.filter((t) => t === max).length === 1 ? totals.indexOf(max) : null
}

function advanceRunners(bases, by) {
  const next = [false, false, false]
  let scored = 0
  for (let i = 2; i >= 0; i--) {
    if (!bases[i]) continue
    if (i + by >= 3) scored++
    else next[i + by] = true
  }
  return { bases: next, scored }
}

export function play(s, outcome) {
  if (s.over) return s
  const snapshot = { ...s, history: undefined }
  let { bases, outs } = s
  let scored = 0
  let label = OUTCOMES[outcome]

  switch (outcome) {
    case 'single':
    case 'double':
    case 'triple': {
      const hit = { single: 1, double: 2, triple: 3 }[outcome]
      ;({ bases, scored } = advanceRunners(bases, hit + 1))
      bases[hit - 1] = true
      break
    }
    case 'homer':
      scored = bases.filter(Boolean).length + 1
      bases = [false, false, false]
      break
    case 'out':
      outs += 1
      break
    case 'offboard':
      if (hasRunners(s) && outs < 2) {
        outs += 2
        bases = [...bases]
        bases[bases.lastIndexOf(true)] = false // lead runner
        label = 'Double play'
      } else {
        outs += 1
        label = 'Out'
      }
      break
    case 'bunt':
      outs += 1
      if (outs < 3) ({ bases, scored } = advanceRunners(bases, 1))
      break
    default:
      throw new Error(`Unknown outcome: ${outcome}`)
  }

  const runs = s.runs.map((r) => [...r])
  runs[s.batter][s.inning - 1] += scored
  const up = [...s.up]
  up[s.batter] = (up[s.batter] + 1) % s.lineups[s.batter]

  let next = {
    ...s,
    bases,
    outs,
    runs,
    up,
    lastPlay: { batter: s.batter, hitter: s.up[s.batter], label, scored },
    history: [...s.history, snapshot],
  }

  if (outs >= 3) return endHalf(next)
  if (isWalkOff(next)) return { ...next, over: true, winner: next.batter }
  return next
}

export function undo(s) {
  if (!s.history.length) return s
  const prev = s.history[s.history.length - 1]
  return { ...prev, history: s.history.slice(0, -1) }
}

const isLastBatter = (s, p) => s.players > 1 && p === s.players - 1

function isWalkOff(s) {
  return s.inning >= s.innings && isLastBatter(s, s.batter) && leader(s) === s.batter
}

function endHalf(s) {
  const base = { ...s, outs: 0, bases: [false, false, false] }
  const nextBatter = s.batter + 1

  if (nextBatter < s.players) {
    // Last player already ahead in the final inning: no need to bat.
    if (isLastBatter(s, nextBatter) && s.inning >= s.innings && leader(s) === nextBatter) {
      return { ...base, over: true, winner: nextBatter }
    }
    return startHalf(base, s.inning, nextBatter)
  }

  // Everyone has batted this inning.
  if (s.inning >= s.innings) {
    const w = leader(s)
    if (w !== null) return { ...base, over: true, winner: w }
  }
  return startHalf(base, s.inning + 1, 0)
}

function startHalf(s, inning, batter) {
  const runs = s.runs.map((r) => [...r])
  runs[batter][inning - 1] = 0
  return { ...s, inning, batter, runs }
}
