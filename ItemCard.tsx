import { AnimatePresence, motion } from 'framer-motion';
import type { GameObject } from '@/game/objects';
import { cn } from '@/utils/cn';
import { cssVars } from './ui';

export const itemCols = (n: number) => (n <= 5 ? n : Math.ceil(n / 2));

interface Props {
  obj: GameObject;
  n: number;
  s: number;
  prefix: string;
  /** сколько последних предметов «спрятались» (вычитание) */
  faded?: number;
  marks?: Record<string, number>;
  onTapItem?: (id: string) => void;
  onCardClick?: (el: HTMLElement) => void;
  ring?: 'correct' | 'wrong' | null;
  badge?: number | null;
  dim?: boolean;
  delay?: number;
  side?: string;
}

export function ItemCard({
  obj,
  n,
  s,
  prefix,
  faded = 0,
  marks,
  onTapItem,
  onCardClick,
  ring = null,
  badge = null,
  dim = false,
  delay = 0,
  side,
}: Props) {
  const cols = itemCols(n);
  const gap = s * 0.14;
  const depth = Math.min(8, Math.max(4, s * 0.07));
  const ringColor = ring === 'correct' ? '#5DBB34' : '#F2685A';

  return (
    <motion.div
      data-side={side}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      aria-label={onCardClick ? `${n}` : undefined}
      onClick={onCardClick ? (e) => onCardClick(e.currentTarget) : undefined}
      className={cn('panel relative shrink-0', onCardClick && 'press cursor-pointer')}
      style={{
        padding: s * 0.3,
        borderRadius: s * 0.45,
        opacity: dim ? 0.55 : 1,
        boxShadow: ring
          ? `0 0 0 ${Math.max(4, s * 0.07)}px ${ringColor}, 0 ${depth}px 0 #e3cfa6, 0 ${depth + 8}px 22px rgba(92,58,24,.22)`
          : undefined,
        ...cssVars({ '--depth': `${depth}px` }),
      }}
      animate={ring === 'wrong' ? { x: [0, -14, 14, -9, 9, 0] } : ring === 'correct' ? { scale: [1, 1.07, 1] } : { x: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileTap={onCardClick ? { y: depth * 0.6 } : undefined}
    >
      <div className="flex flex-wrap justify-center" style={{ width: cols * s + (cols - 1) * gap, gap }}>
        {Array.from({ length: n }, (_, i) => {
          const id = `${prefix}-${i}`;
          const isFaded = i >= n - faded;
          const mark = marks?.[id];
          const tappable = !!onTapItem && !isFaded;
          const image = (
            <motion.div
              className="relative h-full w-full"
              animate={mark ? { scale: [1.32, 1], rotate: [-10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.35 }}
            >
              <img
                src={obj.src}
                alt=""
                draggable={false}
                className="h-full w-full object-contain"
                style={{
                  opacity: isFaded ? 0.28 : 1,
                  filter: isFaded ? 'grayscale(0.85)' : 'drop-shadow(0 4px 3px rgba(90,50,10,.28))',
                }}
              />
              {isFaded && (
                <span
                  className="absolute rounded-full border-dashed"
                  style={{ inset: '4%', borderWidth: Math.max(2, s * 0.035), borderColor: 'rgba(160,120,70,.55)' }}
                />
              )}
            </motion.div>
          );
          return (
            <motion.div
              key={id}
              className="relative"
              style={{ width: s, height: s }}
              initial={{ scale: 0, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: delay + i * 0.045, type: 'spring', stiffness: 420, damping: 17 }}
            >
              {tappable ? (
                <button
                  type="button"
                  aria-label={`${obj.forms[0]} ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTapItem?.(id);
                  }}
                  className="block h-full w-full transition-transform active:scale-90"
                >
                  {image}
                </button>
              ) : (
                image
              )}
              <AnimatePresence>
                {mark != null && (
                  <motion.span
                    key="mark"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="pointer-events-none absolute grid place-items-center rounded-full font-black leading-none text-white"
                    style={{
                      right: -s * 0.06,
                      top: -s * 0.06,
                      width: s * 0.44,
                      height: s * 0.44,
                      fontSize: s * 0.27,
                      background: 'linear-gradient(180deg,#FFB13D,#FF8A00)',
                      boxShadow: '0 2px 0 #C96500, 0 0 0 2px #fff',
                    }}
                  >
                    {mark}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      {badge != null && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.15 }}
          className="absolute grid place-items-center rounded-full font-black leading-none text-white"
          style={{
            top: -s * 0.28,
            right: -s * 0.28,
            width: s * 0.62,
            height: s * 0.62,
            fontSize: s * 0.38,
            background: 'linear-gradient(180deg,#FFB13D,#FF8A00)',
            boxShadow: '0 3px 0 #C96500, 0 0 0 3px #fff',
          }}
        >
          {badge}
        </motion.span>
      )}
    </motion.div>
  );
}
