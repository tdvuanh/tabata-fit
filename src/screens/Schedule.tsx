import { useState } from 'react';
import { actions, getData, uid, useData, type Schedule } from '../lib/store';
import { deliverIcs, nextOccurrence, toIcs } from '../lib/ics';
import { totalSec, fmt } from '../lib/timeline';
import { DOW, Icon, Play, Screen, field, primary } from '../ui';
import { WeekStrip, ymd } from './WeekStrip';

export function SchedulePage({ setId }: { setId?: string }) {
  const data = useData();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [form, setForm] = useState<Schedule>(() => ({
    id: uid(), setId: setId ?? data.sets[0]?.id ?? '', startDate: ymd(tomorrow), time: '06:00',
    repeatDays: [], remindBeforeMin: getData().settings.remindBeforeMin,
  }));
  const [msg, setMsg] = useState('');

  const upcoming = data.schedules
    .map((s) => ({ s, at: nextOccurrence(s), set: data.sets.find((x) => x.id === s.setId) }))
    .filter((x) => x.set)
    .sort((a, b) => (a.at?.getTime() ?? Infinity) - (b.at?.getTime() ?? Infinity));

  const exportIcs = (s: Schedule) => {
    const set = data.sets.find((x) => x.id === s.setId);
    if (set) return deliverIcs(toIcs(s, set), `tabata-${set.name}`);
  };
  const save = async () => {
    if (!form.setId) return;
    actions.saveSchedule(form);
    setMsg('Đã lưu. Mở file vừa tải trong ứng dụng Lịch để nhận nhắc nhở.');
    await exportIcs(form);
    setForm((f) => ({ ...f, id: uid() }));
  };
  const toggleDay = (n: number) =>
    setForm((f) => ({ ...f, repeatDays: f.repeatDays.includes(n) ? f.repeatDays.filter((x) => x !== n) : [...f.repeatDays, n].sort() }));

  return (
    <Screen nav="schedule">
      <h1 className="text-[26px] font-bold">Lịch tập</h1>
      <WeekStrip data={data} dates />

      {upcoming.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {upcoming.map(({ s, at, set }) => (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <div className="flex w-14 flex-col items-center">
                <span className="font-num text-[26px] leading-none font-bold">{s.time}</span>
                <span className="text-[11px] text-ink-3">{at ? at.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }) : 'đã qua'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold">{set!.name}</p>
                <p className="text-xs text-ink-3">{s.repeatDays.length ? 'Lặp ' + s.repeatDays.map((n) => DOW[n - 1]).join(' · ') : 'Một lần'} · {fmt(totalSec(set!))}</p>
              </div>
              <button aria-label={`Thêm lại ${set!.name} vào lịch điện thoại`} onClick={() => exportIcs(s)} className="flex size-11 items-center justify-center rounded-full border border-line"><Icon name="cal" size={18} /></button>
              <button aria-label={`Xoá lịch ${set!.name}`} onClick={() => confirm('Xoá lịch này? Sự kiện đã thêm vào lịch điện thoại cần xoá riêng.') && actions.deleteSchedule(s.id)}
                className="flex size-11 items-center justify-center rounded-full border border-line text-ink-3"><Icon name="trash" size={18} /></button>
              <a href={`#/run/${s.setId}`} aria-label={`Tập ${set!.name}`} className="flex size-11 items-center justify-center rounded-full bg-work text-bg"><Play /></a>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3.5 rounded-[20px] border border-[#22252a] bg-bar p-4">
        <h2 className="font-bold">Hẹn buổi tập</h2>
        {data.sets.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có set nào. <a href="#/edit" className="font-semibold text-work">Tạo set trước</a>.</p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-xs text-ink-3">Set tập
              <select className={field} value={form.setId} onChange={(e) => setForm({ ...form, setId: e.target.value })}>
                {data.sets.map((s) => <option key={s.id} value={s.id}>{s.name} · {fmt(totalSec(s))}</option>)}
              </select>
            </label>
            <div className="flex gap-2.5">
              <label className="flex flex-[1.3] flex-col gap-1 text-xs text-ink-3">Ngày bắt đầu
                <input type="date" className={field} value={form.startDate} required onChange={(e) => e.target.value && setForm({ ...form, startDate: e.target.value })} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-ink-3">Giờ
                <input type="time" className={field} value={form.time} required onChange={(e) => e.target.value && setForm({ ...form, time: e.target.value })} />
              </label>
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-xs text-ink-3">Lặp lại (bỏ trống nếu tập 1 lần)</legend>
              <div className="flex gap-1.5">
                {DOW.map((d, i) => {
                  const on = form.repeatDays.includes(i + 1);
                  return <button key={d} type="button" aria-pressed={on} onClick={() => toggleDay(i + 1)}
                    className={`h-11 flex-1 rounded-xl border border-line text-xs font-bold ${on ? 'bg-work text-bg' : 'bg-surface text-ink-3'}`}>{d}</button>;
                })}
              </div>
            </fieldset>
            <button className={primary} onClick={save}><Icon name="cal" size={18} />Lưu và thêm vào lịch điện thoại</button>
            <p className="text-center text-xs text-ink-3" role="status">{msg || 'Máy sẽ mở hoặc tải file lịch để anh xác nhận'}</p>
          </>
        )}
      </section>
    </Screen>
  );
}
