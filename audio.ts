/* Звуковые эффекты синтезируются Web Audio API.
   Голос — записанные фразы (см. voice.ts); браузерный синтез остаётся запасным вариантом. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voiceBus: GainNode | null = null;
let enabled = true;
let speechUnlocked = false;

export const isSoundEnabled = () => enabled;

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (!v) stopSpeech();
}

/** Создаёт AudioContext (можно заранее — он проснётся после первого касания) */
export function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    voiceBus = ctx.createGain();
    voiceBus.gain.value = 1;
    voiceBus.connect(master);
  } catch {
    return null;
  }
  return ctx;
}

export function voiceOutput(): AudioNode | null {
  getCtx();
  return voiceBus;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state !== 'running') void c.resume().catch(() => undefined);
  if (!speechUnlocked && 'speechSynthesis' in window) {
    speechUnlocked = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, freqEnd?: number) {
  const c = getCtx();
  if (!enabled || !c || !master) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];

export const sfx = {
  tap: () => tone(620, 0, 0.09, 'sine', 0.16, 900),
  pop: () => tone(380, 0, 0.1, 'sine', 0.2, 1050),
  count: (n: number) => {
    const f = 523.25 * Math.pow(2, SCALE[(n - 1) % SCALE.length] / 12);
    tone(f, 0, 0.16, 'triangle', 0.14);
    tone(f * 2, 0, 0.08, 'sine', 0.04);
  },
  correct: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.085, 0.26, 'triangle', 0.18));
    tone(1568, 0.36, 0.35, 'sine', 0.07);
  },
  wrong: () => {
    tone(311, 0, 0.18, 'triangle', 0.18, 277);
    tone(247, 0.18, 0.3, 'triangle', 0.18, 196);
  },
  star: () => [1318.5, 1760, 2349.3].forEach((f, i) => tone(f, i * 0.07, 0.22, 'sine', 0.12)),
  win: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.13, 0.26, 0.39, 0.56, 0.69];
    notes.forEach((f, i) => tone(f, times[i], i === notes.length - 1 ? 0.75 : 0.16, 'triangle', 0.18));
    [523.25, 659.25, 783.99].forEach((f) => tone(f, 0.69, 0.85, 'sine', 0.06));
  },
  squeak: () => {
    tone(980, 0, 0.09, 'sine', 0.14, 1500);
    tone(1400, 0.1, 0.12, 'sine', 0.12, 1050);
  },
};

/* ---------------- Запасной голос: браузерный синтез ---------------- */

let voice: SpeechSynthesisVoice | null = null;

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const vs = window.speechSynthesis.getVoices();
  if (!vs.length) return;
  const ru = vs.filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith('ru'));
  voice =
    ru.find((v) => /google/i.test(v.name)) ||
    ru.find((v) => /(milena|svetlana|dariya|natalia|alena|irina|natural|online)/i.test(v.name)) ||
    ru[0] ||
    null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

let speakTimer = 0;

export function say(text: string, rate = 0.95) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const doSpeak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.15;
    synth.speak(u);
  };
  window.clearTimeout(speakTimer);
  if (synth.speaking || synth.pending) {
    synth.cancel();
    speakTimer = window.setTimeout(doSpeak, 80);
  } else {
    doSpeak();
  }
}

export function stopSpeech() {
  window.clearTimeout(speakTimer);
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
