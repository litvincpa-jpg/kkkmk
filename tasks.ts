import { DECOY_LETTERS, WORDS, byKey, type Word } from './words';
import { letterId, txt, type LPhrase, type PhraseId } from './phrases';
import { pickOne } from '@/game/tasks';

export const TASKS_PER_LEVEL = 6;

export type LetterChoice = string | number;

export interface FirstTask {
  id: string;
  kind: 'first' | 'missing';
  word: Word;
  options: string[];
  answer: string;
}
export interface PickTask {
  id: string;
  kind: 'picture';
  word: Word;
  options: Word[];
  answer: number;
}
export type LTask = FirstTask | PickTask;

export interface LetterLevel {
  id: number;
  name: string;
  desc: string;
  icon: string;
  /** shown — все слова, уже показанные в этом уровне (включая варианты) */
  gen: (index: number, previous: LTask | null, shown: Set<string>) => LTask;
}

/* Пools уровней 1–4 не пересекаются, поэтому в одном проходе каждая картинка
   встречается один раз. Уровни 5–6 — повторение: ребёнок закрепляет всю азбуку. */
const P1 = ['fox', 'cat', 'mouse', 'duck', 'apple', 'ball'];
const P2 = ['pear', 'fish', 'strawberry', 'wolf', 'lemon', 'house'];
const P3 = ['tulip', 'watermelon', 'zebra', 'cucumber', 'acorn', 'parrot'];
const P4 = ['elephant', 'tiger', 'turtle', 'rhino', 'butterfly', 'fox'];
const ALL = WORDS.map((w) => w.key);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function letterOptions(word: Word, count: number): string[] {
  const rest = shuffle(DECOY_LETTERS.split('').filter((l) => l !== word.letter)).slice(0, count - 1);
  return shuffle([word.letter, ...rest]);
}

function genFirst(pool: string[], count: number, shown: Set<string>, kind: 'first' | 'missing'): FirstTask {
  let word = byKey(pickOne(pool));
  for (let i = 0; i < 80; i++) {
    const cand = byKey(pickOne(pool));
    if (!shown.has(cand.key)) {
      word = cand;
      break;
    }
  }
  const id = `${kind}-${word.key}`;
  return { id, kind, word, options: letterOptions(word, count), answer: word.letter };
}

function genPick(pool: string[], shown: Set<string>): PickTask {
  let word = byKey(pickOne(pool));
  for (let i = 0; i < 80; i++) {
    const cand = byKey(pickOne(pool));
    if (!shown.has(cand.key)) {
      word = cand;
      break;
    }
  }
  // варианты-картинки: другие буквы и слова, которые ещё не показывали в уровне
  const poolSet = new Set(pool);
  let decoys = shuffle(WORDS.filter((w) => !poolSet.has(w.key) && !shown.has(w.key) && w.letter !== word.letter)).slice(0, 2);
  if (decoys.length < 2) {
    const rest = shuffle(WORDS.filter((w) => !shown.has(w.key) && w.key !== word.key && w.letter !== word.letter && !decoys.includes(w)));
    decoys = [...decoys, ...rest].slice(0, 2);
  }
  const options = shuffle([word, ...decoys]);
  return { id: `pick-${word.key}`, kind: 'picture', word, options, answer: options.indexOf(word) };
}

export const LETTERS_LEVELS: LetterLevel[] = [
  { id: 1, name: 'Первые буквы', desc: 'с картинкой', icon: byKey('fox').src, gen: (i, _p, shown) => genFirst(P1, 3, shown, i === 3 ? 'missing' : 'first') },
  { id: 2, name: 'Больше слов', desc: 'первая буква', icon: byKey('cat').src, gen: (_i, _p, shown) => genFirst(P2, 3, shown, 'first') },
  { id: 3, name: 'Буква и картинка', desc: 'найди слово', icon: byKey('parrot').src, gen: (_i, _p, shown) => genPick(P3, shown) },
  { id: 4, name: 'Пропущенная буква', desc: 'допиши слово', icon: byKey('lemon').src, gen: (_i, _p, shown) => genFirst(P4, 3, shown, 'missing') },
  { id: 5, name: 'Сложные буквы', desc: 'четыре выбора', icon: byKey('elephant').src, gen: (_i, _p, shown) => genFirst(ALL, 4, shown, 'first') },
  {
    id: 6,
    name: 'Всё вместе',
    desc: 'проверь себя',
    icon: byKey('watermelon').src,
    gen: (i, _p, shown) => {
      if (i % 3 === 1) return genPick(ALL, shown);
      if (i % 3 === 2) return genFirst(ALL, 4, shown, 'missing');
      return genFirst(ALL, 4, shown, 'first');
    },
  },
];

export function makeLetterTasks(level: LetterLevel): LTask[] {
  const tasks: LTask[] = [];
  const shown = new Set<string>();
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    const task = level.gen(i, tasks[tasks.length - 1] ?? null, shown);
    shown.add(task.word.key);
    if (task.kind === 'picture') {
      task.options.forEach((o) => shown.add(o.key));
    }
    tasks.push(task);
  }
  return tasks;
}

export const starsForLetters = (mistakes: number) => (mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1);

export function questionText(t: LTask): string {
  switch (t.kind) {
    case 'first':
      return 'С какой буквы начинается слово?';
    case 'missing':
      return 'Какая буква пропущена?';
    case 'picture':
      return `Какое слово начинается с буквы ${t.word.letter.toUpperCase()}?`;
  }
}

export function questionParts(t: LTask): LPhrase[] {
  switch (t.kind) {
    case 'first':
      return ['q_a', t.word.wordId];
    case 'missing':
      return ['q_c'];
    case 'picture':
      return ['q_b', letterId(t.word.letter)];
  }
}

export function correctParts(t: LTask, praise: PhraseId): LPhrase[] {
  switch (t.kind) {
    case 'first':
    case 'missing':
      return [praise, t.word.wordId, 'starts', letterId(t.word.letter)];
    case 'picture':
      return [praise, t.word.wordId];
  }
}

export const introId = (t: LTask): PhraseId => (t.kind === 'first' ? 'intro_1' : t.kind === 'missing' ? 'intro_3' : 'intro_2');
export const introText = (t: LTask): string => txt(introId(t));

export const idleTipId = (t: LTask): PhraseId => (t.kind === 'picture' ? 'tip_tap' : 'tip_tap');
export const canHint = (_t: LTask) => true;
