import { useId } from 'react';

export function SunnyStar({ className = '' }: { className?: string }) {
  const id = `sun-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={id} x1="27" y1="7" x2="66" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE276" />
          <stop offset="0.55" stopColor="#FFC431" />
          <stop offset="1" stopColor="#FFA71B" />
        </linearGradient>
      </defs>
      <path d="M43 10Q50 -2 57 11L67 30L88 34Q103 36 92 48L76 64L79 86Q81 100 67 93L50 83L31 93Q18 99 21 84L24 64L8 49Q-3 37 13 34L34 30Z" fill={`url(#${id})`} stroke="#FFAD25" strokeWidth="3" />
      <path d="M45 13L35 34L14 38" stroke="#FFF0AF" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="36" cy="53" rx="4.5" ry="6" fill="#252441" />
      <ellipse cx="65" cy="53" rx="4.5" ry="6" fill="#252441" />
      <circle cx="37" cy="51" r="1.4" fill="white" />
      <circle cx="66" cy="51" r="1.4" fill="white" />
      <ellipse cx="29" cy="63" rx="6" ry="4" fill="#F58462" opacity="0.75" />
      <ellipse cx="72" cy="63" rx="6" ry="4" fill="#F58462" opacity="0.75" />
      <path d="M43 64Q50 76 58 64" stroke="#252441" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <a className={`pk-logo${footer ? ' pk-logo--footer' : ''}`} href="#home" aria-label="PlayKids, на главную">
      <SunnyStar className="pk-logo-star" />
      <span>
        <span className="pk-wordmark">PlayKids</span>
        <span className="pk-logo-tagline">Играя. Учимся. Растём.</span>
      </span>
    </a>
  );
}