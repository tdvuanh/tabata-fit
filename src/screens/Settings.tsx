import { useEffect, useRef, useState } from 'react';
import { actions, useData } from '../lib/store';
import { beep, canVibrate, say, unlockAudio } from '../lib/audio';
import { Icon, Stepper, Toggle, TopBar, Screen, ghost, primary } from '../ui';

type InstallEvent = Event & { prompt: () => Promise<void> };
let installEvent: InstallEvent | null = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e as InstallEvent;
});

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

const H = ({ children }: { children: string }) => <h2 className="text-xs font-bold tracking-[0.08em] text-ink-3 uppercase">{children}</h2>;
const card = 'flex flex-col rounded-2xl bg-surface';

export function SettingsPage() {
  const { settings: s } = useData();
  const set = actions.setSettings;
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [canInstall, setCanInstall] = useState(!!installEvent);
  useEffect(() => {
    const on = () => setCanInstall(true);
    addEventListener('beforeinstallprompt', on);
    return () => removeEventListener('beforeinstallprompt', on);
  }, []);

  const test = () => {
    unlockAudio();
    beep(true);
    setTimeout(() => say('Tập, Burpee'), 450);
  };
  const exportBackup = () => {
    const url = URL.createObjectURL(actions.exportBackup());
    Object.assign(document.createElement('a'), { href: url, download: `tabata-sao-luu-${new Date().toISOString().slice(0, 10)}.json` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importBackup = async (f?: File) => {
    if (!f) return;
    if (!confirm('Nhập bản sao lưu sẽ thay toàn bộ dữ liệu hiện tại. Tiếp tục?')) return;
    try {
      actions.importBackup(await f.text());
      setMsg('Đã nhập bản sao lưu.');
    } catch (e) {
      setMsg((e as Error).message);
    }
    if (file.current) file.current.value = '';
  };
  const daysSince = s.lastBackupAt ? Math.floor((Date.now() - Date.parse(s.lastBackupAt)) / 864e5) : null;

  return (
    <Screen>
      <TopBar title="Cài đặt" back="#/" />

      <section className="flex flex-col gap-2">
        <H>Âm thanh khi tập</H>
        <div className={card}>
          <Toggle label="Bíp đếm ngược 3, 2, 1" hint="Trước khi đổi sang tập hoặc nghỉ" checked={s.beep} onChange={(v) => set({ beep: v })} />
          <Toggle label="Giọng đọc" hint='Đọc "Tập", "Nghỉ" và tên động tác' checked={s.voice} onChange={(v) => set({ voice: v })} />
          <label className="flex items-center gap-3 border-b border-[#22252a] px-4 py-2.5">
            <span className="flex-1 text-[15px] font-semibold">Giọng</span>
            <select className="h-11 rounded-xl border border-line bg-surface-2 px-2.5 text-sm" value={s.voiceLang} onChange={(e) => set({ voiceLang: e.target.value as 'vi-VN' | 'en-US' })}>
              <option value="vi-VN">Tiếng Việt</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 border-b border-[#22252a] px-4 py-3.5">
            <span className="flex justify-between"><span className="text-[15px] font-semibold">Âm lượng</span><span className="text-[13px] text-ink-3">{Math.round(s.volume * 100)}%</span></span>
            <input type="range" min={0} max={100} value={Math.round(s.volume * 100)} onChange={(e) => set({ volume: Number(e.target.value) / 100 })} className="h-7 w-full accent-work" />
          </label>
          <Toggle label="Rung khi đổi pha" hint={canVibrate() ? undefined : 'Máy này không hỗ trợ rung'} checked={s.vibrate && canVibrate()} disabled={!canVibrate()} onChange={(v) => set({ vibrate: v })} />
          <div className="p-3"><button className={ghost + ' w-full text-work'} onClick={test}><Icon name="sound" size={18} />Nghe thử</button></div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <H>Trong lúc tập</H>
        <div className={card}>
          <Toggle label="Giữ màn hình luôn sáng" hint={'wakeLock' in navigator ? 'Không tự tắt màn hình khi đang tập' : 'Trình duyệt này không hỗ trợ'}
            checked={s.wakeLock} disabled={!('wakeLock' in navigator)} onChange={(v) => set({ wakeLock: v })} />
        </div>
        <Stepper label="Đếm chuẩn bị mặc định cho set mới" unit="s" value={s.defaultPrepSec} step={5} max={60} onChange={(v) => set({ defaultPrepSec: v })} dot="var(--color-prep)" />
      </section>

      {!standalone && (
        <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-bar p-4">
          <h2 className="font-bold">Cài app ra màn hình chính</h2>
          <p className="text-xs text-ink-3">Mở nhanh, chạy cả khi không có mạng.</p>
          {isIOS ? (
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[13px] text-ink-2">
              <li>Mở trang này bằng Safari, bấm nút Chia sẻ</li>
              <li>Chọn "Thêm vào MH chính"</li>
            </ol>
          ) : canInstall ? (
            <button className={primary} onClick={() => installEvent?.prompt()}>Cài app</button>
          ) : (
            <p className="text-[13px] text-ink-2">Mở menu trình duyệt và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".</p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <H>Dữ liệu</H>
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <p className="text-[13px] leading-relaxed text-ink-2">Set và lịch tập chỉ lưu trên máy này. Xoá dữ liệu trình duyệt là mất, nên thỉnh thoảng sao lưu.</p>
          <div className="flex gap-2">
            <button className={ghost + ' flex-1'} onClick={exportBackup}>Xuất bản sao lưu</button>
            <button className={ghost + ' flex-1'} onClick={() => file.current?.click()}>Nhập lại</button>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
          </div>
          <p className={`text-xs ${daysSince === null || daysSince > 30 ? 'text-prep' : 'text-ink-3'}`} role="status">
            {msg || (daysSince === null ? 'Chưa sao lưu lần nào' : `Sao lưu gần nhất: ${daysSince === 0 ? 'hôm nay' : daysSince + ' ngày trước'}`)}
          </p>
        </div>
      </section>
      <p className="text-center text-xs text-ink-3">Phiên bản 0.1.0</p>
    </Screen>
  );
}
