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
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  const view =
    page === 'run' && id ? <Run key={id} setId={id} />
    : page === 'edit' ? <Builder key={id ?? 'new'} setId={id} />
    : page === 'sets' ? <Sets />
    : page === 'settings' ? <SettingsPage />
    : <Home />;
  return (
    <>
      {view}
      {needRefresh && page !== 'run' && (
        <div role="status" className="fixed inset-x-4 bottom-24 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
          <span className="flex-1 text-sm">Có bản mới của app.</span>
          <button className="h-11 rounded-full bg-work px-4 text-sm font-bold text-bg" onClick={() => updateServiceWorker(true)}>Cập nhật</button>
        </div>
      )}
    </>
  );
}
