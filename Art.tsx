import squirrel from '@/assets/squirrel.webp';
import meadow from '@/assets/bg.webp';
import apple from '@/assets/obj-apple.webp';
import butterfly from '@/assets/obj-butterfly.webp';
import strawberry from '@/assets/obj-strawberry.webp';
import family from '@/assets/site/family.webp';
import type { Article, GameKind } from './content';
import { SunnyStar } from './Brand';

export function GameArt({ kind }: { kind: GameKind }) {
  if (kind === 'math') {
    return (
      <div className="pk-game-art pk-math-art" aria-hidden="true">
        <img className="pk-math-bg" src={meadow} alt="" />
        <img className="pk-math-squirrel" src={squirrel} alt="" />
        <div className="pk-math-example">
          <div><img src={apple} alt="" /><img src={apple} alt="" /></div>
          <span>+</span><div><img src={apple} alt="" /></div>
        </div>
        <div className="pk-math-answers"><span>2</span><span className="is-answer">3</span><span>4</span></div>
      </div>
    );
  }
  if (kind === 'letters') {
    return (
      <div className="pk-game-art pk-letters-art" aria-hidden="true">
        <span className="pk-art-orbit" />
        <div className="pk-letter-block letter-a">А</div>
        <div className="pk-letter-block letter-b">Б</div>
        <div className="pk-letter-block letter-v">В</div>
        <svg viewBox="0 0 40 40" className="pk-art-spark"><path d="M20 0L24 15L40 20L24 24L20 40L15 24L0 20L15 15Z" fill="#F6BB45" /></svg>
      </div>
    );
  }
  return (
    <div className="pk-game-art pk-pairs-art" aria-hidden="true">
      <div className="pk-memory-tile"><img src={butterfly} alt="" /></div>
      <div className="pk-memory-tile"><img src={strawberry} alt="" /></div>
      <div className="pk-memory-tile tile-back">?</div>
      <div className="pk-memory-tile"><img src={butterfly} alt="" /></div>
    </div>
  );
}

export function ProgramArt() {
  return (
    <div className="pk-program-art" aria-hidden="true">
      <div className="pk-program-orbit" />
      <SunnyStar className="pk-program-star" />
      <div className="pk-learning-book"><span /><span /></div>
      <div className="pk-number-block number-one">1</div>
      <div className="pk-number-block number-two">2</div>
      <div className="pk-number-block number-three">3</div>
      <svg className="pk-program-swirl" viewBox="0 0 100 100"><path d="M15 75Q75 95 75 42Q75 6 48 20Q19 44 62 54Q89 60 96 10" fill="none" stroke="#B7A2E1" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 10" /></svg>
    </div>
  );
}

export function ArticleArt({ art }: { art: Article['art'] }) {
  if (art === 'together') return <img className="pk-article-photo" src={family} alt="Мама и ребёнок вместе строят из деревянных кубиков" loading="lazy" />;
  if (art === 'counting') {
    return (
      <div className="pk-article-art pk-counting-art" aria-hidden="true">
        <span className="pk-count-number">1</span>
        <img src={apple} alt="" /><img src={apple} alt="" /><img src={apple} alt="" />
        <span className="pk-count-number">3</span>
        <span className="pk-count-doodle">+</span>
      </div>
    );
  }
  return (
    <div className="pk-article-art pk-mistakes-art" aria-hidden="true">
      <SunnyStar className="pk-article-star" />
      <span className="pk-drawn-check"><svg viewBox="0 0 80 80"><path d="M18 42L34 59L63 23" fill="none" stroke="#6AA78D" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </div>
  );
}