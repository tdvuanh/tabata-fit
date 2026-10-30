import { useEffect, useState } from 'react';
import { actions, clearDraft, findSet, getData, peekDraft, setDraft, uid } from '../lib/store';
import { GROUPS, totalSec, fmt, type Group, type WorkoutSet } from '../lib/timeline';
import { Icon, Screen, Stepper, TopBar, field, go, primary } from '../ui';

const SUGGEST = ['Squat', 'Burpee', 'Leo núi', 'Plank', 'Jumping jack', 'Lunge', 'Hít đất', 'Crunch'];

export function Builder({ setId }: { setId?: string }) {
  const original = setId ? findSet(setId) : undefined;
  const [s, setS] = useState<WorkoutSet>(() =>
    peekDraft(setId ?? '') ?? (original
      ? { ...original, ...(original.builtIn ? { id: uid(), name: `${original.name} (bản sao)` } : {}) }
      : { id: uid(), name: '', group: 'fullbody', workSec: 20, restSec: 10, rounds: 8, sets: 1, setRestSec: 60,
          prepSec: getData().settings.defaultPrepSec, moves: [], builtIn: false, updatedAt: '' }),
  );
  // the form above already took the draft (back from "Chạy thử"); drop it so a later visit starts fresh
  useEffect(() => void clearDraft(), []);
  const [move, setMove] = useState('');
  const set = <K extends keyof WorkoutSet>(k: K) => (v: WorkoutSet[K]) => setS((p) => ({ ...p, [k]: v }));
  const addMove = (m: string) => {
    const t = m.trim();
    if (t) setS((p) => ({ ...p, moves: [...p.moves, t] }));
    setMove('');
  };
  const isEdit = original && !original.builtIn;
  const name = s.name.trim();

  const save = () => {
    actions.saveSet({ ...s, name: name || 'Set chưa đặt tên' });
    go('#/sets');
  };
  const del = () => {
    const scheduled = getData().schedules.some((x) => x.setId === s.id);
    if (confirm(scheduled ? 'Set này đang có lịch tập. Xoá cả set và lịch?' : 'Xoá set này?')) {
      actions.deleteSet(s.id);
      go('#/sets');
    }
  };
  const tryRun = () => {
    setDraft(setId ?? '', s);
    go('#/run/draft');
  };

  return (
    <Screen footer={
      <div className="flex shrink-0 items-center gap-3 border-t border-[#22252a] bg-bar px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col">
          <span className="font-num text-3xl leading-none font-bold">{fmt(totalSec(s))}</span>
          <span className="text-xs text-ink-3">tổng thời gian</span>
        </div>
        <button className={primary + ' flex-1'} onClick={save}>Lưu set</button>
      </div>}>
        <TopBar title={isEdit ? 'Sửa set' : original ? 'Sao chép set' : 'Tạo set'} back="#/sets"
          right={<button className="h-11 px-2 text-[15px] font-semibold text-work" onClick={tryRun}>Chạy thử</button>} />
        {original?.builtIn && <p className="rounded-xl bg-surface p-3 text-[13px] text-ink-2">Set có sẵn không sửa trực tiếp. Lưu lại sẽ tạo bản sao của anh.</p>}

        <div className="flex gap-2.5">
          <label className="flex flex-[1.6] flex-col gap-1.5 text-xs text-ink-3">Tên set
            <input className={field + ' font-semibold'} value={s.name} placeholder="Ví dụ: Chân sáng thứ 2" onChange={(e) => set('name')(e.target.value)} />
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-3">Nhóm
            <select className={field} value={s.group} onChange={(e) => set('group')(e.target.value as Group)}>
              {Object.entries(GROUPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Stepper label="Tập" unit="s" value={s.workSec} min={5} step={5} onChange={set('workSec')} dot="var(--color-work)" />
          <Stepper label="Nghỉ" unit="s" value={s.restSec} step={5} onChange={set('restSec')} dot="var(--color-rest)" />
          <Stepper label="Số hiệp" value={s.rounds} min={1} max={50} onChange={set('rounds')} dot="var(--color-ink)" />
          <Stepper label="Số set" value={s.sets} min={1} max={20} onChange={set('sets')} dot="var(--color-ink)" />
          <Stepper label="Nghỉ giữa set" unit="s" value={s.setRestSec} step={15} onChange={set('setRestSec')} dot="var(--color-rest)" />
          <Stepper label="Chuẩn bị" unit="s" value={s.prepSec} step={5} max={60} onChange={set('prepSec')} dot="var(--color-prep)" />
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">Động tác</h2>
            <span className="text-xs text-ink-3">xoay vòng mỗi hiệp</span>
          </div>
          {s.moves.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {s.moves.map((m, i) => (
                <li key={i} className="flex h-10 items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-3 text-sm font-semibold">
                  <span className="font-bold text-work">{String.fromCharCode(65 + (i % 26))}</span> {m}
                  <button aria-label={`Xoá ${m}`} className="flex size-9 items-center justify-center text-ink-3"
                    onClick={() => setS((p) => ({ ...p, moves: p.moves.filter((_, j) => j !== i) }))}><Icon name="close" size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), addMove(move))}>
            <label className="sr-only" htmlFor="move">Thêm động tác</label>
            <input id="move" className={field} value={move} placeholder="Gõ tên động tác" onChange={(e) => setMove(e.target.value)} />
            <button aria-label="Thêm động tác" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-work"><Icon name="plus" /></button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {SUGGEST.filter((x) => !s.moves.includes(x)).slice(0, 5).map((x) => (
              <button key={x} className="h-11 rounded-full border border-line px-3 text-xs text-ink-2" onClick={() => addMove(x)}>+ {x}</button>
            ))}
          </div>
        </section>

        {isEdit && (
          <button className="flex h-11 items-center justify-center gap-2 text-sm font-semibold text-[#ff8a80]" onClick={del}><Icon name="trash" size={18} />Xoá set</button>
        )}
    </Screen>
  );
}
