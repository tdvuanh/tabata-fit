import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextOccurrence, toIcs } from './ics.ts';
import type { WorkoutSet } from './timeline.ts';

const set: WorkoutSet = {
  id: 'a', name: 'Toàn thân, đốt mỡ', group: 'fullbody', workSec: 20, restSec: 10, rounds: 8, sets: 4,
  setRestSec: 60, prepSec: 10, moves: [], builtIn: false, updatedAt: '',
};
const sch = { id: 's1', setId: 'a', startDate: '2026-10-31', time: '18:30', repeatDays: [1, 3, 5], remindBeforeMin: 15 };

test('next occurrence skips to the next repeat day', () => {
  // 2026-10-31 is a Saturday → next is Monday 2026-11-02
  const n = nextOccurrence(sch, new Date(2026, 9, 30, 12))!;
  assert.deepEqual([n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes()], [2026, 10, 2, 18, 30]);
});

test('one-off in the past returns null', () => {
  assert.equal(nextOccurrence({ ...sch, repeatDays: [] }, new Date(2026, 10, 5)), null);
});

test('ics has weekly rule, alarm, escaped summary and DTSTART on a BYDAY day', () => {
  const ics = toIcs(sch, set, 'Asia/Ho_Chi_Minh');
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.match(ics, /SUMMARY:Tập Tabata: Toàn thân\\, đốt mỡ/);
  assert.match(ics, /DTSTART;TZID=Asia\/Ho_Chi_Minh:20261102T183000/);
  assert.match(ics, /DTEND;TZID=Asia\/Ho_Chi_Minh:20261102T184840/);
});
