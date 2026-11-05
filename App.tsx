import { useEffect, useState } from 'react';
import MathApp from '@/game/MathApp';
import LettersApp from '@/letters/LettersApp';
import HomePage from '@/site/HomePage';

const routeFrom = (): 'site' | 'math' | 'letters' => {
  const hash = window.location.hash;
  if (hash.startsWith('#/games/letters')) return 'letters';
  if (hash.startsWith('#/games/math')) return 'math';
  return 'site';
};

export default function App() {
  const [route, setRoute] = useState(routeFrom);

  useEffect(() => {
    const onRouteChange = () => setRoute(routeFrom());
    window.addEventListener('hashchange', onRouteChange);
    return () => window.removeEventListener('hashchange', onRouteChange);
  }, []);

  return (
    <>
      {route === 'math' && <MathApp onHome={() => { window.location.hash = 'games'; }} />}
      {route === 'letters' && <LettersApp onHome={() => { window.location.hash = 'games'; }} />}
      {route === 'site' && <HomePage onPlay={(r) => { window.location.hash = r; }} />}
    </>
  );
}
