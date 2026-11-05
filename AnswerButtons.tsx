import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { cssVars } from './ui';

interface Props {
  options: number[];
  answer: number;
  wrong: number[];
  solved: boolean;
  onPick: (v: number, el: HTMLElement) => void;
  aW: number;
  aH: number;
  gap: number;
}

export function AnswerButtons({ options, answer, wrong, solved, onPick, aW, aH, gap }: Props) {
  const depth = Math.min(9, Math.max(4, aH * 0.055));
  return (
    <div className="flex justify-center" style={{ gap }}>
      {options.map((opt, i) => {
        const isCorrect = solved && opt === answer;
        const isWrong = wrong.includes(opt);
        const dim = solved && !isCorrect;
        return (
          <motion.div
            key={opt}
            initial={{ y: aH * 0.5, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.07, type: 'spring', stiffness: 360, damping: 18 }}
          >
            <motion.button
              type="button"
              data-opt={opt}
              disabled={solved || isWrong}
              onClick={(e) => onPick(opt, e.currentTarget)}
              whileTap={solved || isWrong ? undefined : { y: depth * 0.7 }}
              animate={
                isWrong
                  ? { x: [0, -10, 10, -7, 7, 0] }
                  : isCorrect
                    ? { scale: [1, 1.2, 0.95, 1.05, 1] }
                    : { x: 0, scale: 1 }
              }
              transition={{ duration: 0.55 }}
              className={cn(
                'press relative grid place-items-center font-black leading-none',
                isCorrect ? 'green' : 'panel text-cocoa',
              )}
              style={{
                width: aW,
                height: aH,
                borderRadius: Math.min(aW, aH) * 0.26,
                fontSize: aH * 0.6,
                opacity: isWrong ? 0.38 : dim ? 0.5 : 1,
                textShadow: isCorrect ? '0 3px 0 rgba(40,100,15,.45)' : '0 2px 0 rgba(255,255,255,.9)',
                ...cssVars({ '--depth': `${depth}px` }),
              }}
            >
              <span style={{ marginTop: -aH * 0.04 }}>{opt}</span>
              {isCorrect && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 14 }}
                  className="absolute grid place-items-center rounded-full bg-white"
                  style={{
                    top: -aH * 0.12,
                    right: -aH * 0.12,
                    width: aH * 0.34,
                    height: aH * 0.34,
                    boxShadow: '0 3px 8px rgba(0,0,0,.2)',
                  }}
                >
                  <Check color="#4FAE26" strokeWidth={4} size={aH * 0.22} />
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}
