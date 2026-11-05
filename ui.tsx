import { useId, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const cssVars = (o: Record<string, string | number>) => o as CSSProperties;

const STAR =
  'M32 8 L39.35 23.89 L56.73 25.97 L43.89 37.86 L47.28 55.03 L32 46.5 L16.72 55.03 L20.11 37.86 L7.27 25.97 L24.65 23.89 Z';

export function StarIcon({ lit, size, style }: { lit: boolean; size: number; style?: CSSProperties }) {
  const gid = `st${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={style} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          {lit ? (
            <>
              <stop offset="0" stopColor="#FFE77F" />
              <stop offset="0.55" stopColor="#FFC61F" />
              <stop offset="1" stopColor="#FF9C0A" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#EDEDED" />
              <stop offset="1" stopColor="#C4C4C4" />
            </>
          )}
        </linearGradient>
      </defs>
      <path d={STAR} fill="none" stroke="#fff" strokeWidth="10" strokeLinejoin="round" opacity="0.95" />
      <path d={STAR} fill={`url(#${gid})`} stroke={lit ? '#F08A00' : '#ABABAB'} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="25" cy="25" rx="5.5" ry="3" transform="rotate(-38 25 25)" fill="#fff" opacity={lit ? 0.8 : 0.65} />
    </svg>
  );
}

export type OpType = 'plus' | 'minus' | 'eq' | 'gt' | 'lt';

export function OpSign({ type, size }: { type: OpType; size: number }) {
  const c = '#4A2E1C';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ filter: 'drop-shadow(0 2px 0 rgba(255,255,255,.75))', flexShrink: 0 }}
      aria-hidden="true"
    >
      {type === 'plus' && (
        <>
          <rect x="15.5" y="4" width="9" height="32" rx="4.5" fill={c} />
          <rect x="4" y="15.5" width="32" height="9" rx="4.5" fill={c} />
        </>
      )}
      {type === 'minus' && <rect x="4" y="15.5" width="32" height="9" rx="4.5" fill={c} />}
      {type === 'eq' && (
        <>
          <rect x="4" y="8.5" width="32" height="9" rx="4.5" fill={c} />
          <rect x="4" y="22.5" width="32" height="9" rx="4.5" fill={c} />
        </>
      )}
      {type === 'gt' && (
        <path d="M11 7 L30 20 L11 33" fill="none" stroke={c} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {type === 'lt' && (
        <path d="M29 7 L10 20 L29 33" fill="none" stroke={c} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function RoundButton({
  size,
  onClick,
  children,
  label,
  className,
}: {
  size: number;
  onClick?: () => void;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('panel press grid shrink-0 place-items-center rounded-full text-cocoa', className)}
      style={{ width: size, height: size, ...cssVars({ '--depth': `${Math.max(3, size * 0.07)}px` }) }}
    >
      {children}
    </button>
  );
}

export function AvatarPill({
  src,
  label,
  size,
  onClick,
  compact,
  badge,
}: {
  src: string;
  label: string;
  size: number;
  onClick?: () => void;
  compact?: boolean;
  badge?: string | number;
}) {
  if (compact) {
    return (
      <button type="button" onClick={onClick} title={label} aria-label={label} className="relative shrink-0" style={{ width: size, height: size }}>
        <span
          className="block h-full w-full overflow-hidden rounded-full bg-white"
          style={{ border: `${Math.max(3, size * 0.07)}px solid #fff`, boxShadow: '0 4px 10px rgba(80,50,20,.25)' }}
        >
          <img src={src} alt="" className="h-full w-full object-cover" />
        </span>
        {badge != null && (
          <span
            className="orange absolute grid place-items-center rounded-full font-black leading-none"
            style={{
              right: -size * 0.14,
              bottom: -size * 0.06,
              width: size * 0.5,
              height: size * 0.5,
              fontSize: size * 0.28,
              border: '2px solid #fff',
              ...cssVars({ '--depth': '2px' }),
            }}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="К уровням"
      className="panel press flex shrink-0 items-center rounded-full"
      style={{ height: size * 0.74, paddingRight: size * 0.38, ...cssVars({ '--depth': '4px' }) }}
    >
      <span
        className="relative block shrink-0 overflow-hidden rounded-full bg-white"
        style={{
          width: size,
          height: size,
          marginLeft: -size * 0.08,
          border: `${Math.max(3, size * 0.07)}px solid #fff`,
          boxShadow: '0 4px 10px rgba(80,50,20,.25)',
        }}
      >
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="whitespace-nowrap font-black" style={{ fontSize: size * 0.32, marginLeft: size * 0.2 }}>
        {label}
      </span>
    </button>
  );
}

export function ProgressStars({ value, width, height }: { value: number; width: number | string; height: number }) {
  const starSize = height * 2.1;
  const v = Math.max(0, Math.min(1, value));
  const marks = [1 / 3, 2 / 3, 1];
  return (
    <div className="relative" style={{ width, height: starSize }}>
      <div
        className="absolute inset-x-0 overflow-hidden rounded-full"
        style={{
          top: (starSize - height) / 2,
          height,
          background: '#EADFC6',
          border: `${Math.max(2, height * 0.14)}px solid #FFF9EC`,
          boxShadow: 'inset 0 3px 5px rgba(120,80,30,.28), 0 4px 10px rgba(80,50,20,.18)',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${v * 100}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          style={{
            background: 'linear-gradient(180deg,#FFE15A 0%,#FFC51F 50%,#F7A900 100%)',
            boxShadow: 'inset 0 -3px 0 rgba(200,110,0,.25), inset 0 3px 0 rgba(255,255,255,.55)',
          }}
        />
      </div>
      {marks.map((t, i) => {
        const lit = v >= t - 1e-6;
        return (
          <motion.div
            key={`${i}-${lit}`}
            className="absolute top-0"
            style={{ left: `calc(${t * 100}% - ${starSize / 2}px)` }}
            initial={lit ? { scale: 0.3, rotate: -60 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 11, delay: lit ? 0.35 : 0 }}
          >
            <StarIcon lit={lit} size={starSize} />
          </motion.div>
        );
      })}
    </div>
  );
}

export function NextButton({
  size,
  enabled,
  onClick,
  style,
}: {
  size: number;
  enabled: boolean;
  onClick: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      aria-label="Дальше"
      title="Дальше"
      className={cn('orange press absolute z-20 grid place-items-center rounded-full', enabled && 'pulse-ring')}
      style={{
        width: size,
        height: size,
        opacity: enabled ? 1 : 0.9,
        filter: enabled ? undefined : 'grayscale(.8) brightness(1.12)',
        ...cssVars({ '--depth': `${Math.max(4, size * 0.06)}px` }),
        ...style,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 48 48" className={enabled ? 'nudge' : undefined}>
        <path
          d="M9 24h28M25 11l13 13-13 13"
          fill="none"
          stroke="#fff"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function QuestionPill({
  text,
  height,
  maxWidth,
  onClick,
  showIcon,
}: {
  text: string;
  height: number;
  maxWidth: number;
  onClick?: () => void;
  showIcon?: boolean;
}) {
  const iconK = showIcon ? 1.1 : 0;
  const font = Math.max(14, Math.min(height * 0.5, (maxWidth - height * 1.1) / (text.length * 0.56 + iconK)));
  return (
    <motion.button
      type="button"
      key={text}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title="Послушать ещё раз"
      className="panel flex max-w-full items-center justify-center rounded-full font-black"
      style={{ height, paddingInline: height * 0.5, fontSize: font, gap: font * 0.35 }}
    >
      <span className="whitespace-nowrap">{text}</span>
      {showIcon && <Volume2 size={font * 0.75} strokeWidth={2.6} className="shrink-0 opacity-40" />}
    </motion.button>
  );
}
