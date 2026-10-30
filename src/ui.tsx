import { useSyncExternalStore, type ReactNode } from 'react';

/* ---------- hash router: #/run/abc → ['run', 'abc'] ---------- */
const sub = (l: () => void) => (addEventListener('hashchange', l), () => removeEventListener('hashchange', l));
export function useRoute(): string[] {
  const h = useSyncExternalStore(sub, () => location.hash);
  return h.replace(/^#\/?/, '').split('/').filter(Boolean);
}
export const go = (path: string) => (location.hash = path);

/* ---------- icons (stroke, inherit color) ---------- */
const P = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  cal: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 3v4M16 3v4',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  back: 'M15 18l-6-6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  sound: 'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  mute: 'M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
};
export function Icon({ name, size = 20 }: { name: keyof typeof P; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
export const Play = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>
);

/* ---------- layout ---------- */
export function Screen({ children, nav, footer }: { children: ReactNode; nav?: 'home' | 'schedule' | 'sets'; footer?: ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-[max(24px,env(safe-area-inset-top))] pb-6">{children}</main>
      {footer}
      {nav && <NavBar active={nav} />}
    </div>
  );
}

function NavBar({ active }: { active: string }) {
  const items = [
    ['home', '#/', 'home', 'Hôm nay'],
    ['schedule', '#/schedule', 'cal', 'Lịch'],
    ['sets', '#/sets', 'layers', 'Mẫu'],
  ] as const;
  return (
    <nav aria-label="Điều hướng chính" className="grid shrink-0 grid-cols-3 border-t border-[#22252a] bg-bar pb-[max(10px,env(safe-area-inset-bottom))]">
      {items.map(([k, href, icon, label]) => (
        <a key={k} href={href} aria-current={active === k ? 'page' : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active === k ? 'text-work' : 'text-ink-3'}`}>
          <Icon name={icon} size={22} />{label}
        </a>
      ))}
    </nav>
  );
}

export function TopBar({ title, back, right }: { title: string; back: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <a href={back} aria-label="Quay lại" className="flex size-11 items-center justify-center rounded-full bg-surface"><Icon name="back" /></a>
      <h1 className="text-[17px] font-bold">{title}</h1>
      <div className="flex min-w-11 justify-end">{right}</div>
    </div>
  );
}

export function Stepper({ label, value, onChange, step = 1, min = 0, max = 600, unit = '', dot }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; dot: string;
}) {
  const btn = 'size-11 rounded-xl bg-surface-2 text-xl disabled:opacity-30';
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs text-ink-3"><span className="size-2 rounded-full" style={{ background: dot }} />{label}</span>
      <div className="flex items-center justify-between">
        <button type="button" className={btn} aria-label={`Giảm ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
        <span className="font-num text-[28px] font-bold" aria-live="polite">{value}{unit}</span>
        <button type="button" className={btn} aria-label={`Tăng ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
      </div>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-3 border-b border-[#22252a] px-4 py-3.5 last:border-0">
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{label}</span>
        {hint && <span className="text-xs text-ink-3">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const field = 'h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-[15px] text-ink';
export const primary = 'flex h-13 items-center justify-center gap-2 rounded-full bg-work px-5 font-bold text-bg';
export const ghost = 'flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold';
