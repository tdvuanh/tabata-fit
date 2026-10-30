import type { Schedule } from './store';
import type { WorkoutSet } from './timeline';
import { totalSec } from './timeline.ts';

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
/** JS getDay() (0 = Sun) → 1 = Mon … 7 = Sun */
export const isoDow = (d: Date) => ((d.getDay() + 6) % 7) + 1;

function at(date: Date, time: string) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Next local start time of a schedule at or after `from`, or null if a one-off already passed. */
export function nextOccurrence(s: Schedule, from = new Date()): Date | null {
  const [y, mo, d] = s.startDate.split('-').map(Number);
  const first = at(new Date(y, mo - 1, d), s.time);
  if (!s.repeatDays.length) return first >= from ? first : null;
  const day = first > from ? first : at(from, s.time);
  for (let i = 0; i < 8; i++) {
    const c = new Date(day);
    c.setDate(day.getDate() + i);
    if (s.repeatDays.includes(isoDow(c)) && c >= from && c >= first) return c;
  }
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const esc = (t: string) => t.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');

export function toIcs(s: Schedule, set: WorkoutSet, tz = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const [y, mo, d] = s.startDate.split('-').map(Number);
  let start = at(new Date(y, mo - 1, d), s.time);
  // RRULE needs DTSTART to be one of the BYDAY days.
  if (s.repeatDays.length) start = nextOccurrence(s, start) ?? start;
  const end = new Date(start.getTime() + Math.max(60, totalSec(set)) * 1000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tabata PWA//VI', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${s.id}@tabata-pwa`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${tz}:${local(start)}`,
    `DTEND;TZID=${tz}:${local(end)}`,
    `SUMMARY:${esc('Tập Tabata: ' + set.name)}`,
    `DESCRIPTION:${esc(`${set.sets} set · ${set.workSec}s tập / ${set.restSec}s nghỉ · ${set.rounds} hiệp`)}`,
    ...(s.repeatDays.length ? [`RRULE:FREQ=WEEKLY;BYDAY=${s.repeatDays.map((n) => BYDAY[n - 1]).join(',')}`] : []),
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Sắp đến giờ tập ' + set.name)}`, `TRIGGER:-PT${s.remindBeforeMin}M`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

/** Share the .ics file where the platform allows it, otherwise download it. */
export async function deliverIcs(text: string, name: string) {
  const file = new File([text], `${name}.ics`, { type: 'text/calendar' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
