export interface LettersSave {
  stars: Record<string, number>;
  sound: boolean;
}

const KEY = 'playkids:letters:v1';
const DEFAULT: LettersSave = { stars: {}, sound: true };

export function loadLettersSave(): LettersSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const d = JSON.parse(raw) as Partial<LettersSave>;
    return { stars: { ...(d.stars ?? {}) }, sound: d.sound !== false };
  } catch {
    return DEFAULT;
  }
}

export function storeLettersSave(d: LettersSave) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}
