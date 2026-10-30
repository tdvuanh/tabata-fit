import type { Data, Schedule } from '../lib/store';
import { isoDow } from '../lib/ics';
import { DOW } from '../ui';

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const occursOn = (s: Schedule, day: string, dow: number) =>
  s.repeatDays.length ? day >= s.startDate && s.repeatDays.includes(dow) : s.startDate === day;

function week(today = new Date()) {
  const mon = new Date(today);
  mon.setDate(today.getDate() - isoDow(today) + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

export function WeekStrip({ data, dates = false }: { data: Data; dates?: boolean }) {
  const today = ymd(new Date());
  const doneDays = new Set(data.logs.map((l) => ymd(new Date(l.startedAt))));
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {week().map((d, i) => {
        const day = ymd(d);
        const done = doneDays.has(day);
        const plan = !done && day >= today && data.schedules.some((s) => occursOn(s, day, i + 1));
        const status = done ? 'đã tập' : plan ? 'đã hẹn' : 'trống';
        return (
          <div key={day} className="flex flex-col items-center gap-1.5" aria-label={`${DOW[i]} ${d.getDate()}: ${status}`}>
            <span className={`text-xs font-semibold ${day === today ? 'text-ink' : 'text-ink-3'}`}>{DOW[i]}</span>
            <span className={`flex size-10 items-center justify-center rounded-full font-num text-lg font-bold ${
              done ? 'bg-work text-bg' : plan ? 'border-2 border-dashed border-work text-work' : 'border border-line bg-surface text-ink-3'}`}>
              {dates ? d.getDate() : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
