import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, LayoutGrid, RotateCcw, X } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { clamp } from '@/game/layout';
import { sfx } from '@/game/audio';
import type { Avatar } from '@/game/storage';
import { RoundButton, StarIcon, cssVars } from './ui';

export function LevelComplete({
  levelId,
  stars,
  avatar,
  onMenu,
  onReplay,
  onNext,
}: {
  levelId: number;
  stars: number;
  avatar: Avatar;
  onMenu: () => void;
  onReplay: () => void;
  onNext: (() => void) | null;
}) {
  const { w, h } = useViewport();
  const k = clamp(Math.min(w / 640, h / 560), 0.55, 1.2);

  useEffect(() => {
    const timers = [0, 1, 2].filter((i) => i < stars).map((i) => window.setTimeout(() => sfx.star(), 650 + i * 380));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stars]);

  const title = stars === 3 ? 'Супер!' : stars === 2 ? 'Отлично!' : 'Молодец!';
  const done = avatar === 'girl' ? 'справилась' : 'справился';
  const msg =
    stars === 3
      ? 'Ни одной ошибки! Ты настоящий математик!'
      : stars === 2
        ? `Ты ${done}! Почти без ошибок!`
        : `Ты ${done}! Сыграй ещё раз, чтобы собрать все звёзды!`;

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[#3a2410]/45 p-4 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="panel relative w-full text-center"
        style={{ maxWidth: 560 * k, borderRadius: 40 * k, padding: `${58 * k}px ${30 * k}px ${30 * k}px` }}
        initial={{ scale: 0.5, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <div
          className="orange absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full font-black"
          style={{ fontSize: 26 * k, padding: `${10 * k}px ${30 * k}px` }}
        >
          Уровень {levelId} пройден!
        </div>
        <div className="flex items-end justify-center" style={{ gap: 8 * k }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -70 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.55 + i * 0.38, type: 'spring', stiffness: 300, damping: 12 }}
              style={{ marginBottom: i === 1 ? 26 * k : 0 }}
            >
              <StarIcon lit={i < stars} size={(i === 1 ? 120 : 92) * k} />
            </motion.div>
          ))}
        </div>
        <h2
          className="font-black leading-none"
          style={{ fontSize: 46 * k, marginTop: 12 * k, color: '#FF8A00', textShadow: '0 3px 0 rgba(160,80,0,.18)' }}
        >
          {title}
        </h2>
        <p className="font-extrabold opacity-80" style={{ fontSize: 20 * k, marginTop: 10 * k }}>
          {msg}
        </p>
        <div className="flex items-center justify-center" style={{ gap: 16 * k, marginTop: 26 * k }}>
          <RoundButton size={68 * k} onClick={onMenu} label="Уровни">
            <LayoutGrid size={30 * k} strokeWidth={2.6} />
          </RoundButton>
          <RoundButton size={68 * k} onClick={onReplay} label="Ещё раз">
            <RotateCcw size={30 * k} strokeWidth={2.8} />
          </RoundButton>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="orange press pulse-ring relative flex items-center rounded-full font-black"
              style={{ height: 68 * k, padding: `0 ${30 * k}px`, fontSize: 26 * k, gap: 10 * k, ...cssVars({ '--depth': '6px' }) }}
            >
              Дальше <ArrowRight size={30 * k} strokeWidth={3.2} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ConfirmDialog({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[#3a2410]/45 p-4 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onNo}
    >
      <motion.div
        className="panel rounded-[36px] px-8 py-7 text-center"
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-black" style={{ fontSize: 28 }}>
          {text}
        </p>
        <div className="mt-6 flex justify-center gap-6">
          <button
            type="button"
            onClick={onYes}
            aria-label="Да"
            className="green press grid place-items-center rounded-full"
            style={{ width: 78, height: 78 }}
          >
            <Check size={42} strokeWidth={3.5} color="#fff" />
          </button>
          <button
            type="button"
            onClick={onNo}
            aria-label="Нет"
            className="panel press grid place-items-center rounded-full"
            style={{ width: 78, height: 78 }}
          >
            <X size={42} strokeWidth={3.5} color="#E0533F" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
