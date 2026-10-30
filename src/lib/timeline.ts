export type Group = 'fullbody' | 'legs' | 'upper' | 'core';
export type Phase = 'prep' | 'work' | 'rest' | 'setRest';

export interface WorkoutSet {
  id: string;
  name: string;
  group: Group;
  workSec: number;
  restSec: number;
  rounds: number;
  sets: number;
  setRestSec: number;
  prepSec: number;
  moves: string[];
  builtIn: boolean;
  updatedAt: string;
}

export interface Segment {
  phase: Phase;
  sec: number;
  start: number; // seconds from the beginning of the session
  set: number;
  round: number;
  move?: string;
  next?: string;
}

export const GROUPS: Record<Group, string> = {
  fullbody: 'Toàn thân',
  legs: 'Chân',
  upper: 'Thân trên',
  core: 'Bụng',
};

export function totalSec(s: WorkoutSet): number {
  return s.prepSec + s.sets * s.rounds * (s.workSec + s.restSec) + (s.sets - 1) * s.setRestSec;
}

export function buildTimeline(s: WorkoutSet): Segment[] {
  const out: Segment[] = [];
  let t = 0;
  const push = (seg: Omit<Segment, 'start'>) => {
    if (seg.sec > 0) out.push({ ...seg, start: t });
    t += seg.sec;
  };
  const moveAt = (i: number) => (s.moves.length ? s.moves[i % s.moves.length] : undefined);
  let i = 0;
  push({ phase: 'prep', sec: s.prepSec, set: 1, round: 1, next: moveAt(0) });
  for (let set = 1; set <= s.sets; set++) {
    for (let round = 1; round <= s.rounds; round++) {
      push({ phase: 'work', sec: s.workSec, set, round, move: moveAt(i) });
      i++;
      push({ phase: 'rest', sec: s.restSec, set, round, next: moveAt(i) });
      if (round === s.rounds && set < s.sets) push({ phase: 'setRest', sec: s.setRestSec, set, round, next: moveAt(i) });
    }
  }
  return out;
}

/** Segment index at `elapsed` seconds, or -1 once the session is over. */
export function segmentAt(tl: Segment[], elapsed: number): number {
  for (let k = tl.length - 1; k >= 0; k--) if (elapsed >= tl[k].start) return elapsed < tl[k].start + tl[k].sec ? k : -1;
  return 0;
}

/** Work segments the user really did: less than half of it skipped. `skipped` = [from, to] seconds jumped over. */
export function roundsDone(tl: Segment[], skipped: [number, number][]): number {
  return tl.filter((g) => {
    if (g.phase !== 'work') return false;
    const lost = skipped.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, g.start + g.sec) - Math.max(a, g.start)), 0);
    return lost < g.sec / 2;
  }).length;
}

export function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
