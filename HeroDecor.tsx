import puzzle from '@/assets/site/deco-puzzle.webp';
import star from '@/assets/site/deco-star.webp';
import rocket from '@/assets/site/deco-rocket.webp';
import blockA from '@/assets/site/deco-block-a.webp';
import books from '@/assets/site/deco-books.webp';
import blockOne from '@/assets/site/deco-block-1.webp';

const HEART =
  'M50 87C33 74 13 57 12 37C11 22 23 12 36 15C44 17 48 24 50 31C53 21 61 13 72 13C86 14 93 27 89 41C84 58 66 71 53 82C49 85 46 89 49 92';

/** Нарисованное от руки сердечко, как на референсе */
function HeartDoodle() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <path d={HEART} stroke="#F2B32A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d={HEART} stroke="#FFE07A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-1.6 -2)" />
    </svg>
  );
}

/* Позиции задаются в CSS в процентах от сцены, поэтому декор
   всегда остаётся на своих местах вокруг детей на любом экране. */
const ITEMS = [
  { id: 'heart' },
  { id: 'puzzle', src: puzzle },
  { id: 'star', src: star },
  { id: 'rocket', src: rocket },
  { id: 'block-a', src: blockA },
  { id: 'star-small', src: star },
  { id: 'block-1', src: blockOne },
  { id: 'books', src: books },
] as const;

export function HeroDecor() {
  return (
    <div className="pk-hero-decor" aria-hidden="true">
      {ITEMS.map((item) => (
        <span key={item.id} className={`pk-deco pk-deco--${item.id}`}>
          {'src' in item ? <img src={item.src} alt="" draggable={false} /> : <HeartDoodle />}
        </span>
      ))}
    </div>
  );
}
