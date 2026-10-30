import { useEffect, useMemo, useRef, useState } from 'react';
import { actions, findSet, getData, uid } from '../lib/store';
import { buildTimeline, roundsDone, segmentAt, fmt, type Phase } from '../lib/timeline';
import { beep, buzz, say, unlockAudio } from '../lib/audio';
import { Icon, go, primary } from '../ui';

const LOOK: Record<Phase, { bg: string; label: string }> = {
  prep: { bg: '#FFB547', label: 'Sẵn sàng' },
  work: { bg: '#C6F432', label: 'Tập' },
  rest: { bg: '#5AB4FF', label: 'Nghỉ' },
  setRest: { bg: '#5AB4FF', label: 'Nghỉ set' },
};
const R = 138, C = 2 * Math.PI * R;

export function Run({ setId }: { setId: string }) {
  const set = useMemo(() => findSet(setId), [setId]);
  const tl = useMemo(() => (set ? buildTimeline(set) : []), [set]);
  const total = tl.length ? tl.at(-1)!.start + tl.at(-1)!.sec : 0;

  // elapsed = offset + (running ? now - since : 0); timestamps, never a per-second counter
  const clock = useRef({ offset: 0, since: 0, running: false, startedAt: '', done: 0 });
  const skipped = useRef<[number, number][]>([]);
  const [, tick] = useState(0);
  const [state, setState] = useState<'ready' | 'running' | 'paused' | 'done'>('ready');
  const [muted, setMuted] = useState(false);
  const last = useRef({ seg: -2, sec: -1 });

  const elapsed = () => {
    const c = clock.current;
    return c.offset + (c.running ? (performance.now() - c.since) / 1000 : 0);
  };
  const jump = (t: number) => {
    const c = clock.current;
    const from = elapsed();
    t = Math.max(0, Math.min(total, t));
    if (t > from) skipped.current.push([from, t]);
    c.offset = t;
    c.since = performance.now();
    last.current = { seg: -2, sec: -1 };
    tick((n) => n + 1);
  };

  // frame loop + cues
  useEffect(() => {
    if (state !== 'running') return;
    let raf = 0;
    const loop = () => {
      const e = elapsed();
      const k = segmentAt(tl, e);
      if (k === -1) return finish();
      const seg = tl[k];
      const left = Math.ceil(seg.start + seg.sec - e);
      if (!muted) {
        if (k !== last.current.seg) {
          beep(true);
          buzz();
          say(seg.phase === 'work' ? `Tập${seg.move ? ', ' + seg.move : ''}` : seg.phase === 'prep' ? 'Chuẩn bị' : 'Nghỉ');
        } else if (left <= 3 && left >= 1 && left !== last.current.sec) beep();
      }
      last.current = { seg: k, sec: left };
      tick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, muted, tl]);

  // keep the screen on while running
  useEffect(() => {
    if (state !== 'running' || !getData().settings.wakeLock || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const get = () => navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {});
    const onVis = () => document.visibilityState === 'visible' && get();
    get();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release();
    };
  }, [state]);

  if (!set) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p>Không tìm thấy set này.</p>
        <a href="#/sets" className={primary}>Về danh sách set</a>
      </div>
    );
  }

  function start() {
    unlockAudio();
    const c = clock.current;
    c.startedAt ||= new Date().toISOString();
    c.since = performance.now();
    c.running = true;
    setState('running');
  }
  function pause() {
    const c = clock.current;
    c.offset = elapsed();
    c.running = false;
    setState('paused');
  }
  function finish() {
    const c = clock.current;
    const from = elapsed();
    if (from < total) skipped.current.push([from, total]);
    c.offset = total;
    c.running = false;
    c.done = roundsDone(tl, skipped.current);
    // a session skipped through without doing any round is not a workout
    if (setId !== 'draft' && c.done > 0) {
      actions.log({ id: uid(), setId, startedAt: c.startedAt, finishedAt: new Date().toISOString(), roundsDone: c.done, roundsTotal: set!.rounds * set!.sets });
    }
    say('Xong buổi tập');
    setState('done');
  }
  // "Chạy thử" came from the builder: go back in history so the unsaved form is restored
  const leave = () => (setId === 'draft' ? history.back() : go('#/'));
  function exit() {
    if (state === 'done' || state === 'ready' || confirm('Dừng buổi tập? Buổi này sẽ không được ghi lại.')) leave();
  }

  const e = elapsed();
  const k = Math.max(0, segmentAt(tl, e));
  const seg = tl[k];
  const left = state === 'done' ? 0 : Math.ceil(seg.start + seg.sec - e);
  const frac = state === 'done' ? 1 : (e - seg.start) / seg.sec;
  const look = state === 'done' ? { bg: '#C6F432', label: 'Xong!' } : LOOK[seg.phase];
  const prevStart = e - seg.start > 2 ? seg.start : tl[Math.max(0, k - 1)].start;
  const nextSeg = tl[k + 1];

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))] text-bg transition-colors duration-300"
      style={{ background: look.bg }}>
      <div className="flex items-center justify-between">
        <button aria-label="Thoát buổi tập" onClick={exit} className="flex size-11 items-center justify-center rounded-full bg-bg/10"><Icon name="close" /></button>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wider uppercase">Set {seg.set} / {set.sets}</p>
          <p className="text-[13px] font-medium">còn {fmt(total - e)}</p>
        </div>
        <button aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} aria-pressed={muted} onClick={() => setMuted(!muted)}
          className="flex size-11 items-center justify-center rounded-full bg-bg/10"><Icon name={muted ? 'mute' : 'sound'} /></button>
      </div>

      <div className="flex gap-1" role="img" aria-label={`Hiệp ${seg.round} trên ${set.rounds}`}>
        {Array.from({ length: set.rounds }, (_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < seg.round - 1 || state === 'done' ? '#0E0F12' : i === seg.round - 1 ? 'rgba(14,15,18,.55)' : 'rgba(14,15,18,.15)' }} />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="font-num text-[44px] font-extrabold tracking-[0.12em] uppercase" aria-live="assertive">{look.label}</p>
        <div className="relative flex aspect-square w-full max-w-[300px] items-center justify-center">
          <svg viewBox="0 0 300 300" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(14,15,18,.12)" strokeWidth="14" />
            <circle cx="150" cy="150" r={R} fill="none" stroke="#0E0F12" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, frac))} />
          </svg>
          <span className="font-num text-[clamp(110px,40vw,168px)] leading-none font-extrabold tabular-nums">{String(left).padStart(2, '0')}</span>
        </div>
        <p className="text-[15px] font-semibold">Hiệp {seg.round} / {set.rounds}</p>
      </div>

      {state === 'done' ? (
        <div className="flex flex-col gap-3 rounded-3xl bg-bg p-5 text-ink">
          <p className="font-num text-3xl font-extrabold uppercase">Xong buổi!</p>
          <p className="text-sm text-ink-2">{set.name} · {fmt(total)} · {clock.current.done}/{set.rounds * set.sets} hiệp</p>
          <button className={primary} onClick={leave}>Về trang chính</button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-[22px] bg-bg px-4.5 py-4 text-ink">
            <div className="min-w-0">
              <p className="text-xs text-ink-3">{seg.phase === 'work' ? 'Đang làm' : 'Tiếp theo'}</p>
              <p className="truncate text-[22px] font-bold">{(seg.phase === 'work' ? seg.move : seg.next) ?? (seg.phase === 'work' ? 'Tập hết sức' : 'Tập')}</p>
            </div>
            {nextSeg && <span className="shrink-0 text-[13px] text-ink-3">Sau đó: {LOOK[nextSeg.phase].label} {nextSeg.sec}s</span>}
          </div>
          <div className="flex items-center justify-center gap-7">
            <button aria-label="Lùi lại" onClick={() => jump(prevStart)} disabled={state === 'ready'}
              className="flex size-15 items-center justify-center rounded-full border-2 border-bg disabled:opacity-30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 5v14L8 12zM6 5h2v14H6z" /></svg>
            </button>
            <button aria-label={state === 'running' ? 'Tạm dừng' : 'Bắt đầu'} onClick={state === 'running' ? pause : start}
              className="flex size-22 items-center justify-center rounded-full bg-bg" style={{ color: look.bg }}>
              {state === 'running'
                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                : <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>}
            </button>
            <button aria-label="Bỏ qua" onClick={() => (nextSeg ? jump(nextSeg.start) : finish())} disabled={state === 'ready'}
              className="flex size-15 items-center justify-center rounded-full border-2 border-bg disabled:opacity-30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5v14l10-7zM16 5h2v14h-2z" /></svg>
            </button>
          </div>
          {state !== 'running' && <p className="-mt-2 text-center text-sm font-semibold">{state === 'ready' ? 'Bấm nút giữa để bắt đầu' : 'Đang tạm dừng'}</p>}
        </>
      )}
    </div>
  );
}
