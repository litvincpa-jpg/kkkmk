/* Общее ядро озвучки: один MP3-спрайт фраз на одного персонажа.
   Конкретные голоса (бельчонок, мишка) создаются через createVoiceEngine. */

import { getCtx, isSoundEnabled, say, stopSpeech, voiceOutput } from './audio';

export type SpriteMap = Record<string, [number, number]>;

export interface VoiceEngine {
  load: () => Promise<AudioBuffer | null>;
  stop: () => void;
  speak: (fallbackText: string, segments: [number, number][], opts?: { gap?: number }) => void;
  duration: (segments: [number, number][], gap?: number) => number;
}

export function createVoiceEngine(url: string): VoiceEngine {
  let buffer: AudioBuffer | null = null;
  let loading: Promise<AudioBuffer | null> | null = null;
  let active: AudioBufferSourceNode[] = [];
  let token = 0;

  async function bytesOf(u: string): Promise<ArrayBuffer> {
    if (u.startsWith('data:')) {
      const bin = atob(u.slice(u.indexOf(',') + 1));
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out.buffer;
    }
    const res = await fetch(u);
    return res.arrayBuffer();
  }

  function decode(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const ok = (b: AudioBuffer) => {
        if (!settled) {
          settled = true;
          resolve(b);
        }
      };
      const fail = (e: unknown) => {
        if (!settled) {
          settled = true;
          reject(e);
        }
      };
      try {
        const p = ctx.decodeAudioData(data, ok, fail) as unknown;
        if (p && typeof (p as Promise<AudioBuffer>).then === 'function') (p as Promise<AudioBuffer>).then(ok, fail);
      } catch (e) {
        fail(e);
      }
    });
  }

  function load(): Promise<AudioBuffer | null> {
    if (buffer) return Promise.resolve(buffer);
    if (loading) return loading;
    const ctx = getCtx();
    if (!ctx) return Promise.resolve(null);
    const p = (async () => {
      try {
        buffer = await decode(ctx, await bytesOf(url));
        return buffer;
      } catch {
        loading = null;
        return null;
      }
    })();
    loading = p;
    return p;
  }

  function stop() {
    token++;
    for (const s of active) {
      try {
        s.onended = null;
        s.stop();
      } catch {
        /* ignore */
      }
    }
    active = [];
    stopSpeech();
  }

  function schedule(ctx: AudioContext, buf: AudioBuffer, segs: [number, number][], my: number, gap: number) {
    const out = voiceOutput();
    if (!out) return;
    if (ctx.state !== 'running') {
      void ctx.resume().catch(() => undefined);
      // если контекст так и не проснулся — не копим «залежавшиеся» фразы
      window.setTimeout(() => {
        if (ctx.state !== 'running' && my === token) stop();
      }, 1500);
    }
    let t = ctx.currentTime + 0.02;
    for (const [start, dur] of segs) {
      const lead = Math.min(0.03, start);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(out);
      src.start(t, start - lead, dur + lead + 0.08);
      src.onended = () => {
        active = active.filter((s) => s !== src);
      };
      active.push(src);
      t += dur + lead + gap;
    }
  }

  function speak(fallbackText: string, segs: [number, number][], opts: { gap?: number } = {}) {
    stop();
    if (!isSoundEnabled() || !segs.length) return;
    const my = token;
    const gap = opts.gap ?? 0.07;
    const ctx = getCtx();
    if (!ctx) {
      say(fallbackText);
      return;
    }
    if (buffer) {
      schedule(ctx, buffer, segs, my, gap);
      return;
    }
    const timeout = new Promise<null>((r) => window.setTimeout(() => r(null), 2500));
    void Promise.race([load(), timeout]).then((b) => {
      if (my !== token) return;
      if (b) schedule(ctx, b, segs, my, gap);
      else say(fallbackText);
    });
  }

  function duration(segs: [number, number][], gap = 0.07) {
    return segs.reduce((acc, s) => acc + s[1] + gap, 0);
  }

  return { load, stop, speak, duration };
}
