import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import bg from '@/assets/bg.webp';
import squirrelImg from '@/assets/squirrel.webp';
import stumpImg from '@/assets/stump.webp';
import { useViewport } from '@/hooks/useViewport';
import { ALL_OBJECT_IMAGES, OBJECTS } from '@/game/objects';
import { LEVELS } from '@/game/tasks';
import { getCtx, setSoundEnabled, sfx, unlockAudio } from '@/game/audio';
import { loadVoice, speak, stopVoice } from '@/game/voice';
import { num, txt } from '@/game/phrases';
import { loadSave, storeSave, type SaveData } from '@/game/storage';
import { StartScreen } from '@/screens/StartScreen';
import { LevelMap } from '@/screens/LevelMap';
import { GameScreen } from '@/screens/GameScreen';
import { SiteDialog } from '@/site/Dialog';

type Screen = 'start' | 'map' | 'game';

export default function MathApp({ onHome }: { onHome: () => void }) {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>('start');
  const [levelId, setLevelId] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const [siteExit, setSiteExit] = useState(false);
  const { w, h } = useViewport();

  useEffect(() => {
    setSoundEnabled(save.sound && !siteExit);
    if (siteExit) stopVoice();
  }, [save.sound, siteExit]);

  useEffect(() => {
    storeSave(save);
  }, [save]);

  useEffect(() => {
    document.body.classList.add('game-active');
    document.title = 'Математика с Белочкой | PlayKids';
    const unlock = () => unlockAudio();
    const onVis = () => {
      if (document.hidden) stopVoice();
    };
    // готовим аудио заранее: контекст проснётся после первого касания
    getCtx();
    void loadVoice();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', onVis);
    // предзагрузка картинок
    [squirrelImg, stumpImg, ...ALL_OBJECT_IMAGES].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    return () => {
      document.body.classList.remove('game-active');
      stopVoice();
      setSoundEnabled(false);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const nextLevelId = levelId < LEVELS.length ? levelId + 1 : null;

  const toggleSound = () => {
    const next = !save.sound;
    setSoundEnabled(next);
    if (next) sfx.tap();
    else stopVoice();
    setSave((s) => ({ ...s, sound: next }));
  };

  const startLevel = (id: number) => {
    setLevelId(id);
    setRunKey((k) => k + 1);
    setScreen('game');
  };

  const finish = (stars: number) =>
    setSave((s) => ({ ...s, stars: { ...s.stars, [levelId]: Math.max(s.stars[levelId] ?? 0, stars) } }));

  return (
    <div className="fixed inset-0 overflow-hidden font-game text-cocoa">
      <img
        src={bg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: w < h * 1.15 ? '14% 50%' : '50% 50%' }}
      />
      <AnimatePresence mode="wait">
        {screen === 'start' && (
          <StartScreen
            key="start"
            avatar={save.avatar}
            onAvatar={(a) => setSave((s) => ({ ...s, avatar: a }))}
            onPlay={() => setScreen('map')}
            sound={save.sound}
            onToggleSound={toggleSound}
            onHome={onHome}
          />
        )}
        {screen === 'map' && (
          <LevelMap
            key="map"
            levels={LEVELS.map((l) => ({ id: l.id, name: l.name, desc: l.desc, icon: OBJECTS[l.icon].src, iconText: l.iconText }))}
            stars={save.stars}
            onBack={onHome}
            onPlay={startLevel}
            sound={save.sound}
            onToggleSound={toggleSound}
            mascot={{ src: squirrelImg, ratio: 1.574, label: 'Белочка' }}
            onReady={(allDone) => speak(allDone ? ['all_done'] : ['choose_level'])}
            onLocked={(id) => speak(['first_pass', num(id - 1)])}
            onMascotTap={() => speak(['map_info'])}
            text={{
              welcome: 'Выбери уровень!',
              allDone: 'Ура! Все уровни пройдены!',
              locked: (id) => `Сначала пройди уровень ${id - 1}!`,
              mascot: txt('map_info'),
            }}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            key={`game-${runKey}`}
            level={level}
            avatar={save.avatar}
            sound={save.sound}
            onToggleSound={toggleSound}
            onExit={() => setScreen('map')}
            onHome={() => setSiteExit(true)}
            onFinish={finish}
            onReplay={() => setRunKey((k) => k + 1)}
            onNext={nextLevelId ? () => startLevel(nextLevelId) : null}
          />
        )}
      </AnimatePresence>
      {siteExit && (
        <SiteDialog title="Вернуться на сайт?" onClose={() => setSiteExit(false)}>
          <p className="pk-dialog-description">Пройденные уровни и звёзды сохранятся. Незавершённый уровень при следующем входе начнётся заново.</p>
          <button type="button" className="pk-button pk-button--full" onClick={onHome}>На главную PlayKids</button>
          <button type="button" className="pk-text-button" style={{ marginTop: 15 }} onClick={() => setSiteExit(false)}>Остаться в игре</button>
        </SiteDialog>
      )}
    </div>
  );
}
