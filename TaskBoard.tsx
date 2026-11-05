import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { OBJECTS } from '@/game/objects';
import type { Choice, Task } from '@/game/tasks';
import { ItemCard } from './ItemCard';
import { OpSign } from './ui';

interface Props {
  task: Task;
  s: number;
  wrap: boolean;
  marks: Record<string, number>;
  solved: boolean;
  wrong: Choice[];
  onTapItem: (id: string) => void;
  onPickSide: (side: 'left' | 'right', el: HTMLElement) => void;
}

function Row({ gap, children }: { gap: number; children: ReactNode }) {
  return (
    <div className="flex items-center justify-center" style={{ gap }}>
      {children}
    </div>
  );
}

function Column({ gap, children }: { gap: number; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center" style={{ gap }}>
      {children}
    </div>
  );
}

export function AnswerSlot({ s, value }: { s: number; value: number | null }) {
  const size = s * 1.6;
  if (value == null) {
    return (
      <div
        className="grid shrink-0 place-items-center font-black"
        style={{
          width: size,
          height: size,
          borderRadius: s * 0.45,
          border: `${Math.max(3, s * 0.05)}px dashed rgba(255,255,255,.95)`,
          background: 'rgba(255,253,247,.5)',
          fontSize: s * 0.9,
          color: 'rgba(74,46,28,.5)',
        }}
      >
        <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          ?
        </motion.span>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.3, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      className="panel grid shrink-0 place-items-center font-black leading-none"
      style={{ width: size, height: size, borderRadius: s * 0.45, fontSize: s * 1.0, color: '#3E9B1C' }}
    >
      {value}
    </motion.div>
  );
}

const TILE_COLORS = ['#FF8A80', '#FFC24B', '#7ED36A', '#5CB8F0', '#B48CF2'];

function SeqTile({ value, t, index, missing, last }: { value: number | null; t: number; index: number; missing: boolean; last: boolean }) {
  const color = TILE_COLORS[index % TILE_COLORS.length];
  const wheel = Math.max(2, t * 0.03);
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 380, damping: 18 }}
      className="relative shrink-0"
      style={{ width: t, height: t }}
    >
      {missing && value == null ? (
        <div
          className="grid h-full w-full place-items-center"
          style={{ borderRadius: t * 0.24, border: `${Math.max(3, t * 0.045)}px dashed #fff`, background: 'rgba(255,253,247,.55)' }}
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="font-black leading-none"
            style={{ fontSize: t * 0.6, color: '#FF8A00', textShadow: '0 3px 0 #fff' }}
          >
            ?
          </motion.span>
        </div>
      ) : (
        <motion.div
          key={missing ? 'filled' : 'tile'}
          initial={missing ? { scale: 0.3, rotate: -12 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 13 }}
          className="panel relative grid h-full w-full place-items-center overflow-hidden font-black leading-none"
          style={{ borderRadius: t * 0.24, fontSize: t * 0.56, color: missing ? '#3E9B1C' : '#4A2E1C' }}
        >
          <span className="absolute inset-x-0 top-0" style={{ height: t * 0.15, background: color }} />
          <span className="relative" style={{ marginTop: t * 0.1 }}>
            {value}
          </span>
        </motion.div>
      )}
      {[0.14, 0.62].map((x) => (
        <span
          key={x}
          className="absolute rounded-full"
          style={{
            width: t * 0.24,
            height: t * 0.24,
            left: t * x,
            bottom: -t * 0.13,
            background: 'radial-gradient(circle, #A88462 0 26%, #4A2E1C 30%)',
            border: `${wheel}px solid #fff`,
          }}
        />
      ))}
      {!last && (
        <span
          className="absolute rounded-full"
          style={{ right: -t * 0.22, width: t * 0.22, height: t * 0.08, bottom: t * 0.22, background: '#7A5536' }}
        />
      )}
    </motion.div>
  );
}

export function TaskBoard({ task, s, wrap, marks, solved, wrong, onTapItem, onPickSide }: Props) {
  const gap = s * 0.18;

  switch (task.kind) {
    case 'add':
    case 'sub': {
      const obj = OBJECTS[task.obj];
      const A = (
        <ItemCard
          obj={obj}
          n={task.a}
          s={s}
          prefix="a"
          faded={task.kind === 'sub' ? task.b : 0}
          marks={marks}
          onTapItem={onTapItem}
        />
      );
      const B = (
        <ItemCard
          obj={obj}
          n={task.b}
          s={s}
          prefix="b"
          marks={marks}
          onTapItem={task.kind === 'add' ? onTapItem : undefined}
          delay={task.a * 0.045 + 0.1}
        />
      );
      const op = <OpSign type={task.kind === 'add' ? 'plus' : 'minus'} size={s * 0.62} />;
      const eq = <OpSign type="eq" size={s * 0.62} />;
      const slot = <AnswerSlot s={s} value={solved ? task.answer : null} />;
      if (wrap) {
        return (
          <Column gap={s * 0.3}>
            <Row gap={gap}>
              {A}
              {op}
            </Row>
            <Row gap={gap}>
              {B}
              {eq}
              {slot}
            </Row>
          </Column>
        );
      }
      return (
        <Row gap={gap}>
          {A}
          {op}
          {B}
          {eq}
          {slot}
        </Row>
      );
    }

    case 'count': {
      const obj = OBJECTS[task.obj];
      const card = <ItemCard obj={obj} n={task.n} s={s} prefix="c" marks={marks} onTapItem={onTapItem} />;
      const eq = <OpSign type="eq" size={s * 0.62} />;
      const slot = <AnswerSlot s={s} value={solved ? task.answer : null} />;
      if (wrap) {
        return (
          <Column gap={s * 0.3}>
            {card}
            <Row gap={gap}>
              {eq}
              {slot}
            </Row>
          </Column>
        );
      }
      return (
        <Row gap={gap}>
          {card}
          {eq}
          {slot}
        </Row>
      );
    }

    case 'compare': {
      const obj = OBJECTS[task.obj];
      const card = (side: 'left' | 'right') => {
        const isWrong = wrong.includes(side);
        const isRight = solved && task.answer === side;
        const n = side === 'left' ? task.left : task.right;
        return (
          <ItemCard
            obj={obj}
            n={n}
            s={s}
            prefix={side}
            side={side}
            onCardClick={!solved && !isWrong ? (el) => onPickSide(side, el) : undefined}
            ring={isRight ? 'correct' : isWrong ? 'wrong' : null}
            badge={solved ? n : null}
            dim={isWrong || (solved && !isRight)}
            delay={side === 'right' ? 0.2 : 0}
          />
        );
      };
      const mid = (
        <div className="panel grid shrink-0 place-items-center rounded-full" style={{ width: s * 0.95, height: s * 0.95 }}>
          {solved ? (
            wrap ? (
              <Check size={s * 0.55} strokeWidth={3.5} color="#4FAE26" />
            ) : (
              <OpSign type={task.left > task.right ? 'gt' : 'lt'} size={s * 0.55} />
            )
          ) : (
            <span className="font-black leading-none" style={{ fontSize: s * 0.6, color: 'rgba(74,46,28,.5)' }}>
              ?
            </span>
          )}
        </div>
      );
      if (wrap) {
        return (
          <Column gap={s * 0.25}>
            {card('left')}
            {mid}
            {card('right')}
          </Column>
        );
      }
      return (
        <Row gap={s * 0.25}>
          {card('left')}
          {mid}
          {card('right')}
        </Row>
      );
    }

    case 'seq':
      return (
        <div className="flex items-end justify-center" style={{ gap: s * 0.22, paddingBottom: s * 0.16 }}>
          {task.seq.map((v, i) => (
            <SeqTile
              key={i}
              value={i === task.missing ? (solved ? v : null) : v}
              t={s}
              index={i}
              missing={i === task.missing}
              last={i === task.seq.length - 1}
            />
          ))}
        </div>
      );
  }
}
