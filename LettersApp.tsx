import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import bg from '@/assets/bg.webp';
import { useViewport } from '@/hooks/useViewport';
import { ALL_WORD_IMAGES, bear } from './words';
import { LETTERS_LEVELS } from './tasks';
import { getCtx, setSoundEnabled, sfx, unlockAudio } from '@/game/audio';
import { loadLettersVoice, speakL, stopLettersVoice } from './voice';
import { txt } from './phrases';
import { loadLettersSave, storeLettersSave, type LettersSave } from './storage';
import { LettersStartScreen } from '@/screens/letters/LettersStartScreen';
import { LettersGameScreen } from '@/screens/letters/LettersGameScreen';
import { LevelMap } from '@/screens/LevelMap';
import { SiteDialog } from '@/site/Dialog';

type Screen = 'start' | 'map' | 'game';

const BEAR_RATIO = 1.5082;

export default function LettersApp({ onHome }: { onHome: () => void }) {
  const [save, setSave] = useState<LettersSave>(() => loadLettersSave());
  const [screen, setScreen] = useState<Screen>('start');
  const [levelId, setLevelId] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const [siteExit, setSiteExit] = useState(false);
  const [avatar, setAvatar] = useState<'boy' | 'girl'>(() => loadSharedAvatar());
  const { w, h } = useViewport();

  useEffect(() => {
    setSoundEnabled(save.sound && !siteExit);
    if (siteExit) stopLettersVoice();
  }, [save.sound, siteExit]);

  useEffect(() => {
    storeLettersSave(save);
  }, [save]);

  useEffect(() => {
    document.body.classList.add('game-active');
    document.title = 'Знакомство с буквами | PlayKids';
    const unlock = () => unlockAudio();
    const onVis = () => {
      if (document.hidden) stopLettersVoice();
    };
    // готовим аудио заранее: контекст проснётся после первого касания
    getCtx();
    void loadLettersVoice();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', onVis);
    // предзагрузка картинок
    [bear, ...ALL_WORD_IMAGES].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    return () => {
      document.body.classList.remove('game-active');
      stopLettersVoice();
      setSoundEnabled(false);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const level = LETTERS_LEVELS.find((l) => l.id === levelId) ?? LETTERS_LEVELS[0];
  const nextLevelId = levelId < LETTERS_LEVELS.length ? levelId + 1 : null;

  const toggleSound = () => {
    const next = !save.sound;
    setSoundEnabled(next && !siteExit);
    if (next) sfx.tap();
    else stopLettersVoice();
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
          <LettersStartScreen
            key="start"
            avatar={avatar}
            onAvatar={setAvatar}
            onPlay={() => setScreen('map')}
            sound={save.sound}
            onToggleSound={toggleSound}
            onHome={onHome}
          />
        )}
        {screen === 'map' && (
          <LevelMap
            key="map"
            levels={LETTERS_LEVELS.map((l) => ({ id: l.id, name: l.name, desc: l.desc, icon: l.icon }))}
            stars={save.stars}
            onBack={onHome}
            onPlay={startLevel}
            sound={save.sound}
            onToggleSound={toggleSound}
            mascot={{ src: bear, ratio: BEAR_RATIO, label: 'Мишка' }}
            onReady={(allDone) => speakL(allDone ? ['all_done'] : ['choose_level'])}
            onLocked={() => speakL(['first_pass'])}
            onMascotTap={() => speakL(['map_info'])}
            text={{
              welcome: 'Выбери уровень!',
              allDone: 'Ура! Все уровни пройдены!',
              locked: (id) => `Сначала пройди уровень ${id - 1}!`,
              mascot: txt('map_info'),
            }}
          />
        )}
        {screen === 'game' && (
          <LettersGameScreen
            key={`game-${runKey}`}
            levelId={level.id}
            avatar={avatar}
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

/** Общий с математикой выбор персонажа хранится в профиле сайта */
function loadSharedAvatar(): 'boy' | 'girl' {
  try {
    const raw = localStorage.getItem('playkids:child-profile:v1');
    if (raw) {
      const d = JSON.parse(raw) as { avatar?: string };
      if (d.avatar === 'girl') return 'girl';
    }
    const math = localStorage.getItem('vesyolaya-matematika:v1');
    if (math) {
      const d = JSON.parse(math) as { avatar?: string };
      if (d.avatar === 'girl') return 'girl';
    }
  } catch {
    /* ignore */
  }
  return 'boy';
}
