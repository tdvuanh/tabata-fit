import { getData } from './store';

let ctx: AudioContext | null = null;

/** Must run inside a tap handler: iOS only allows sound after a user gesture. */
export function unlockAudio() {
  // iOS 17+: 'playback' keeps sound on when the ring/silent switch is on silent (default 'ambient' mutes it)
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = 'playback';
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  // a silent utterance unlocks speechSynthesis on iOS
  if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(''));
}

export function beep(high = false) {
  const s = getData().settings;
  if (!s.beep || !ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = high ? 1320 : 880;
  g.gain.setValueAtTime(s.volume, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (high ? 0.4 : 0.15));
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + (high ? 0.4 : 0.15));
}

export function say(text: string) {
  const s = getData().settings;
  if (!s.voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = s.voiceLang;
  u.volume = s.volume;
  speechSynthesis.speak(u);
}

export function buzz() {
  if (getData().settings.vibrate) navigator.vibrate?.(200);
}

export const canVibrate = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;
