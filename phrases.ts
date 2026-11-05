import phrases from '@/assets/letters/phrases.json';

export type PhraseId = keyof typeof phrases;

export const txt = (id: PhraseId): string => phrases[id];

const LETTER_KEY: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ж: 'zh', з: 'z', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ч: 'ch', я: 'ya',
};

/** Идентификатор записанной формы «буквы X» (после предлога «с») */
export const letterId = (letter: string): PhraseId => `letter_${LETTER_KEY[letter] ?? 'a'}` as PhraseId;

export const PRAISE_IDS: PhraseId[] = ['praise_1', 'praise_2', 'praise_3', 'praise_4', 'praise_5', 'praise_6'];
export const WRONG_IDS: PhraseId[] = ['wrong_1', 'wrong_2', 'wrong_3'];
export const FUN_IDS: PhraseId[] = ['fun_1', 'fun_2', 'fun_3'];

/** Фраза из спрайта: либо фиксированная, либо динамическая (слово / буква) */
export type LPhrase = PhraseId | (string & {});
