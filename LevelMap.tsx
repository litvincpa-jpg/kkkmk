import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Lock, Volume2, VolumeX } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { clamp, computeMetrics } from '@/game/layout';
import { sfx } from '@/game/audio';
import { Mascot, type Bubble, type Mood } from '@/components/Mascot';
import { RoundButton, StarIcon, cssVars } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface GameLevelInfo {
  id: number;
  name: string;
  desc: string;
  /** картинка-иконка уровня */
  icon: string;
  iconText?: string;
}

interface Props {
  levels: GameLevelInfo[];
  stars: Record<string, number>;
  onBack: () => void;
  onPlay: (id: number) => void;
  sound: boolean;
  onToggleSound: () => void;
  mascot: { src: string; ratio: number; label: string };
  /** Родитель озвучивает события; здесь только пузырь и эмоция */
  onReady: (allDone: boolean) => void;
  onLocked: (id: number) => void;
  onMascotTap: () => void;
  text: {
    welcome: string;
    allDone: string;
    locked: (id: number) => string;
    mascot: string;
  };
}

const NUM_COLORS = ['#2D9CDB', '#4DB848', '#FF8A00'];

function LevelCard({
  level,
  stars,
  locked,
  current,
  cw,
  ch,
  index,
  onClick,
}: {
  level: GameLevelInfo;
  stars: number;
  locked: boolean;
  current: boolean;
  cw: number;
  ch: number;
  index: number;
  onClick: () => void;
}) {
  const k = Math.min(cw, ch / 1.05);
  return (
    <motion.button
      type="button"
      initial={{ y: 30, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ y: 4, scale: 0.98 }}
      onClick={onClick}
      aria-label={`Уровень ${level.id}: ${level.name} ${level.desc}${locked ? ', закрыт' : ''}`}
      className={cn('panel press relative flex flex-col items-center justify-center', current && 'glow-pulse')}
      style={{ width: cw, height: ch, borderRadius: k * 0.16, padding: k * 0.06, ...cssVars({ '--depth': '6px' }) }}
    >
      <span
        className={cn('absolute grid place-items-center rounded-full font-black leading-none', locked ? 'text-white' : 'orange')}
        style={{
          left: -k * 0.04,
          top: -k * 0.04,
          width: k * 0.25,
          height: k * 0.25,
          fontSize: k * 0.14,
          background: locked ? '#C3B8A4' : undefined,
          boxShadow: locked ? '0 3px 0 #A39782' : undefined,
          ...cssVars({ '--depth': '3px' }),
        }}
      >
        {locked ? <Lock size={k * 0.12} strokeWidth={3} /> : level.id}
      </span>
      <div
        className="grid place-items-center"
        style={{ height: ch * 0.42, filter: locked ? 'grayscale(1)' : undefined, opacity: locked ? 0.45 : 1 }}
      >
        {level.iconText ? (
          <span className="font-black leading-none" style={{ fontSize: ch * 0.2 }}>
            {level.iconText.split(' ').map((c, i) => (
              <span key={i} style={{ color: NUM_COLORS[i % 3], marginInline: ch * 0.012 }}>
                {c}
              </span>
            ))}
          </span>
        ) : (
          <img src={level.icon} alt="" style={{ height: ch * 0.36, filter: 'drop-shadow(0 4px 3px rgba(90,50,10,.25))' }} />
        )}
      </div>
      <span className="font-black leading-tight" style={{ fontSize: k * 0.115, opacity: locked ? 0.6 : 1 }}>
        {level.name}
      </span>
      <span className="font-bold leading-tight opacity-60" style={{ fontSize: k * 0.085 }}>
        {level.desc}
      </span>
      <div className="flex" style={{ marginTop: ch * 0.035, gap: k * 0.01 }}>
        {[0, 1, 2].map((i) => (
          <StarIcon key={i} lit={i < stars} size={k * 0.18} />
        ))}
      </div>
    </motion.button>
  );
}

export function LevelMap({ levels, stars, onBack, onPlay, sound, onToggleSound, mascot, onReady, onLocked, onMascotTap, text }: Props) {
  const { w, h } = useViewport();
  const m = useMemo(() => computeMetrics(w, h), [w, h]);
  const [mood, setMood] = useState<{ type: Mood; key: number }>({ type: 'idle', key: 0 });
  const [bubble, setBubble] = useState<Bubble | null>(null);

  const total = levels.reduce((acc, l) => acc + (stars[l.id] ?? 0), 0);
  const unlocked = (id: number) => id === 1 || (stars[id - 1] ?? 0) > 0;
  const current = levels.find((l) => unlocked(l.id) && !((stars[l.id] ?? 0) > 0))?.id ?? null;

  const talk = (bubbleText: string, type: Mood) => {
    setBubble({ text: bubbleText, key: Date.now() });
    setMood((s) => ({ type, key: s.key + 1 }));
  };

  useEffect(() => {
    const allDone = current === null;
    const t = window.setTimeout(() => {
      talk(allDone ? text.allDone : text.welcome, 'talk');
      onReady(allDone);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMascot = m.landscape;
  const area = showMascot
    ? m.content
    : { left: m.pad, top: m.topH + m.pad * 0.6, width: w - m.pad * 2, height: h - m.topH - m.pad * 0.6 };
  const cols = m.landscape ? 4 : w >= 600 ? 3 : 2;
  const rows = Math.ceil(levels.length / cols);
  const gap = clamp(Math.min(w, h) * 0.024, 10, 26);
  let cardW = Math.min((area.width - gap * (cols - 1) - 16) / cols, 300);
  let cardH = cardW * 1.08;
  if (m.landscape) {
    const maxH = (area.height - gap * (rows - 1) - 24) / rows;
    if (cardH > maxH) {
      cardH = maxH;
      cardW = Math.min(cardW, cardH / 0.88);
    }
  }

  const choose = (l: GameLevelInfo) => {
    if (!unlocked(l.id)) {
      sfx.wrong();
      talk(text.locked(l.id), 'sad');
      onLocked(l.id);
      return;
    }
    sfx.tap();
    onPlay(l.id);
  };

  const pillH = m.topH * 0.74;

  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-center"
        style={{ height: m.topH, paddingInline: m.pad, paddingTop: m.pad * 0.5, gap: m.pad * 0.8 }}
      >
        <RoundButton size={m.topH * 0.78} onClick={onBack} label="На главную">
          <Home size={m.topH * 0.36} strokeWidth={2.6} />
        </RoundButton>
        <div
          className="panel flex shrink-0 items-center rounded-full font-black"
          style={{ height: pillH, paddingInline: pillH * 0.35, gap: pillH * 0.15, fontSize: pillH * 0.42, ...cssVars({ '--depth': '4px' }) }}
          title="Собрано звёзд"
        >
          <StarIcon lit size={pillH * 0.8} />
          {total}
          <span className="opacity-40">/{levels.length * 3}</span>
        </div>
        <div className="flex min-w-0 flex-1 justify-center">
          {(m.landscape || w >= 520) && (
            <div
              className="panel truncate rounded-full font-black"
              style={{ height: pillH, lineHeight: `${pillH}px`, paddingInline: pillH * 0.6, fontSize: pillH * 0.45 }}
            >
              Выбери уровень
            </div>
          )}
        </div>
        <RoundButton size={m.topH * 0.78} onClick={onToggleSound} label={sound ? 'Выключить звук' : 'Включить звук'}>
          {sound ? <Volume2 size={m.topH * 0.36} strokeWidth={2.6} /> : <VolumeX size={m.topH * 0.36} strokeWidth={2.6} />}
        </RoundButton>
      </div>

      {showMascot && (
        <Mascot
          img={mascot.src}
          ratio={mascot.ratio}
          width={m.stumpW}
          mood={mood.type}
          moodKey={mood.key}
          bubble={bubble}
          placement="top"
          maxBubbleWidth={m.stumpW * 0.95}
          onTap={() => {
            sfx.squeak();
            talk(text.mascot, 'talk');
            onMascotTap();
          }}
          style={{ left: -m.stumpW * 0.04, bottom: m.pad * 0.4 }}
        />
      )}

      <div
        className={cn('absolute z-10', !m.landscape && 'scroll-soft')}
        style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
      >
        <div
          className="flex min-h-full flex-col items-center justify-center"
          style={{ padding: `${m.landscape ? 8 : 16}px 8px ${m.landscape ? 8 : 28}px` }}
        >
          {!m.landscape && w < 520 && (
            <div className="panel mb-5 rounded-full px-6 py-2 font-black" style={{ fontSize: 22 }}>
              Выбери уровень
            </div>
          )}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap }}>
            {levels.map((l, i) => (
              <LevelCard
                key={l.id}
                level={l}
                stars={stars[l.id] ?? 0}
                locked={!unlocked(l.id)}
                current={current === l.id}
                cw={cardW}
                ch={cardH}
                index={i}
                onClick={() => choose(l)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
