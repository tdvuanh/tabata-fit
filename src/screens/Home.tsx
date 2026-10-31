import { actions, useData } from '../lib/store';
import { totalSec, fmt } from '../lib/timeline';
import { Icon, Screen, Tour } from '../ui';

const TOUR = [
  { target: 'quick', text: 'Chạm vào một set để bắt đầu tập ngay. App tự đếm giờ, bíp báo đổi hiệp và đọc tên động tác.' },
  { target: 'new', text: 'Muốn bài riêng thì tạo set mới: chọn số giây tập, giây nghỉ, số hiệp và các động tác.' },
  { target: 'week', text: 'Tập xong buổi nào, ngày đó trong tuần sẽ được tô màu. Nhìn vào là biết tuần này tập đều chưa.' },
  { target: 'nav-sets', text: 'Tất cả set nằm ở tab Mẫu. Ở đây có thể sửa, xoá hoặc bấm Tập.' },
  { target: 'settings', text: 'Chỉnh tiếng bíp, giọng đọc, âm lượng, rung và sao lưu dữ liệu trong Cài đặt.' },
];
import { WeekStrip } from './WeekStrip';

export function Home() {
  const data = useData();
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
        <a href="#/settings" data-tour="settings" aria-label="Cài đặt" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface"><Icon name="gear" /></a>
      </div>

      <section data-tour="week" className="flex flex-col gap-3">
        <h2 className="font-bold">Tuần này</h2>
        <WeekStrip data={{ ...data, schedules: [] }} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">Bắt đầu nhanh</h2>
        <div data-tour="quick" className="grid grid-cols-2 gap-2.5">
          {quick.map((s) => (
            <a key={s.id} href={`#/run/${s.id}`} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-3.5">
              <span className="font-num text-[26px] leading-none font-bold">{s.name}</span>
              <span className="text-[13px] text-ink-3">{s.workSec}/{s.restSec} × {s.rounds} · {fmt(totalSec(s))}</span>
            </a>
          ))}
        </div>
        <a href="#/edit" data-tour="new" className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-work">
          <Icon name="plus" size={18} />Tạo set mới
        </a>
      </section>
      {!data.settings.tourDone && <Tour steps={TOUR} onDone={() => actions.setSettings({ tourDone: true })} />}
    </Screen>
  );
}
