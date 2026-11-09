import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newGame, throwDart, endTurn, undo } from '../src/games/cricket.js'

const game = ({ super: sup = false, points = false, players = ['A', 'B'], teams } = {}) =>
  newGame({
    gameId: sup ? 'super-cricket' : 'cricket',
    players,
    teams,
    options: { points },
  })
const d = (n, m = 1) => ({ n, m })
const throws = (s, ...darts) => darts.reduce(throwDart, s)

test('marks cap at 3 and turn passes after 3 darts', () => {
  const s = throws(game(), d(20, 3), d(20), d(19, 2))
  assert.deepEqual(s.marks['20'], [3, 0])
  assert.deepEqual(s.marks['19'], [2, 0])
  assert.equal(s.side, 1); assert.equal(s.darts.length, 0)
})

test("180 in Super Cricket: 20s, Triples, and 3 in a bed", () => {
  const s = throws(game({ super: true }), d(20, 3), d(20, 3), d(20, 3))
  assert.equal(s.marks['20'][0], 3)
  assert.equal(s.marks.T[0], 3)
  assert.equal(s.marks['3B'][0], 1)
})

test('180 with points scores the overkill', () => {
  const s = throws(game({ super: true, points: true }), d(20, 3), d(20, 3), d(20, 3))
  assert.equal(s.score[0], 120)
})

test('no points once everyone has closed it', () => {
  let s = throws(game({ points: true }), d(20, 3), d(0), d(0))
  s = throws(s, d(20, 3), d(0), d(0))
  s = throws(s, d(20, 3), d(0), d(0))
  assert.deepEqual(s.score, [0, 0])
})

test('doubles and triples on non-cricket numbers count in super', () => {
  const s = throws(game({ super: true }), d(5, 2), d(3, 3), d(25, 2))
  assert.equal(s.marks.D[0], 2) // D5 + bullseye
  assert.equal(s.marks.T[0], 1)
  assert.equal(s.marks['25'][0], 2)
})

test('3 in a bed on any number, any multiplier; not on misses', () => {
  let s = throws(game({ super: true }), d(7), d(7, 2), d(7, 3))
  assert.equal(s.marks['3B'][0], 1)
  s = throws(s, d(0), d(0), d(0))
  assert.equal(s.marks['3B'][1], 0)
})

test('bonus targets ignored in regular cricket', () => {
  const s = throws(game(), d(5, 3), d(5, 3), d(5, 3))
  assert.equal(s.marks.T, undefined)
})

test('first to close everything wins (no points)', () => {
  let s = game({ players: ['A'] })
  for (const n of [20, 19, 18, 17, 16, 15]) s = throwDart(s, d(n, 3))
  assert.equal(s.over, false)
  s = throws(s, d(25, 2), d(25))
  assert.equal(s.over, true); assert.equal(s.winner, 0)
})

test('with points, closing out while behind does not win', () => {
  let s = game({ points: true })
  s = throws(s, d(0), d(0), d(0))
  s = throws(s, d(20, 3), d(20, 3), d(0)) // B: 60 points
  for (const n of [20, 19, 18, 17, 16, 15]) s = throwDart(s, d(n, 3))
  s = throws(s, d(25, 2), d(25))
  assert.equal(s.over, false)
})

test('team throwing order rotates', () => {
  let s = game({ teams: [{ name: 'X', players: ['x1', 'x2'] }, { name: 'Y', players: ['y1'] }] })
  s = endTurn(s); assert.equal(s.side, 1); assert.equal(s.up[0], 1)
  s = endTurn(s); assert.equal(s.side, 0); assert.equal(s.up[1], 0)
  s = endTurn(s); assert.equal(s.up[0], 0)
})

test('undo goes back one dart', () => {
  const a = throws(game(), d(20, 3))
  const b = undo(throwDart(a, d(19)))
  assert.deepEqual(b.marks['19'], [0, 0]); assert.equal(b.darts.length, 1)
})
