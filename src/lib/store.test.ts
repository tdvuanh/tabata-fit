import { test } from 'node:test';
import assert from 'node:assert/strict';

test('saved data survives a reload (store validates on load)', async () => {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
  const { actions } = await import('./store.ts?a');
  actions.saveSchedule({ id: 'x', setId: 'fullbody', startDate: '2026-10-31', time: '06:00', repeatDays: [1], remindBeforeMin: 15 });
  const fresh = await import('./store.ts?b'); // a second module instance = a page reload
  assert.equal(fresh.getData().schedules.length, 1);
  assert.throws(() => fresh.actions.importBackup('{"version":1}'), /không phải bản sao lưu/);
});

test('unreadable stored data is kept aside, not overwritten', async () => {
  const mem = new Map<string, string>([['tabata:v1', '{"version":2}']]);
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
  const { getData } = await import('./store.ts?c');
  assert.equal(getData().sets[0].id, 'classic'); // fell back to the seed
  assert.equal(mem.get('tabata:v1:hong'), '{"version":2}');
});

test('import rejects a set with no work time or unknown group', async () => {
  const { actions, getData } = await import('./store.ts?d');
  const good = getData();
  const bad = (patch: object) => JSON.stringify({ ...good, sets: [{ ...good.sets[0], ...patch }] });
  assert.throws(() => actions.importBackup(bad({ workSec: 0, restSec: 0, prepSec: 0 })), /không phải bản sao lưu/);
  assert.throws(() => actions.importBackup(bad({ group: 'x' })), /không phải bản sao lưu/);
  actions.importBackup(JSON.stringify({ ...good, settings: { ...good.settings, volume: 'to' } }));
  assert.equal(getData().settings.volume, 0.8); // wrong-typed setting falls back to default
});
