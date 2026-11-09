import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newGame, play, undo, totalRuns } from '../src/games/realBaseball.js'

const game = (innings = 9, lineups = [['a1', 'a2'], ['b1']]) =>
  newGame({ teams: lineups.map((players, i) => ({ name: `T${i}`, players })), options: { innings } })
const seq = (s, ...outs) => outs.reduce(play, s)

test("Jake's example first inning", () => {
  let s = game()
  s = play(s, 'single');   assert.deepEqual(s.bases, [true, false, false])
  s = play(s, 'out');      assert.equal(s.outs, 1)
  s = play(s, 'single');   assert.deepEqual(s.bases, [true, false, true])
  s = play(s, 'double');   assert.deepEqual(s.bases, [false, true, false]); assert.equal(totalRuns(s, 0), 2)
  s = play(s, 'single');   assert.deepEqual(s.bases, [true, false, false]); assert.equal(totalRuns(s, 0), 3)
  s = play(s, 'offboard'); // double play ends the half
  assert.equal(s.batter, 1); assert.equal(s.outs, 0); assert.equal(s.runs[0][0], 3)
})

test('off board with nobody on is one out', () => {
  const s = play(game(), 'offboard')
  assert.equal(s.outs, 1)
})

test('double play removes lead runner only', () => {
  let s = seq(game(), 'single', 'single') // 1st & 3rd
  s = play(s, 'offboard')
  assert.equal(s.outs, 2); assert.deepEqual(s.bases, [true, false, false])
})

test('triple and homer clear the bases', () => {
  let s = seq(game(), 'single', 'single', 'triple')
  assert.deepEqual(s.bases, [false, false, true]); assert.equal(totalRuns(s, 0), 2)
  s = play(s, 'homer'); assert.equal(totalRuns(s, 0), 4); assert.deepEqual(s.bases, [false, false, false])
})

test('sac bunt advances runners one, runner on 3rd scores', () => {
  let s = seq(game(), 'single', 'single') // 1st & 3rd
  s = play(s, 'bunt')
  assert.equal(s.outs, 1); assert.deepEqual(s.bases, [false, true, false]); assert.equal(totalRuns(s, 0), 1)
})

test('bunt for the third out scores nothing', () => {
  let s = seq(game(), 'single', 'single', 'out', 'out', 'bunt')
  assert.equal(s.runs[0][0], 0); assert.equal(s.batter, 1)
})

test('batting order rotates and carries over innings', () => {
  let s = game(9, [['a1', 'a2', 'a3'], ['b1']])
  s = seq(s, 'single', 'out') // a1, a2 bat
  assert.equal(s.up[0], 2); assert.equal(s.lastPlay.hitter, 1)
  s = seq(s, 'out', 'out') // a3 out, a1 makes the 3rd out
  assert.equal(s.batter, 1); assert.equal(s.up[0], 1) // a2 leads off next inning
  s = seq(s, 'out', 'out', 'out')
  assert.equal(s.up[1], 0); assert.equal(s.batter, 0); assert.equal(s.inning, 2)
})

test('undo restores previous state', () => {
  const a = seq(game(), 'single', 'single')
  const b = undo(play(a, 'double'))
  assert.deepEqual(b.bases, a.bases); assert.equal(b.history.length, a.history.length)
})

const threeOuts = ['out', 'out', 'out']
test('home team skips final half when ahead', () => {
  let s = game(2)
  s = seq(s, ...threeOuts, 'homer', ...threeOuts) // after inning 1: P0 0, P1 1
  s = seq(s, ...threeOuts) // top of 2nd, P0 scores 0
  assert.equal(s.over, true); assert.equal(s.winner, 1)
})

test('walk-off ends the game immediately', () => {
  let s = game(1)
  s = seq(s, 'homer', ...threeOuts) // P0 1
  s = seq(s, 'single', 'homer') // P1 2 → walk-off
  assert.equal(s.over, true); assert.equal(s.winner, 1)
})

test('tie goes to extra innings', () => {
  let s = game(1)
  s = seq(s, ...threeOuts, ...threeOuts)
  assert.equal(s.over, false); assert.equal(s.inning, 2)
})
