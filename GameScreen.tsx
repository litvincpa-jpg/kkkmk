import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Volume2, VolumeX } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { boardSize, computeMetrics } from '@/game/layout';
import {
  canHint,
  correctParts,
  countIds,
  idleTipId,
  introId,
  makeLevelTasks,
  pickOne,
  questionParts,
  questionText,
  starsFor,
  type Choice,
  type LevelDef,
} from '@/game/tasks';
import { PRAISE_IDS, WRONG_IDS, num, txt, type PhraseId } from '@/game/phrases';
import { sfx } from '@/game/audio';
import { speak, stopVoice } from '@/game/voice';
import { bigConfetti, burstFrom } from '@/game/fx';
import { AVATARS, type Avatar } from '@/game/storage';
import { Squirrel, type Bubble, type Mood } from '@/components/Squirrel';
import { AvatarPill, NextButton, ProgressStars, QuestionPill, RoundButton } from '@/components/ui';
import { TaskBoard } from '@/components/TaskBoard';
import { AnswerButtons } from '@/components/AnswerButtons';
import { ConfirmDialog, LevelComplete } from '@/components/Modals';

interface Props {
  level: LevelDef;
  avatar: Avatar;
  sound: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onHome: () => void;
  onFinish: (stars: number) => void;
  onReplay: () => void;
  onNext: (() => void) | null;
}

export function GameScreen({ level, avatar, sound, onToggleSound, onExit, onHome, onFinish, onReplay, onNext }: Props) {
  const { w, h } = useViewport();
  const m = useMemo(() => computeMetrics(w, h), [w, h]);
  const [tasks] = useState(() => makeLevelTasks(level));
  const [idx, setIdx] = useState(0);
  const task = tasks[idx];
  const [wrong, setWrong] = useState<Choice[]>([]);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [hinting, setHinting] = useState(false);
  const [mood, setMood] = useState<{ type: Mood; key: number }>({ type: 'idle', key: 0 });
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const bubbleTimer = useRef(0);
  const hintTimer = useRef(0);
  const hintDelay = useRef(0);

  const board = useMemo(() => boardSize(task, m), [task, m]);
  const progress = (idx + (solved ? 1 : 0)) / tasks.length;

  const react = useCallback((type: Mood) => setMood((s) => ({ type, key: s.key + 1 })), []);
  const showBubble = useCallback((text: string, ms = 2600) => {
    window.clearTimeout(bubbleTimer.current);
    setBubble({ text, key: Date.now() });
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  }, []);
  const stopHint = useCallback(() => {
    window.clearInterval(hintTimer.current);
    setHinting(false);
  }, []);
  /** Белочка говорит: пузырь + голос */
  const talk = useCallback(
    (ids: PhraseId[], bubbleText?: string, ms?: number) => {
      showBubble(bubbleText ?? txt(ids[0]), ms);
      react('talk');
      speak(ids);
    },
    [showBubble, react],
  );

  // Новое задание: озвучиваем вопрос (в первом задании — сначала короткое вступление)
  useEffect(() => {
    const t = window.setTimeout(
      () => {
        if (idx === 0) {
          talk([introId(task), ...questionParts(task)], txt(introId(task)), 3400);
        } else {
          react('talk');
          speak(questionParts(task));
        }
      },
      idx === 0 ? 550 : 400,
    );
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(hintDelay.current);
      window.clearInterval(hintTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Очистка при выходе
  useEffect(
    () => () => {
      window.clearTimeout(bubbleTimer.current);
      window.clearTimeout(hintDelay.current);
      window.clearInterval(hintTimer.current);
      stopVoice();
    },
    [],
  );

  // Подсказка, если ребёнок долго ничего не делает
  useEffect(() => {
    if (result != null || confirmExit || hinting) return;
    const t = window.setTimeout(
      () => talk([solved ? 'tip_arrow' : idleTipId(task)], undefined, 3600),
      solved ? 6500 : 16000,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, solved, wrong.length, marks, result, confirmExit, hinting]);

  const startHint = () => {
    const ids = countIds(task);
    if (!ids.length) return;
    window.clearInterval(hintTimer.current);
    setHinting(true);
    setMarks({});
    let i = 0;
    hintTimer.current = window.setInterval(() => {
      if (i >= ids.length) {
        window.clearInterval(hintTimer.current);
        setHinting(false);
        return;
      }
      const id = ids[i];
      const n = i + 1;
      setMarks((mk) => ({ ...mk, [id]: n }));
      sfx.count(n);
      speak([num(n)]);
      i++;
    }, 820);
  };

  const pick = (choice: Choice, el?: Element | null) => {
    if (solved || result != null || wrong.includes(choice)) return;
    if (choice === task.answer) {
      window.clearTimeout(hintDelay.current);
      stopHint();
      setSolved(true);
      sfx.correct();
      burstFrom(el);
      const praise = pickOne(PRAISE_IDS);
      showBubble(txt(praise));
      react('happy');
      window.setTimeout(() => speak(correctParts(task, praise)), 250);
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
      const needHint = nextWrong.length >= 2 && canHint(task) && !hinting;
      const phrase: PhraseId = needHint ? 'together' : pickOne(WRONG_IDS);
      showBubble(txt(phrase), needHint ? 3200 : 2400);
      speak([phrase]);
      if (needHint) {
        window.clearTimeout(hintDelay.current);
        hintDelay.current = window.setTimeout(startHint, 1500);
      }
    }
  };

  const tapItem = (id: string) => {
    if (hinting) return;
    const ids = countIds(task);
    const counted = Object.keys(marks).length;
    if (marks[id] != null) {
      if (counted >= ids.length) {
        // всё посчитано — начинаем заново
        setMarks({ [id]: 1 });
        sfx.count(1);
        speak([num(1)]);
      } else {
        sfx.tap();
      }
      return;
    }
    const n = counted + 1;
    setMarks((mk) => ({ ...mk, [id]: n }));
    sfx.count(n);
    speak([num(n)]);
  };

  const next = () => {
    if (!solved || result != null) return;
    sfx.tap();
    stopVoice();
    stopHint();
    if (idx < tasks.length - 1) {
      setIdx((i) => i + 1);
      setWrong([]);
      setSolved(false);
      setMarks({});
      setBubble(null);
    } else {
      const stars = starsFor(mistakes);
      setResult(stars);
      onFinish(stars);
      sfx.win();
      bigConfetti();
      react('happy');
      window.setTimeout(() => speak([stars === 3 ? 'win_3' : stars === 2 ? 'win_2' : 'win_1']), 350);
    }
  };

  const tapSquirrel = () => {
    sfx.squeak();
    if (solved) talk(['tip_arrow']);
    else talk(questionParts(task), questionText(task));
  };

  const askExit = () => {
    sfx.tap();
    if (result != null || (idx === 0 && !solved)) {
      stopVoice();
      onExit();
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
      if (task.kind === 'compare') {
        if (e.key === 'ArrowLeft') pick('left', document.querySelector('[data-side="left"]'));
        else if (e.key === 'ArrowRight') {
          if (solved) next();
          else pick('right', document.querySelector('[data-side="right"]'));
        }
        return;
      }
      if (e.key === 'ArrowRight' && solved) {
        next();
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        const v = e.key === '0' ? 10 : Number(e.key);
        if (task.options.includes(v)) pick(v, document.querySelector(`[data-opt="${v}"]`));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pw = Math.min(w * 0.36, 620, m.content.width * 0.8);
  const barH = m.topH * (m.landscape ? 0.32 : 0.27);

  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Верхняя панель */}
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-center"
        style={{ height: m.topH, paddingInline: m.pad, paddingTop: m.pad * 0.5, gap: m.pad }}
      >
        <RoundButton size={m.topH * 0.62} onClick={onHome} label="На сайт PlayKids">
          <Home size={m.topH * 0.29} strokeWidth={2.6} />
        </RoundButton>
        <AvatarPill
          src={AVATARS[avatar]}
          label={`Уровень ${level.id}`}
          size={m.topH * 0.82}
          onClick={askExit}
          compact={!m.landscape && w < 600}
          badge={level.id}
        />
        <div className="min-w-0 flex-1" style={{ paddingInline: barH * 0.8 }}>
          {!m.landscape && <ProgressStars value={progress} width="100%" height={barH} />}
        </div>
        <RoundButton size={m.topH * 0.78} onClick={onToggleSound} label={sound ? 'Выключить звук' : 'Включить звук'}>
          {sound ? <Volume2 size={m.topH * 0.36} strokeWidth={2.6} /> : <VolumeX size={m.topH * 0.36} strokeWidth={2.6} />}
        </RoundButton>
      </div>
      {m.landscape && (
        <div
          className="absolute z-30"
          style={{
            left: m.content.left + m.content.width / 2 - pw / 2,
            top: m.pad * 0.5 + (m.topH - barH * 2.1) / 2,
            width: pw,
          }}
        >
          <ProgressStars value={progress} width={pw} height={barH} />
        </div>
      )}

      {/* Белочка */}
      <Squirrel
        width={m.stumpW}
        mood={mood.type}
        moodKey={mood.key}
        bubble={bubble}
        placement={m.landscape ? 'top' : 'right'}
        maxBubbleWidth={m.landscape ? m.stumpW * 0.95 : w - m.stumpW - m.pad * 2}
        onTap={tapSquirrel}
        style={{ left: -m.stumpW * 0.04, bottom: 0 }}
      />

      {/* Задание */}
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
                speak(questionParts(task));
              }}
            />
            <TaskBoard
              task={task}
              s={board.s}
              wrap={board.wrap}
              marks={marks}
              solved={solved}
              wrong={wrong}
              onTapItem={tapItem}
              onPickSide={(side, el) => pick(side, el)}
            />
            {task.kind !== 'compare' && (
              <AnswerButtons
                options={task.options}
                answer={task.answer}
                wrong={wrong.filter((x): x is number => typeof x === 'number')}
                solved={solved}
                onPick={(v, el) => pick(v, el)}
                aW={m.aW}
                aH={m.aH}
                gap={m.aGap}
              />
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
            text="Выйти к уровням?"
            onYes={() => {
              sfx.tap();
              stopVoice();
              onExit();
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
