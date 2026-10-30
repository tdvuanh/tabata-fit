import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, roundsDone, segmentAt, totalSec, type WorkoutSet } from './timeline.ts';

const set: WorkoutSet = {
  id: 'a', name: 'x', group: 'fullbody', workSec: 20, restSec: 10, rounds: 8, sets: 4,
  setRestSec: 60, prepSec: 10, moves: ['A', 'B', 'C', 'D'], builtIn: false, updatedAt: '',
};

test('total matches timeline length (19:10)', () => {
  const tl = buildTimeline(set);
  const last = tl.at(-1)!;
  assert.equal(totalSec(set), 1150);
  assert.equal(last.start + last.sec, 1150);
});

test('moves rotate across rounds and sets', () => {
  const works = buildTimeline(set).filter((s) => s.phase === 'work').map((s) => s.move);
  assert.equal(works.length, 32);
  assert.deepEqual(works.slice(0, 9), ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A']);
});

test('segmentAt finds the right segment and the end', () => {
  const tl = buildTimeline(set);
  assert.equal(tl[segmentAt(tl, 0)].phase, 'prep');
  assert.equal(tl[segmentAt(tl, 10)].phase, 'work');
  assert.equal(tl[segmentAt(tl, 30)].phase, 'rest');
  assert.equal(tl[segmentAt(tl, 250)].phase, 'setRest');
  assert.equal(segmentAt(tl, 1150), -1);
});

test('zero rest and no moves still work', () => {
  const tl = buildTimeline({ ...set, restSec: 0, moves: [], sets: 1, prepSec: 0 });
  assert.equal(tl.length, 8);
  assert.equal(tl[0].move, undefined);
});

test('roundsDone ignores rounds that were skipped', () => {
  const tl = buildTimeline({ ...set, sets: 1 }); // prep 10s, then 8 × (20 work + 10 rest)
  assert.equal(roundsDone(tl, []), 8);
  assert.equal(roundsDone(tl, [[0, 250]]), 0); // skipped straight to the end
  assert.equal(roundsDone(tl, [[15, 40]]), 7); // 15 of round 1’s 20s + its rest skipped
  assert.equal(roundsDone(tl, [[35, 40]]), 8); // only a rest skipped
});
