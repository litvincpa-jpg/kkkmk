import type { Task } from './tasks';

/** Высота блока «белка на пне» относительно ширины пня */
export const SQUIRREL_RATIO = 1.574;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Metrics {
  w: number;
  h: number;
  landscape: boolean;
  pad: number;
  topH: number;
  stumpW: number;
  squirrelH: number;
  nextSize: number;
  content: Rect;
  gap: number;
  qH: number;
  aH: number;
  aW: number;
  aGap: number;
}

export function computeMetrics(w: number, h: number): Metrics {
  const landscape = w >= h * 1.15;
  const pad = clamp(Math.min(w, h) * 0.025, 8, 28);
  const topH = landscape ? clamp(h * 0.115, 46, 104) : clamp(h * 0.075, 46, 76);
  const stumpW = landscape
    ? Math.min((h * 0.66) / SQUIRREL_RATIO, w * 0.27)
    : Math.min((h * 0.27) / SQUIRREL_RATIO, w * 0.4);
  const squirrelH = stumpW * SQUIRREL_RATIO;
  const nextSize = landscape
    ? clamp(Math.min(h * 0.16, w * 0.12), 56, 150)
    : clamp(Math.min(w * 0.19, h * 0.1), 56, 110);

  let content: Rect;
  const top = topH + pad * 0.6;
  if (landscape) {
    const left = stumpW * 0.98 + pad;
    const right = pad + nextSize + pad * 0.5;
    content = { left, top, width: Math.max(220, w - left - right), height: Math.max(200, h - top - pad) };
  } else {
    const bottomReserve = Math.max(squirrelH * 0.9, nextSize + pad * 2);
    content = { left: pad, top, width: w - pad * 2, height: Math.max(220, h - top - bottomReserve) };
  }

  const gap = landscape ? clamp(h * 0.035, 8, 34) : clamp(h * 0.025, 8, 26);
  const qH = landscape ? clamp(h * 0.112, 42, 110) : clamp(h * 0.062, 42, 80);
  const aGap = landscape ? clamp(h * 0.025, 8, 26) : clamp(w * 0.025, 8, 18);
  let aH = landscape ? clamp(h * 0.18, 54, 172) : clamp(h * 0.11, 54, 130);
  let aW = aH * 1.14;
  const maxAW = (content.width - aGap * 3) / 4;
  if (aW > maxAW) {
    aW = maxAW;
    aH = Math.min(aH, aW / 0.98);
  }
  return { w, h, landscape, pad, topH, stumpW, squirrelH, nextSize, content, gap, qH, aH, aW, aGap };
}

/* Размеры в единицах «s» (размер одной картинки) */
const G = 0.14; // зазор между картинками
const P = 0.3; // внутренний отступ карточки
const SIGN = 0.62; // знак + − =
const RG = 0.18; // зазор между элементами примера
const cols = (n: number) => (n <= 5 ? n : Math.ceil(n / 2));
const rows = (n: number) => (n <= 5 ? 1 : 2);
const cardW = (n: number) => cols(n) + (cols(n) - 1) * G + 2 * P;
const cardH = (n: number) => rows(n) + (rows(n) - 1) * G + 2 * P;
const SLOT = 1 + 2 * P;

export function boardSize(task: Task, m: Metrics): { s: number; wrap: boolean } {
  const hasAnswers = task.kind !== 'compare';
  const availH = m.content.height - m.qH - m.gap * (hasAnswers ? 2.4 : 1.4) - (hasAnswers ? m.aH + 8 : 0);
  const availW = m.content.width;
  let single = 0;
  let wrapped = 0;

  switch (task.kind) {
    case 'add':
    case 'sub': {
      const wS = cardW(task.a) + cardW(task.b) + SLOT + 2 * SIGN + 4 * RG;
      const hS = Math.max(cardH(task.a), cardH(task.b));
      single = Math.min(availW / wS, availH / hS);
      const wW = Math.max(cardW(task.a) + SIGN + RG, cardW(task.b) + SIGN + SLOT + 2 * RG);
      const hW = cardH(task.a) + Math.max(cardH(task.b), SLOT) + 0.3;
      wrapped = Math.min(availW / wW, availH / hW);
      break;
    }
    case 'count': {
      const wS = cardW(task.n) + SIGN + SLOT + 2 * RG;
      single = Math.min(availW / wS, availH / cardH(task.n));
      wrapped = Math.min(availW / cardW(task.n), availH / (cardH(task.n) + SLOT + 0.3));
      break;
    }
    case 'compare': {
      const wS = cardW(task.left) + cardW(task.right) + 0.95 + 0.5;
      const hS = Math.max(cardH(task.left), cardH(task.right)) + 0.4;
      single = Math.min(availW / wS, availH / hS);
      const wW = Math.max(cardW(task.left), cardW(task.right)) + 0.4;
      const hW = cardH(task.left) + cardH(task.right) + 0.95 + 0.5;
      wrapped = Math.min(availW / wW, availH / hW);
      break;
    }
    case 'seq': {
      const n = task.seq.length;
      single = Math.min(availW / (n + (n - 1) * 0.22), availH / 1.3);
      wrapped = 0;
      break;
    }
  }

  const useWrap = single < 58 && wrapped > single * 1.15;
  const max = task.kind === 'seq' ? Math.min(150, m.h * 0.2) : Math.min(132, m.h * 0.15);
  const s = clamp(useWrap ? wrapped : single, 22, max);
  return { s, wrap: useWrap };
}
