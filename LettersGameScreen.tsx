import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Volume2, VolumeX } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { computeMetrics } from '@/game/layout';
import { sfx } from '@/game/audio';
import { pickOne } from '@/game/tasks';
import {
  LETTERS_LEVELS,
  TASKS_PER_LEVEL,
  correctParts,
  introId,
  introText,
  makeLetterTasks,
  questionParts,
  questionText,
  starsForLetters,
  type LetterChoice,
} from '@/letters/tasks';
import { PRAISE_IDS, WRONG_IDS, txt, type PhraseId } from '@/letters/phrases';
import { bear } from '@/letters/words';
import { speakL, stopLettersVoice } from '@/letters/voice';
import { bigConfetti, burstFrom } from '@/game/fx';
import { AVATARS, type Avatar } from '@/game/storage';
import { Mascot, type Bubble, type Mood } from '@/components/Mascot';
import { AvatarPill, NextButton, ProgressStars, QuestionPill, RoundButton } from '@/components/ui';
import { LevelComplete, ConfirmDialog } from '@/components/Modals';
import { cn } from '@/utils/cn';

const TILE_COLORS: [string, string, string][] = [
  ['#F2604F', '#D8372B', '#A82418'],
  ['#42A5EA', '#1E7FD1', '#155FA8'],
  ['#5FC23B', '#3F9E1F', '#2C7A12'],
  ['#B07BE8', '#8E54CE', '#6E3AA6'],
];

const tileColor = (letter: string) => TILE_COLORS[(letter.charCodeAt(0) * 7 + letter.length) % TILE_COLORS.length];

interface Props {
  levelId: number;
  avatar: Avatar;
  sound: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onHome: () => void;
  onFinish: (stars: number) => void;
  onReplay: () => void;
  onNext: (() => void) | null;
}

function LetterTile({
  letter,
  size,
  wrong,
  solved,
  correct,
  pulse,
  delay,
  colorIndex,
  onPick,
}: {
  letter: string;
  size: number;
  wrong: boolean;
  solved: boolean;
  correct: boolean;
  pulse: boolean;
  delay: number;
  colorIndex: number;
  onPick: (el: HTMLElement) => void;
}) {
  const [top, bottom, shadow] = TILE_COLORS[colorIndex % TILE_COLORS.length];
  const depth = size * 0.09;
  return (
    <motion.button
      type="button"
      data-letter={letter}
      disabled={solved || wrong}
      onClick={(e) => onPick(e.currentTarget)}
      whileTap={solved || wrong ? undefined : { y: depth * 0.7 }}
      initial={{ scale: 0, rotate: -15, opacity: 0 }}
      animate={
        wrong
          ? { x: [0, -10, 10, -7, 7, 0], scale: 1, opacity: 0.35 }
          : correct
            ? { scale: [1, 1.22, 0.97, 1.06, 1], rotate: 0, opacity: 1 }
            : { scale: 1, rotate: 0, opacity: 1 }
        }
      transition={{ delay: wrong || correct ? 0 : delay, type: 'spring', stiffness: 420, damping: 17, duration: wrong ? 0.4 : 0.35 }}
      className={cn('relative grid place-items-center rounded-[23%] font-black leading-none text-white', pulse && 'glow-pulse')}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
        border: `${Math.max(3, size * 0.045)}px solid rgba(255,255,255,.85)`,
        boxShadow: `0 ${depth}px 0 ${shadow}, inset 0 ${size * 0.07}px 0 rgba(255,255,255,.35)`,
        fontSize: size * 0.55,
        textShadow: '0 3px 0 rgba(0,0,0,.28)',
        filter: wrong ? 'grayscale(.8)' : undefined,
      }}
    >
      {letter.toUpperCase()}
      {correct && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 14 }}
          className="absolute grid place-items-center rounded-full bg-white"
          style={{ top: -size * 0.12, right: -size * 0.12, width: size * 0.34, height: size * 0.34, boxShadow: '0 3px 8px rgba(0,0,0,.25)' }}
        >
          <span className="font-black" style={{ fontSize: size * 0.2, color: '#4FAE26' }}>
            ✓
          </span>
        </motion.span>
      )}
    </motion.button>
  );
}

function WordCard({
  word,
  width,
  imgRatio,
  missing,
  solved,
}: {
  word: { word: string; src: string; letter: string };
  width: number;
  imgRatio: number;
  missing: boolean;
  solved: boolean;
}) {
  const pad = width * 0.055;
  const label = width * 0.115;
  const rest = missing ? word.word.slice(1) : word.word;
  return (
    <motion.div
      initial={{ scale: 0.7, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="panel flex flex-col items-center"
      style={{ width, borderRadius: width * 0.13, padding: pad }}
    >
      <img src={word.src} alt={word.word} style={{ height: width * imgRatio, filter: 'drop-shadow(0 5px 5px rgba(90,50,10,.22))' }} />
      <div className="flex items-center font-black" style={{ gap: width * 0.02, marginTop: width * 0.02, fontSize: label, color: '#2B4A8B', minHeight: label * 1.4 }}>
        {missing && (
          <motion.span
            key={solved ? 'filled' : 'empty'}
            initial={solved ? { scale: 0.3, rotate: -12 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 15, delay: solved ? 0.15 : 0 }}
            className={cn('grid place-items-center', !solved && 'font-black')}
            style={{
              width: label * 1.15,
              height: label * 1.15,
              borderRadius: label * 0.32,
              border: solved ? 'none' : `${Math.max(3, label * 0.09)}px dashed #B9A98F`,
              background: solved ? 'linear-gradient(180deg,#7ED36A,#4CAF2E)' : '#FFF9E9',
              color: solved ? '#fff' : '#C9B98F',
              fontSize: label * 0.8,
              boxShadow: solved ? '0 3px 0 #3A8A1E' : undefined,
            }}
          >
            {solved ? word.letter.toUpperCase() : '?'}
          </motion.span>
        )}
        <span>{rest}</span>
      </div>
    </motion.div>
  );
}

function BigLetter({ letter, size, delay }: { letter: string; size: number; delay: number }) {
  const [top, bottom, shadow] = tileColor(letter);
  return (
    <motion.div
      initial={{ scale: 0, rotate: -15, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 380, damping: 16 }}
      className="grid place-items-center rounded-[23%] font-black leading-none text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
        border: `${Math.max(3, size * 0.04)}px solid rgba(255,255,255,.85)`,
        boxShadow: `0 ${size * 0.09}px 0 ${shadow}, inset 0 ${size * 0.07}px 0 rgba(255,255,255,.35)`,
        fontSize: size * 0.55,
        textShadow: '0 4px 0 rgba(0,0,0,.28)',
      }}
    >
      {letter.toUpperCase()}
    </motion.div>
  );
}

function PictureCard({
  word,
  size,
  wrong,
  solved,
  correct,
  delay,
  onPick,
}: {
  word: { word: string; src: string };
  size: number;
  wrong: boolean;
  solved: boolean;
  correct: boolean;
  delay: number;
  onPick: (el: HTMLElement) => void;
}) {
  return (
    <motion.button
      type="button"
      data-idx={word.word}
      disabled={solved || wrong}
      onClick={(e) => onPick(e.currentTarget)}
      whileTap={solved || wrong ? undefined : { y: 6 }}
      initial={{ scale: 0, y: 24, opacity: 0 }}
      animate={wrong ? { x: [0, -9, 9, -6, 6, 0], scale: 1, opacity: 0.35 } : correct ? { scale: [1, 1.12, 1] } : { scale: 1, opacity: solved && !correct ? 0.55 : 1 }}
      transition={{ delay: wrong || correct ? 0 : delay, type: 'spring', stiffness: 380, damping: 16 }}
      className="panel flex flex-col items-center"
      style={{
        width: size,
        padding: size * 0.07,
        borderRadius: size * 0.18,
        boxShadow: correct
          ? `0 0 0 ${Math.max(4, size * 0.05)}px #5DBB34, 0 6px 0 #e3cfa6, 0 14px 22px rgba(92,58,24,.22)`
          : undefined,
      }}
    >
      <img src={word.src} alt={word.word} style={{ height: size * 0.52, filter: 'drop-shadow(0 4px 4px rgba(90,50,10,.2))' }} />
      <span
        className="font-black"
        style={{ fontSize: size * 0.1, color: '#2B4A8B', marginTop: size * 0.03, minHeight: size * 0.16 }}
      >
        {solved && correct ? word.word : ''}
      </span>
    </motion.button>
  );
}

export function LettersGameScreen({ levelId, avatar, sound, onToggleSound, onExit, onHome, onFinish, onReplay, onNext }: Props) {
  const { w, h } = useViewport();
  const m = useMemo(() => computeMetrics(w, h), [w, h]);
  const level = LETTERS_LEVELS.find((l) => l.id === levelId) ?? LETTERS_LEVELS[0];
  const [tasks] = useState(() => makeLetterTasks(level));
  const [idx, setIdx] = useState(0);
  const task = tasks[idx];
  const [wrong, setWrong] = useState<LetterChoice[]>([]);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hinting, setHinting] = useState(false);
  const [mood, setMood] = useState<{ type: Mood; key: number }>({ type: 'idle', key: 0 });
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const bubbleTimer = useRef(0);
  const hintDelay = useRef(0);

  const progress = (idx + (solved ? 1 : 0)) / tasks.length;
  const isPicture = task.kind === 'picture';
  const bottomCount = isPicture ? 3 : task.options.length;
  const gapB = m.landscape ? m.gap * 0.7 : 10;
  const bottomSize = m.landscape
    ? Math.min((m.content.width - (bottomCount - 1) * gapB) / bottomCount, m.h * 0.16, 150)
    : Math.min((w * 0.92 - (bottomCount - 1) * gapB) / bottomCount, m.h * 0.105, 118);
  const cardW = isPicture
    ? Math.min(m.content.width * 0.62, m.h * 0.6, 600)
    : m.landscape
      ? Math.min(m.content.width * 0.5, m.h * 0.56, 540)
      : Math.min(w * 0.72, m.h * 0.34, 460);
  const imgRatio = isPicture ? 0.5 : m.landscape ? 0.46 : 0.4;
  const bigLetter = isPicture ? Math.min(m.content.height * 0.32, m.landscape ? 230 : 180) : 0;

  const react = useCallback((type: Mood) => setMood((s) => ({ type, key: s.key + 1 })), []);
  const showBubble = useCallback((text: string, ms = 2600) => {
    window.clearTimeout(bubbleTimer.current);
    setBubble({ text, key: Date.now() });
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  }, []);
  const talk = useCallback(
    (ids: (PhraseId | string)[], bubbleText: string, ms?: number) => {
      showBubble(bubbleText, ms);
      react('talk');
      speakL(ids);
    },
    [showBubble, react],
  );

  // Новое задание: озвучиваем вопрос
  useEffect(() => {
    const t = window.setTimeout(
      () => {
        if (idx === 0) {
          talk([introId(task), ...questionParts(task)], introText(task), 3400);
        } else {
          react('talk');
          speakL(questionParts(task));
        }
      },
      idx === 0 ? 550 : 400,
    );
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(hintDelay.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Очистка при выходе
  useEffect(
    () => () => {
      window.clearTimeout(bubbleTimer.current);
      window.clearTimeout(hintDelay.current);
      stopLettersVoice();
    },
    [],
  );

  // Подсказка при бездействии
  useEffect(() => {
    if (result != null || confirmExit || hinting) return;
    const t = window.setTimeout(
      () => {
        if (solved) talk(['tip_arrow'], txt('tip_arrow'), 3600);
        else if (isPicture) talk(questionParts(task), questionText(task), 3600);
        else talk(['tip_tap'], txt('tip_tap'), 3600);
      },
      solved ? 6500 : 16000,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, solved, wrong.length, result, confirmExit, hinting]);

  const pick = (choice: LetterChoice, el?: Element | null) => {
    if (solved || result != null || wrong.includes(choice)) return;
    const isCorrect = choice === task.answer;
    if (isCorrect) {
      window.clearTimeout(hintDelay.current);
      setSolved(true);
      sfx.correct();
      burstFrom(el);
      const praise = pickOne(PRAISE_IDS);
      showBubble(txt(praise));
      react('happy');
      window.setTimeout(() => speakL(correctParts(task, praise)), 250);
      const before = idx / tasks.length;
      const after = (idx + 1) / tasks.length;
      if ([1 / 3, 2 / 3, 1].some((t) => before < t - 1e-6 && after >= t - 1e-6)) {
        window.setTimeout(() => sfx.star(), 650);
      }
    } else {
      const nextWrong = [...wrong, choice];
      setWrong(nextWrong);
      setMistakes((x) => x + 1);
      sfx.wrong();
      react('sad');
      const needHint = nextWrong.length >= 2 && !hinting;
      const phrase = needHint ? (['together', task.word.wordId] as const) : [pickOne(WRONG_IDS)];
      showBubble(txt(phrase[0]), needHint ? 3200 : 2400);
      speakL([...phrase]);
      if (needHint) {
        window.clearTimeout(hintDelay.current);
        hintDelay.current = window.setTimeout(() => setHinting(true), 1400);
      }
    }
  };

  const next = () => {
    if (!solved || result != null) return;
    sfx.tap();
    stopLettersVoice();
    if (idx < tasks.length - 1) {
      setIdx((i) => i + 1);
      setWrong([]);
      setSolved(false);
      setHinting(false);
      setBubble(null);
    } else {
      const stars = starsForLetters(mistakes);
      setResult(stars);
      onFinish(stars);
      sfx.win();
      bigConfetti();
      react('happy');
      window.setTimeout(() => speakL([stars === 3 ? 'win_3' : stars === 2 ? 'win_2' : 'win_1']), 350);
    }
  };

  const tapMascot = () => {
    sfx.squeak();
    if (solved) talk(['tip_arrow'], txt('tip_arrow'));
    else talk(questionParts(task), questionText(task));
  };

  const askHome = () => {
    sfx.tap();
    if (result != null || (idx === 0 && !solved)) {
      stopLettersVoice();
      onHome();
    } else {
      setConfirmExit(true);
    }
  };

  // Управление с клавиатуры
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result != null || confirmExit || document.querySelector('dialog[open]')) return;
      if ((e.key === 'Enter' || e.key === ' ') && solved) {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === 'ArrowRight' && solved) {
        next();
        return;
      }
      if (isPicture) {
        if (['1', '2', '3'].includes(e.key)) {
          const i = Number(e.key) - 1;
          const el = document.querySelector(`[data-idx="${task.options[i]?.word}"]`);
          pick(i, el);
        }
        return;
      }
      const k = e.key.toLowerCase();
      if (k.length === 1 && task.options.includes(k)) {
        const el = document.querySelector(`[data-letter="${k}"]`);
        pick(k, el);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pw = Math.min(w * 0.36, 620, m.content.width * 0.8);
  const barH = m.topH * (m.landscape ? 0.32 : 0.27);

  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-center"
        style={{ height: m.topH, paddingInline: m.pad, paddingTop: m.pad * 0.5, gap: m.pad }}
      >
        <RoundButton size={m.topH * 0.62} onClick={askHome} label="На сайт PlayKids">
          <Home size={m.topH * 0.29} strokeWidth={2.6} />
        </RoundButton>
        <AvatarPill src={AVATARS[avatar]} label={`Уровень ${level.id}`} size={m.topH * 0.82} onClick={onExit} compact={!m.landscape && w < 600} badge={level.id} />
        <div className="min-w-0 flex-1" style={{ paddingInline: barH * 0.8 }}>
          {!m.landscape && <ProgressStars value={progress} width="100%" height={barH} />}
        </div>
        <RoundButton size={m.topH * 0.78} onClick={onToggleSound} label={sound ? 'Выключить звук' : 'Включить звук'}>
          {sound ? <Volume2 size={m.topH * 0.36} strokeWidth={2.6} /> : <VolumeX size={m.topH * 0.36} strokeWidth={2.6} />}
        </RoundButton>
      </div>
      {m.landscape && (
        <div className="absolute z-30" style={{ left: m.content.left + m.content.width / 2 - pw / 2, top: m.pad * 0.5 + (m.topH - barH * 2.1) / 2, width: pw }}>
          <ProgressStars value={progress} width={pw} height={barH} />
        </div>
      )}

      <Mascot
        img={bear}
        ratio={1.5082}
        width={m.stumpW}
        mood={mood.type}
        moodKey={mood.key}
        bubble={bubble}
        placement={m.landscape ? 'top' : 'right'}
        maxBubbleWidth={m.landscape ? m.stumpW * 0.95 : w - m.stumpW - m.pad * 2}
        onTap={tapMascot}
        style={{ left: -m.stumpW * 0.04, bottom: 0 }}
      />

      <div
        className="absolute z-10 flex flex-col items-center justify-center"
        style={{ left: m.content.left, top: m.content.top, width: m.content.width, height: m.content.height }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={idx}
            className="flex flex-col items-center"
            style={{ gap: m.gap }}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.26 }}
          >
            <QuestionPill
              text={questionText(task)}
              height={m.qH}
              maxWidth={m.content.width}
              showIcon
              onClick={() => {
                sfx.tap();
                react('talk');
                speakL(questionParts(task));
              }}
            />

            {isPicture ? (
              <>
                <BigLetter letter={task.word.letter} size={bigLetter} delay={0.15} />
                <div className="flex items-center justify-center" style={{ gap: gapB }}>
                  {task.options.map((opt, i) => (
                    <PictureCard
                      key={opt.key}
                      word={opt}
                      size={bottomSize}
                      wrong={wrong.includes(i)}
                      solved={solved}
                      correct={solved && i === task.answer}
                      delay={0.3 + i * 0.08}
                      onPick={(el) => pick(i, el)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <WordCard word={task.word} width={cardW} imgRatio={imgRatio} missing={task.kind === 'missing'} solved={solved} />
                <div className="flex items-center justify-center" style={{ gap: gapB }}>
                  {task.options.map((opt, i) => (
                    <LetterTile
                      key={opt}
                      letter={opt}
                      size={bottomSize}
                      wrong={wrong.includes(opt)}
                      solved={solved}
                      correct={solved && opt === task.answer}
                      pulse={hinting && opt === task.answer}
                      delay={0.3 + i * 0.08}
                      colorIndex={i}
                      onPick={(el) => pick(opt, el)}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <NextButton size={m.nextSize} enabled={solved && result == null} onClick={next} style={{ right: m.pad, bottom: m.pad }} />

      <AnimatePresence>
        {result != null && (
          <LevelComplete
            levelId={level.id}
            stars={result}
            avatar={avatar}
            onMenu={() => {
              sfx.tap();
              onExit();
            }}
            onReplay={() => {
              sfx.tap();
              onReplay();
            }}
            onNext={
              onNext
                ? () => {
                    sfx.tap();
                    onNext();
                  }
                : null
            }
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmExit && (
          <ConfirmDialog
            text="Вернуться на сайт?"
            onYes={() => {
              sfx.tap();
              stopLettersVoice();
              onHome();
            }}
            onNo={() => {
              sfx.tap();
              setConfirmExit(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const LETTERS_TASKS_PER_LEVEL = TASKS_PER_LEVEL;
