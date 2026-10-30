import { useData } from '../lib/store';
import { nextOccurrence } from '../lib/ics';
import { totalSec, fmt } from '../lib/timeline';
import { Icon, Play, Screen, primary } from '../ui';
import { WeekStrip } from './WeekStrip';

const when = (d: Date) => {
  const today = new Date();
  const tmr = new Date(today);
  tmr.setDate(today.getDate() + 1);
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Hôm nay ${hm}`;
  if (d.toDateString() === tmr.toDateString()) return `Ngày mai ${hm}`;
  return `${d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${hm}`;
};

export function Home() {
  const data = useData();
  const next = data.schedules
    .map((s) => ({ s, at: nextOccurrence(s), set: data.sets.find((x) => x.id === s.setId) }))
    .filter((x) => x.at && x.set)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];
  const lastId = data.logs.at(-1)?.setId;
  const quick = [data.sets.find((s) => s.id === 'classic'), data.sets.find((s) => s.id === lastId && s.id !== 'classic') ?? data.sets.find((s) => s.id !== 'classic')]
    .filter((s) => s !== undefined);

  return (
    <Screen nav="home">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-ink-3">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
          <h1 className="text-[22px] font-bold">Hôm nay tập gì?</h1>
        </div>
        <a href="#/settings" aria-label="Cài đặt" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface"><Icon name="gear" /></a>
      </div>

      {next ? (
        <section className="flex flex-col gap-3.5 rounded-3xl bg-work p-5 text-bg">
          <p className="text-xs font-bold tracking-wider uppercase">Buổi tiếp theo · {when(next.at!)}</p>
          <div>
            <h2 className="font-num text-[40px] leading-none font-extrabold uppercase">{next.set!.name}</h2>
            <p className="mt-1 text-sm font-medium">
              {next.set!.sets} set · {next.set!.workSec}s tập / {next.set!.restSec}s nghỉ · {next.set!.rounds} hiệp · {fmt(totalSec(next.set!))}
            </p>
          </div>
          <a href={`#/run/${next.set!.id}`} className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-bg font-bold text-work"><Play size={18} />Bắt đầu</a>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-3xl border border-dashed border-line-strong p-5">
          <h2 className="text-lg font-bold">Chưa có buổi tập nào được hẹn</h2>
          <p className="text-sm text-ink-2">Hẹn giờ tập để app thêm vào lịch điện thoại và nhắc anh.</p>
          <a href="#/schedule" className={primary}>Hẹn buổi đầu tiên</a>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">Tuần này</h2>
          <a href="#/schedule" className="text-[13px] font-semibold text-work">Xem lịch</a>
        </div>
        <WeekStrip data={data} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">Bắt đầu nhanh</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {quick.map((s) => (
            <a key={s.id} href={`#/run/${s.id}`} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-3.5">
              <span className="font-num text-[26px] leading-none font-bold">{s.name}</span>
              <span className="text-[13px] text-ink-3">{s.workSec}/{s.restSec} × {s.rounds} · {fmt(totalSec(s))}</span>
            </a>
          ))}
        </div>
        <a href="#/edit" className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-work">
          <Icon name="plus" size={18} />Tạo set mới
        </a>
      </section>
    </Screen>
  );
}
