import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Home, Play, Volume2, VolumeX } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { clamp, computeMetrics } from '@/game/layout';
import { sfx } from '@/game/audio';
import { speak } from '@/game/voice';
import { FUN_IDS, txt, type PhraseId } from '@/game/phrases';
import { pickOne } from '@/game/tasks';
import { AVATARS, type Avatar } from '@/game/storage';
import { Squirrel, type Bubble, type Mood } from '@/components/Squirrel';
import { RoundButton, cssVars } from '@/components/ui';

const COLORS = ['#F2542D', '#F79A1E', '#E9B400', '#4DB848', '#2D9CDB', '#9B59D0'];

function Rainbow({ text, offset = 0 }: { text: string; offset?: number }) {
  let k = offset;
  return (
    <>
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i}> </span>
        ) : (
          <span key={i} style={{ color: COLORS[k++ % COLORS.length] }}>
            {ch}
          </span>
        ),
      )}
    </>
  );
}

interface Props {
  avatar: Avatar;
  onAvatar: (a: Avatar) => void;
  onPlay: () => void;
  sound: boolean;
  onToggleSound: () => void;
  onHome: () => void;
}

export function StartScreen({ avatar, onAvatar, onPlay, sound, onToggleSound, onHome }: Props) {
  const { w, h } = useViewport();
  const m = useMemo(() => computeMetrics(w, h), [w, h]);
  const [mood, setMood] = useState<{ type: Mood; key: number }>({ type: 'idle', key: 0 });
  const [bubble, setBubble] = useState<Bubble | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setBubble({ text: txt('greet'), key: 1 }), 700);
    return () => window.clearTimeout(t);
  }, []);

  const talk = (id: PhraseId) => {
    setBubble({ text: txt(id), key: Date.now() });
    setMood((s) => ({ type: 'talk', key: s.key + 1 }));
    speak([id]);
  };

  const area = m.content;
  const titleSize = m.landscape
    ? Math.min(h * 0.09, area.width * 0.085, 88)
    : Math.min(h * 0.06, area.width * 0.115, 76);
  const avSize = clamp(Math.min(h * (m.landscape ? 0.13 : 0.1), area.width * 0.22), 54, 120);
  const btnH = clamp(h * (m.landscape ? 0.1 : 0.08), 50, 92);
  const small = Math.max(13, avSize * 0.17);

  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute z-30" style={{ left: m.pad, top: m.pad * 0.6 }}>
        <RoundButton size={m.topH * 0.78} onClick={onHome} label="На сайт PlayKids">
          <Home size={m.topH * 0.34} strokeWidth={2.6} />
        </RoundButton>
      </div>
      <div className="absolute z-30" style={{ right: m.pad, top: m.pad * 0.6 }}>
        <RoundButton size={m.topH * 0.78} onClick={onToggleSound} label={sound ? 'Выключить звук' : 'Включить звук'}>
          {sound ? <Volume2 size={m.topH * 0.36} strokeWidth={2.6} /> : <VolumeX size={m.topH * 0.36} strokeWidth={2.6} />}
        </RoundButton>
      </div>

      <Squirrel
        width={m.stumpW}
        mood={mood.type}
        moodKey={mood.key}
        bubble={bubble}
        placement={m.landscape ? 'top' : 'right'}
        maxBubbleWidth={m.landscape ? m.stumpW * 0.95 : w - m.stumpW - m.pad * 2}
        onTap={() => {
          sfx.squeak();
          talk(pickOne(FUN_IDS));
        }}
        style={{ left: -m.stumpW * 0.04, bottom: 0 }}
      />

      <div
        className="absolute z-10 flex flex-col items-center justify-center"
        style={{ left: area.left, top: area.top, width: area.width, height: area.height, gap: m.gap }}
      >
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="panel max-w-full text-center"
          style={{ padding: `${titleSize * 0.24}px ${titleSize * 0.55}px`, borderRadius: titleSize * 0.5 }}
        >
          <h1 className="font-black leading-[0.98]" style={{ fontSize: titleSize, textShadow: '0 3px 0 rgba(74,46,28,.14)' }}>
            <Rainbow text="Весёлая" />
            {m.landscape ? ' ' : <br />}
            <Rainbow text="математика" offset={3} />
          </h1>
          <p className="font-extrabold opacity-75" style={{ fontSize: Math.max(13, titleSize * 0.27), marginTop: titleSize * 0.08 }}>
            Учимся считать вместе с Белочкой
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 260, damping: 20 }}
          className="panel max-w-full text-center"
          style={{
            padding: `${avSize * 0.12}px ${avSize * 0.26}px`,
            borderRadius: avSize * 0.3,
          }}
        >
          {/* Кто играет */}
          <div className="text-center">
            <p className="font-black" style={{ fontSize: small * 1.1 }}>
              Кто играет?
            </p>
            <div className="flex justify-center" style={{ gap: avSize * 0.28, marginTop: avSize * 0.08 }}>
              {(['boy', 'girl'] as Avatar[]).map((a) => {
                const sel = avatar === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      onAvatar(a);
                      sfx.pop();
                      talk('hello_play');
                    }}
                    className="flex flex-col items-center"
                    style={{ gap: avSize * 0.05 }}
                  >
                    <motion.span
                      animate={{ scale: sel ? 1.06 : 0.9 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="relative block"
                      style={{ width: avSize, height: avSize }}
                    >
                      <span
                        className="block h-full w-full overflow-hidden rounded-full bg-white"
                        style={{
                          border: `${avSize * 0.05}px solid #fff`,
                          boxShadow: sel
                            ? `0 0 0 ${avSize * 0.045}px #FF9800, 0 8px 18px rgba(80,50,20,.3)`
                            : '0 6px 14px rgba(80,50,20,.2)',
                          opacity: sel ? 1 : 0.7,
                        }}
                      >
                        <img src={AVATARS[a]} alt={a === 'boy' ? 'Мальчик' : 'Девочка'} className="h-full w-full object-cover" />
                      </span>
                      {sel && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="green absolute grid place-items-center rounded-full"
                          style={{
                            right: -avSize * 0.02,
                            bottom: avSize * 0.02,
                            width: avSize * 0.3,
                            height: avSize * 0.3,
                            ...cssVars({ '--depth': '3px' }),
                          }}
                        >
                          <Check size={avSize * 0.19} strokeWidth={4} color="#fff" />
                        </motion.span>
                      )}
                    </motion.span>
                    <span className="font-black" style={{ fontSize: small * 0.9, color: sel ? '#FF8A00' : undefined }}>
                      {a === 'boy' ? 'Мальчик' : 'Девочка'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.button
          type="button"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 300, damping: 14 }}
          whileTap={{ y: 5 }}
          onClick={() => {
            sfx.tap();
            onPlay();
          }}
          className="orange press pulse-ring relative flex items-center rounded-full font-black"
          style={{ height: btnH, padding: `0 ${btnH * 0.6}px`, fontSize: btnH * 0.42, gap: btnH * 0.18, ...cssVars({ '--depth': '7px' }) }}
        >
          <Play fill="#fff" strokeWidth={0} size={btnH * 0.42} />
          Играть
        </motion.button>
      </div>
    </motion.div>
  );
}
