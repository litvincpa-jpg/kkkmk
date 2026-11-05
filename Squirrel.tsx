import { useEffect, useRef, type CSSProperties } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import squirrelImg from '@/assets/squirrel.webp';
import stumpImg from '@/assets/stump.webp';
import { SQUIRREL_RATIO, clamp } from '@/game/layout';

export type Mood = 'idle' | 'happy' | 'sad' | 'talk';
export interface Bubble {
  text: string;
  key: number;
}

interface Props {
  width: number;
  mood: Mood;
  moodKey: number;
  bubble: Bubble | null;
  placement?: 'top' | 'right';
  maxBubbleWidth?: number;
  onTap?: () => void;
  style?: CSSProperties;
}

export function Squirrel({ width: W, mood, moodKey, bubble, placement = 'top', maxBubbleWidth, onTap, style }: Props) {
  const controls = useAnimationControls();
  const token = useRef(0);
  const H = W * SQUIRREL_RATIO;

  useEffect(() => {
    const my = ++token.current;
    const idle = () => {
      if (my !== token.current) return;
      void controls.start({
        y: 0,
        rotate: 0,
        scaleY: [1, 1.025, 1],
        scaleX: [1, 0.99, 1],
        transition: {
          y: { duration: 0.3 },
          rotate: { duration: 0.3 },
          scaleY: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
          scaleX: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        },
      });
    };
    let p: Promise<unknown> | null = null;
    if (mood === 'happy') {
      p = controls.start({
        y: [0, -W * 0.17, 0, -W * 0.07, 0],
        rotate: [0, -4, 0, 3, 0],
        scaleY: [1, 1.05, 0.95, 1.02, 1],
        scaleX: 1,
        transition: { duration: 1, ease: 'easeOut' },
      });
    } else if (mood === 'sad') {
      p = controls.start({ rotate: [0, -6, 5, -3, 0], y: 0, scaleY: [1, 0.97, 1], transition: { duration: 0.7 } });
    } else if (mood === 'talk') {
      p = controls.start({ rotate: [0, -2.5, 2, 0], y: [0, -W * 0.03, 0], transition: { duration: 0.55 } });
    }
    if (p) void p.then(idle);
    else idle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, moodKey]);

  const fontSize = clamp(W * 0.072, 14, 25);
  const isTop = placement === 'top';
  // «top»: пузырь по центру над головой белки; «right»: справа от головы
  const bubbleStyle: CSSProperties = isTop
    ? { left: W * 0.6, bottom: H - W * 0.02, maxWidth: maxBubbleWidth ?? W * 0.95, transformOrigin: '50% 100%', textAlign: 'center' }
    : { left: W * 1.0, bottom: H * 0.55, maxWidth: maxBubbleWidth ?? W * 1.6, transformOrigin: '0% 80%' };
  const bx = isTop ? '-50%' : '0%';

  return (
    <div className="pointer-events-none absolute z-20" style={{ width: W, height: H, ...style }}>
      <img src={stumpImg} alt="" className="absolute bottom-0 left-0 w-full" />
      <motion.div
        animate={controls}
        onClick={onTap}
        role="button"
        aria-label="Белочка"
        className="pointer-events-auto absolute cursor-pointer"
        style={{
          left: W * 0.106,
          bottom: W * 0.384,
          height: W * 1.19,
          width: W * 1.19 * 0.765,
          originX: 0.5,
          originY: 1,
        }}
      >
        <img src={squirrelImg} alt="Белочка" className="h-full w-full" />
      </motion.div>

      <AnimatePresence>
        {bubble && (
          <motion.div
            key={bubble.key}
            initial={{ opacity: 0, scale: 0.4, y: 12, x: bx }}
            animate={{ opacity: 1, scale: 1, y: 0, x: bx }}
            exit={{ opacity: 0, scale: 0.7, x: bx, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="bubble pointer-events-auto absolute w-max font-black leading-tight"
            style={{ ...bubbleStyle, fontSize, padding: `${fontSize * 0.5}px ${fontSize * 0.8}px` }}
            onClick={onTap}
          >
            {bubble.text}
            <span
              className="absolute block"
              style={
                isTop
                  ? {
                      width: fontSize * 0.8,
                      height: fontSize * 0.8,
                      bottom: -fontSize * 0.32,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      background: '#fffdf7',
                    }
                  : {
                      width: fontSize * 0.8,
                      height: fontSize * 0.8,
                      left: -fontSize * 0.3,
                      bottom: fontSize * 0.6,
                      transform: 'rotate(45deg)',
                      background: '#fffdf7',
                    }
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
