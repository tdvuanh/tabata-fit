import { useSyncExternalStore } from 'react';
import { GROUPS, type WorkoutSet } from './timeline.ts';

export interface Schedule {
  id: string;
  setId: string;
  startDate: string; // YYYY-MM-DD
  time: string; // HH:mm local
  repeatDays: number[]; // 1 = Mon … 7 = Sun, empty = once
  remindBeforeMin: number;
}

export interface SessionLog {
  id: string;
  setId: string;
  startedAt: string;
  finishedAt: string;
  roundsDone: number;
  roundsTotal: number;
}

export interface Settings {
  beep: boolean;
  voice: boolean;
  voiceLang: 'vi-VN' | 'en-US';
  volume: number;
  vibrate: boolean;
  wakeLock: boolean;
  defaultPrepSec: number;
  remindBeforeMin: number;
  tourDone: boolean;
  setsTourDone: boolean;
  lastBackupAt?: string;
}

export interface Data {
  version: 1;
  sets: WorkoutSet[];
  schedules: Schedule[];
  logs: SessionLog[];
  settings: Settings;
}

const KEY = 'tabata:v1';
const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();

const base = { builtIn: true, updatedAt: '' };
const seed = (): Data => ({
  version: 1,
  sets: [
    { ...base, id: 'classic', name: 'Tabata gốc 20/10', group: 'fullbody', workSec: 20, restSec: 10, rounds: 8, sets: 1, setRestSec: 60, prepSec: 10, moves: [] },
    { ...base, id: 'fullbody', name: 'Toàn thân đốt mỡ', group: 'fullbody', workSec: 20, restSec: 10, rounds: 8, sets: 4, setRestSec: 60, prepSec: 10, moves: ['Burpee', 'Squat nhảy', 'Leo núi', 'Plank chạm vai'] },
    { ...base, id: 'core8', name: "Bụng 8'", group: 'core', workSec: 30, restSec: 15, rounds: 5, sets: 2, setRestSec: 30, prepSec: 10, moves: ['Crunch', 'Plank', 'Leg raise'] },
    { ...base, id: 'legs', name: 'Chân & mông', group: 'legs', workSec: 40, restSec: 20, rounds: 4, sets: 3, setRestSec: 45, prepSec: 10, moves: ['Lunge', 'Squat', 'Glute bridge'] },
  ],
  schedules: [],
  logs: [],
  settings: { beep: true, voice: true, voiceLang: 'vi-VN', volume: 0.8, vibrate: true, wakeLock: true, defaultPrepSec: 10, remindBeforeMin: 15, tourDone: false, setsTourDone: false },
});

function load(): Data {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (isData(d)) return { ...d, settings: mergeSettings(d.settings) };
    }
  } catch {
    /* fall through to seed */
  }
  // keep data we can't read instead of letting the next save overwrite it with the seed
  if (raw) {
    try {
      localStorage.setItem(KEY + ':hong', raw);
    } catch {
      /* nothing more we can do */
    }
  }
  return seed();
}

/** Seed settings, overridden only by stored values of the same type. */
function mergeSettings(stored: object): Settings {
  const p = stored as Record<string, unknown>;
  const out: Record<string, unknown> = { ...seed().settings };
  for (const k in p) {
    if (k in out ? typeof p[k] === typeof out[k] : k === 'lastBackupAt' && typeof p[k] === 'string') out[k] = p[k];
  }
  return out as unknown as Settings;
}

let data: Data = load();
const listeners = new Set<() => void>();

function commit(next: Data) {
  data = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    alertOnce('Không lưu được dữ liệu trên máy này. Hãy xuất bản sao lưu.');
  }
  listeners.forEach((l) => l());
}

let warned = false;
function alertOnce(msg: string) {
  if (!warned) {
    warned = true;
    window.alert(msg);
  }
}

export function useData(): Data {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => data,
  );
}
export const getData = () => data;

export const actions = {
  saveSet(s: WorkoutSet) {
    const item = { ...s, builtIn: false, updatedAt: now() };
    const exists = data.sets.some((x) => x.id === s.id);
    commit({ ...data, sets: exists ? data.sets.map((x) => (x.id === s.id ? item : x)) : [...data.sets, item] });
  },
  deleteSet(id: string) {
    commit({ ...data, sets: data.sets.filter((x) => x.id !== id), schedules: data.schedules.filter((x) => x.setId !== id) });
  },
  saveSchedule(s: Schedule) {
    commit({ ...data, schedules: [...data.schedules.filter((x) => x.id !== s.id), s] });
  },
  deleteSchedule(id: string) {
    commit({ ...data, schedules: data.schedules.filter((x) => x.id !== id) });
  },
  log(l: SessionLog) {
    commit({ ...data, logs: [...data.logs, l].slice(-500) });
  },
  setSettings(p: Partial<Settings>) {
    commit({ ...data, settings: { ...data.settings, ...p } });
  },
  exportBackup(): Blob {
    commit({ ...data, settings: { ...data.settings, lastBackupAt: now() } });
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  },
  /** Throws a Vietnamese message when the file is not a valid backup. */
  importBackup(text: string) {
    let d: unknown;
    try {
      d = JSON.parse(text);
    } catch {
      throw new Error('File không phải JSON.');
    }
    if (!isData(d)) throw new Error('File không phải bản sao lưu Tabata hợp lệ.');
    commit({ ...d, settings: mergeSettings(d.settings) });
  },
};

function num(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}
function isSet(s: any): s is WorkoutSet {
  return s && typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.moves) && s.moves.every((m: unknown) => typeof m === 'string')
    && s.group in GROUPS
    && ['workSec', 'restSec', 'rounds', 'sets', 'setRestSec', 'prepSec'].every((k) => num(s[k])) && s.workSec >= 1 && s.rounds >= 1 && s.sets >= 1;
}
function isSchedule(s: any): s is Schedule {
  return s && typeof s.id === 'string' && typeof s.setId === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.startDate)
    && /^\d{2}:\d{2}$/.test(s.time) && num(s.remindBeforeMin) && Array.isArray(s.repeatDays) && s.repeatDays.every((n: unknown) => typeof n === 'number' && n >= 1 && n <= 7);
}
function isData(d: any): d is Data {
  return d && d.version === 1 && Array.isArray(d.sets) && d.sets.every(isSet) && Array.isArray(d.schedules) && d.schedules.every(isSchedule)
    && Array.isArray(d.logs) && typeof d.settings === 'object' && d.settings !== null;
}

/** Unsaved builder form used by "Chạy thử" (route #/run/draft), keyed by the builder route so going back restores it. */
let draft: { route: string; set: WorkoutSet } | null = null;
export const setDraft = (route: string, set: WorkoutSet) => (draft = { route, set });
export const peekDraft = (route: string) => (draft?.route === route ? draft.set : undefined);
export const clearDraft = () => (draft = null);
export const findSet = (id: string) =>
  (id === 'draft' ? draft && { ...draft.set, id: 'draft', name: draft.set.name.trim() || 'Chạy thử' } : data.sets.find((s) => s.id === id)) ?? undefined;
