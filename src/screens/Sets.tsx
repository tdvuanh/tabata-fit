import { useState } from 'react';
import { actions, useData } from '../lib/store';
import { GROUPS, totalSec, fmt, type Group } from '../lib/timeline';
import { Icon, Play, Screen, Tour } from '../ui';

const TOUR = [
  { target: 'filter', text: 'Lọc set theo nhóm cơ: toàn thân, bụng, chân... để tìm nhanh bài muốn tập.' },
  { target: 'card', text: 'Mỗi thẻ là một set: số set, giây tập/nghỉ, số hiệp và tổng thời gian ở bên phải.' },
  { target: 'run', text: 'Bấm Tập để chạy set này ngay.' },
  { target: 'edit', text: 'Sửa thời gian, số hiệp hoặc danh sách động tác. Sửa set có sẵn cũng được.' },
  { target: 'delete', text: 'Xoá set không dùng nữa. App sẽ hỏi lại trước khi xoá.' },
  { target: 'add', text: 'Tạo set mới theo ý mình ở đây.' },
];

export function Sets() {
  const data = useData();
  const [filter, setFilter] = useState<Group | 'all'>('all');
  const list = data.sets.filter((s) => filter === 'all' || s.group === filter);
  const del = (id: string, name: string) => {
    const scheduled = data.schedules.some((x) => x.setId === id);
    if (confirm(scheduled ? `"${name}" đang có lịch tập. Xoá cả set và lịch?` : `Xoá "${name}"?`)) actions.deleteSet(id);
  };
  const chips: [Group | 'all', string][] = [['all', 'Tất cả'], ...(Object.entries(GROUPS) as [Group, string][])];

  return (
    <Screen nav="sets">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold">Set của tôi</h1>
        <a href="#/edit" data-tour="add" aria-label="Tạo set mới" className="flex size-11 items-center justify-center rounded-full bg-work text-bg"><Icon name="plus" /></a>
      </div>
      <div data-tour="filter" className="flex flex-wrap gap-2">
        {chips.map(([k, label]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}
            className={`h-11 rounded-full border px-4 text-[13px] font-semibold ${filter === k ? 'border-ink bg-ink text-bg' : 'border-line text-ink-2'}`}>{label}</button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {list.length === 0 && <p className="py-8 text-center text-sm text-ink-3">Chưa có set nào trong nhóm này.</p>}
        {list.map((s, i) => (
          <article key={s.id} data-tour={i === 0 ? 'card' : undefined} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wide text-work uppercase">{GROUPS[s.group]}{s.builtIn ? ' · có sẵn' : ''}</p>
                <h2 className="font-bold">{s.name}</h2>
                <p className="text-xs text-ink-3">
                  {s.sets} set · {s.workSec}s/{s.restSec}s × {s.rounds}{s.moves.length ? ` · ${s.moves.length} động tác` : ''}
                </p>
              </div>
              <span className="font-num text-2xl leading-none font-bold whitespace-nowrap">{fmt(totalSec(s))}</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={`#/edit/${s.id}`} data-tour={i === 0 ? 'edit' : undefined} aria-label={`Sửa ${s.name}`} className="flex size-11 items-center justify-center rounded-full border border-line"><Icon name="edit" size={18} /></a>
              <button data-tour={i === 0 ? 'delete' : undefined} aria-label={`Xoá ${s.name}`} onClick={() => del(s.id, s.name)} className="flex size-11 items-center justify-center rounded-full border border-line text-ink-3"><Icon name="trash" size={18} /></button>
              <span className="flex-1" />
              <a href={`#/run/${s.id}`} data-tour={i === 0 ? 'run' : undefined} className="flex h-11 items-center gap-2 rounded-full bg-work px-4.5 text-sm font-bold text-bg"><Play size={14} />Tập</a>
            </div>
          </article>
        ))}
      </div>
      {!data.settings.setsTourDone && <Tour steps={TOUR} onDone={() => actions.setSettings({ setsTourDone: true })} />}
    </Screen>
  );
}
