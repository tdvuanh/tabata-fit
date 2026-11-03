import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useRoute } from './ui';
import { Home } from './screens/Home';
import { Run } from './screens/Run';
import { Builder } from './screens/Builder';
import { Sets } from './screens/Sets';
// Tạm ẩn hẹn giờ tập: Schedule.tsx + lib/ics.ts vẫn giữ, gắn lại route ở đây để bật.
import { SettingsPage } from './screens/Settings';

export function App() {
  const [page, id] = useRoute();
  const reg = useRef<ServiceWorkerRegistration>(undefined);
  const [latest, setLatest] = useState<string>();
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ onRegisteredSW: (_, r) => { reg.current = r; } });
  useEffect(() => {
    // iOS PWA ít khi tự kiểm tra SW mới, nên mỗi lần mở/quay lại app thì so version với server
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.version && d.version !== __APP_VERSION__) { setLatest(d.version); void reg.current?.update(); }
        })
        .catch(() => {}); // offline thì bỏ qua
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);
  // SW mới cài xong (needRefresh) mới kích hoạt được; không có SW thì reload là đủ
  const ready = needRefresh || !navigator.serviceWorker?.controller;
  const view =
    page === 'run' && id ? <Run key={id} setId={id} />
    : page === 'edit' ? <Builder key={id ?? 'new'} setId={id} />
    : page === 'sets' ? <Sets />
    : page === 'settings' ? <SettingsPage />
    : <Home />;
  return (
    <>
      {view}
      {(needRefresh || latest) && page !== 'run' && (
        <div role="status" className="fixed inset-x-4 bottom-24 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
          <span className="flex-1 text-sm">Có bản mới{latest ? ` v${latest}` : ''} của app. Bạn đang dùng v{__APP_VERSION__}.</span>
          <button className="h-11 rounded-full bg-work px-4 text-sm font-bold text-bg disabled:opacity-50" disabled={!ready} onClick={() => (needRefresh ? updateServiceWorker(true) : location.reload())}>
            {ready ? 'Cập nhật' : 'Đang tải…'}
          </button>
        </div>
      )}
    </>
  );
}
