import confetti from 'canvas-confetti';

const COLORS = ['#FFC524', '#FF8A00', '#6CC23F', '#2D9CDB', '#F2542D', '#B48CF2', '#ffffff'];

export function burstFrom(el?: Element | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  void confetti({
    particleCount: 70,
    spread: 80,
    startVelocity: 38,
    gravity: 1.1,
    ticks: 150,
    scalar: 0.95,
    origin: {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}

export function bigConfetti() {
  const end = Date.now() + 1500;
  void confetti({ particleCount: 140, spread: 110, startVelocity: 45, origin: { y: 0.45 }, colors: COLORS, scalar: 1.1, disableForReducedMotion: true });
  const frame = () => {
    void confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS, disableForReducedMotion: true });
    void confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
